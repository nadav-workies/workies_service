import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import * as XLSX from 'npm:xlsx@0.18.5';
import { assertSafeFileUrl } from '../../shared/security.ts';
import { roomsByNumber, extractRoomNumber, isRoomlessSpace, normalizePhone } from '../../shared/rooms.ts';

const ARCHIVE_REASON = 'לא מופיע בדוח הלקוחות הפעילים האחרון';

function cleanCell(value: any): string {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '')
    .replace(/\u00A0/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function pick(row: Record<string, any>, aliases: string[]): string {
  for (const alias of aliases) {
    for (const key of Object.keys(row)) {
      if (cleanCell(key).toLowerCase() === alias.toLowerCase()) {
        const val = cleanCell(row[key]);
        if (val) return val;
      }
    }
  }
  return '';
}

function spaceKey(email: string, roomNumber: string, sourceLabel: string): string {
  return roomNumber
    ? `${email}|room:${roomNumber}`
    : `${email}|space:${sourceLabel.toLowerCase()}`;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized — admin only' }, { status: 403 });
    }

    const { file_url, dry_run } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url is required' }, { status: 400 });
    try {
      assertSafeFileUrl(file_url);
    } catch (urlErr) {
      return Response.json({ error: 'Invalid file_url: ' + urlErr.message }, { status: 400 });
    }

    const fileRes = await fetch(file_url);
    if (!fileRes.ok) return Response.json({ error: 'Failed to fetch file' }, { status: 400 });
    const buffer = await fileRes.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, blankrows: false });
    if (!matrix || matrix.length < 2) {
      return Response.json({ error: 'No data rows found in file' }, { status: 400 });
    }

    const headers = matrix[0].map((h: any) => cleanCell(h));
    const rawRows = matrix.slice(1)
      .filter(r => r.some(c => cleanCell(c) !== ''))
      .map(r => {
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => { if (h) obj[h] = r[i] ?? ''; });
        return obj;
      });

    // --- Build the desired active list from the file ---
    const activeRows: any[] = [];
    const skipped: any[] = [];
    const seen = new Set<string>();

    for (const row of rawRows) {
      const customerName = pick(row, ['לקוח', 'שם לקוח', 'שם הלקוח', 'customer_name']);
      const email = pick(row, ['אימייל', 'מייל', 'email']).toLowerCase();
      const phone = normalizePhone(pick(row, ['טלפון', 'נייד', 'phone']));
      const companyId = pick(row, ['ח.פ / ת.ז', 'ח.פ', 'חפ', 'ת.ז', 'company_id']);
      const sourceLabel = pick(row, ['משרדים', 'משרד', 'שם משרד', 'offices', 'office']);

      if (!customerName || !email) {
        skipped.push({ customer_name: customerName, email, reason: 'חסר שם לקוח או אימייל' });
        continue;
      }

      const roomNumber = extractRoomNumber(sourceLabel);
      const hasRoom = !!roomNumber;
      const roomData = hasRoom ? roomsByNumber.get(roomNumber) : null;
      const key = spaceKey(email, roomNumber, sourceLabel);
      if (seen.has(key)) {
        skipped.push({ customer_name: customerName, email, reason: 'שורה כפולה (אותו מייל ואותו משרד)' });
        continue;
      }
      seen.add(key);

      activeRows.push({
        key,
        customer_name: customerName,
        contact_name: customerName,
        email,
        phone,
        company_id: companyId,
        room_source_label: sourceLabel,
        room_number: roomNumber,
        room_code: roomData ? roomData.room_label : sourceLabel,
        room_label: roomData ? roomData.room_label : '',
        room_area: roomData ? roomData.room_area : (isRoomlessSpace(sourceLabel) ? 'עמדות חופשיות' : ''),
        has_room: hasRoom,
        matched_room: !!roomData,
        match_error: hasRoom && !roomData ? 'לא נמצא חדר תואם לפי מספר המשרד' : null,
        customer_status: 'active',
        raw_import_row: row,
      });
    }

    // --- Index existing tenants by email + room number ---
    const existing = await base44.asServiceRole.entities.RoomTenant.list('-created_date', 2000);
    const existingByKey = new Map<string, any>();
    for (const t of existing) {
      const email = String(t.email || '').trim().toLowerCase();
      if (!email) continue;
      const roomNumber = String(t.room_number || '').trim();
      const key = spaceKey(email, roomNumber, String(t.room_source_label || t.room_code || ''));
      if (!existingByKey.has(key)) existingByKey.set(key, t);
    }

    const matchedIds = new Set<string>();
    const toCreate: any[] = [];
    const toUpdate: any[] = [];

    for (const row of activeRows) {
      const match = existingByKey.get(row.key);
      if (match) {
        matchedIds.add(match.id);
        toUpdate.push({ id: match.id, row });
      } else {
        toCreate.push(row);
      }
    }

    const toArchive = existing.filter((t: any) =>
      !matchedIds.has(t.id) && String(t.customer_status || '').toLowerCase() !== 'archived'
    );

    if (dry_run) {
      return Response.json({
        ok: true,
        dry_run: true,
        detected_headers: headers,
        total_rows: rawRows.length,
        will_create: toCreate.map(r => ({ customer_name: r.customer_name, email: r.email, room: r.room_source_label, room_code: r.room_code })),
        will_update: toUpdate.map(u => ({ customer_name: u.row.customer_name, email: u.row.email, room: u.row.room_source_label, room_code: u.row.room_code })),
        will_archive: toArchive.map((t: any) => ({ customer_name: t.customer_name, email: t.email, room_number: t.room_number, room_code: t.room_code })),
        roomless_active: activeRows.filter(r => !r.has_room).map(r => ({ customer_name: r.customer_name, space: r.room_source_label })),
        skipped,
      });
    }

    const batchId = `sync_${Date.now()}`;
    const errors: string[] = [];
    let created = 0;
    let updated = 0;
    let archived = 0;

    for (const { id, row } of toUpdate) {
      try {
        await base44.asServiceRole.entities.RoomTenant.update(id, {
          customer_name: row.customer_name,
          contact_name: row.contact_name,
          email: row.email,
          phone: row.phone,
          company_id: row.company_id,
          room_source_label: row.room_source_label,
          room_number: row.room_number,
          room_code: row.room_code,
          room_label: row.room_label,
          room_area: row.room_area,
          has_room: row.has_room,
          matched_room: row.matched_room,
          match_error: row.match_error,
          customer_status: 'active',
          archived_at: null,
          archived_reason: null,
          source_system: 'active_customers_sync',
          last_import_batch_id: batchId,
          raw_import_row: row.raw_import_row,
        });
        updated++;
      } catch (err) {
        errors.push(`update ${row.email}: ${err.message}`);
      }
    }

    for (const row of toCreate) {
      try {
        await base44.asServiceRole.entities.RoomTenant.create({
          customer_name: row.customer_name,
          contact_name: row.contact_name,
          email: row.email,
          phone: row.phone,
          company_id: row.company_id,
          room_source_label: row.room_source_label,
          room_number: row.room_number,
          room_code: row.room_code,
          room_label: row.room_label,
          room_area: row.room_area,
          has_room: row.has_room,
          matched_room: row.matched_room,
          match_error: row.match_error,
          customer_status: 'active',
          is_primary_contact: true,
          invite_sent: false,
          source_system: 'active_customers_sync',
          last_import_batch_id: batchId,
          raw_import_row: row.raw_import_row,
        });
        created++;
      } catch (err) {
        errors.push(`create ${row.email}: ${err.message}`);
      }
    }

    const nowIso = new Date().toISOString();
    for (const t of toArchive) {
      try {
        await base44.asServiceRole.entities.RoomTenant.update(t.id, {
          customer_status: 'archived',
          archived_at: nowIso,
          archived_reason: ARCHIVE_REASON,
        });
        archived++;
      } catch (err) {
        errors.push(`archive ${t.email}: ${err.message}`);
      }
    }

    return Response.json({
      ok: true,
      dry_run: false,
      total_rows: rawRows.length,
      created,
      updated,
      archived,
      skipped: skipped.length,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}