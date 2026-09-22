import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as XLSX from 'npm:xlsx@0.18.5';
import { assertSafeFileUrl } from '../../shared/security.ts';
import { roomsByNumber, normalizePhone } from '../../shared/rooms.ts';

// Room map + phone normalization live in base44/shared/rooms.ts

// --- Normalization helpers ---

function toStr(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function toNum(val: any): number | undefined {
  if (val === null || val === undefined || val === "") return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}



function normalizeRoomCode(value: any): string {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

// Extract the room number from a room code like "I - 09", "II 65", "VI + VIEW 31"
function extractRoomNumber(roomCode: string): string {
  const m = roomCode.match(/\d+/);
  if (!m) return "";
  return String(parseInt(m[0], 10));
}

function normalizeDate(val: any): string {
  const s = toStr(val);
  if (!s) return "";
  // Try to parse various date formats
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return s;
}

// Clean a header string: strip BOM, RTL/LTR marks, NBSP, collapse whitespace
function cleanHeader(value: any): string {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/[\u200E\u200F\u202A-\u202E]/g, "")
    .replace(/\u00A0/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeKey(key: any): string {
  return cleanHeader(key).toLowerCase();
}

// Read a value from a row by trying multiple possible column names (aliases).
// Exact normalized match only (no fuzzy contains) — rows are built manually
// from cleaned headers so keys are deterministic.
function getValue(row: any, aliases: string[]): any {
  const entries = Object.keys(row).map(key => ({
    key,
    normKey: normalizeKey(key),
    value: row[key]
  }));

  for (const alias of aliases) {
    const normAlias = normalizeKey(alias);
    const exact = entries.find(e => e.normKey === normAlias);
    if (
      exact &&
      exact.value !== undefined &&
      exact.value !== null &&
      String(exact.value).trim() !== ""
    ) {
      return exact.value;
    }
  }

  return "";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized — admin only' }, { status: 403 });
    }

    const { file_url, dry_run } = await req.json();
    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    // --- SSRF guard: only public https URLs are fetched ---
    try {
      assertSafeFileUrl(file_url);
    } catch (urlErr) {
      return Response.json({ error: 'Invalid file_url: ' + urlErr.message }, { status: 400 });
    }

    // --- Fetch and parse the file directly (handles both Excel and CSV) ---
    const fileRes = await fetch(file_url);
    if (!fileRes.ok) {
      return Response.json({ error: 'Failed to fetch file from storage' }, { status: 400 });
    }
    const buffer = await fileRes.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    // Detect file type: Excel (xlsx) starts with PK (0x50 0x4B), Excel (xls) starts with 0xD0 0xCF
    const isExcel = (uint8.length > 1 && uint8[0] === 0x50 && uint8[1] === 0x4B) ||
                    (uint8.length > 1 && uint8[0] === 0xD0 && uint8[1] === 0xCF);
    let workbook;
    if (isExcel) {
      workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    } else {
      // CSV — decode as UTF-8 to preserve Hebrew headers correctly
      const text = new TextDecoder('utf-8').decode(buffer);
      workbook = XLSX.read(text, { type: 'string', cellDates: true });
    }
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read the entire sheet as a matrix (array of arrays).
    // We build row objects manually by index so that Hebrew header keys
    // are never mangled by sheet_to_json's key-derivation logic.
    const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
      blankrows: false
    });

    if (!matrix || matrix.length < 2) {
      return Response.json(
        { error: "No data rows found in file", detected_headers: [] },
        { status: 400 }
      );
    }

    const detectedHeaders: string[] = matrix[0].map((h: any) => cleanHeader(h));

    const rows: any[] = matrix
      .slice(1)
      .filter((row: any[]) => row.some(cell => String(cell ?? "").trim() !== ""))
      .map((row: any[]) => {
        const obj: Record<string, any> = {};
        detectedHeaders.forEach((header, index) => {
          if (!header) return;
          obj[header] = row[index] ?? "";
        });
        return obj;
      });

    console.log("Detected tenant import headers:", JSON.stringify(detectedHeaders));
    console.log("First parsed row keys:", JSON.stringify(Object.keys(rows[0] || {})));
    console.log("First parsed row raw:", JSON.stringify(rows[0] || {}));

    if (rows.length === 0) {
      return Response.json({ error: 'No rows found in file', detected_headers: detectedHeaders }, { status: 400 });
    }

    const batchId = `import_${Date.now()}_${user.email}`;
    const previewRows: any[] = [];
    const seenKeys = new Set<string>();

    for (const row of rows) {
      // Read columns by alias — supports both Hebrew and English header names
      const customerName = toStr(getValue(row, ["שם הלקוח", "שם לקוח", "שם החברה", "שם חברה", "Name", "Customer Name", "customer_name"]));
      const companyId = toStr(getValue(row, ["חפ/עמ", "ח.פ", "חפ", "ח.פ.", "ח.פ / עמ", "company", "company_id"]));
      const email = toStr(getValue(row, ["email", "Email", "אימייל", "מייל"])).toLowerCase();
      const phone = normalizePhone(getValue(row, ["phone-number", "phone number", "Phone", "טלפון", "נייד", "phone"]));
      const roomSourceLabel = toStr(getValue(row, ["שם משרד פיקספייס", "שם משרד", "Offices", "office"]));
      const roomCodeRaw = normalizeRoomCode(getValue(row, ["קוד משרד", "קוד", "room_code", "office_code"]));
      const deskCount = toNum(getValue(row, ["כמות עמדות מושכרת ללקוח", "עמדות מושכרות", "עמדות", "Number of desks", "desk_count"]));
      const securityAmount = toNum(getValue(row, ["Security", "פיקדון", "ביטחונות", "security_amount", "deposit"]));
      const paymentMethod = toStr(getValue(row, ["שיטת תשלום", "payment_method"]));
      const address = toStr(getValue(row, ["address", "כתובת"]));
      const leaseStart = normalizeDate(getValue(row, ["תאריך הצטרפות וורקיז", "Date Joined", "lease_start_date"]));
      const industry = toStr(getValue(row, ["תחום", "Industry", "industry"]));
      const customerStatus = toStr(getValue(row, ["סטאטוס לקוח", "סטטוס לקוח", "Status", "customer_status"])).toLowerCase();
      const autoChargeDay = toNum(getValue(row, ["Auto Charge Day", "יום חיוב אוטומטי", "auto_charge_day"]));
      const contactName = customerName;

      if (previewRows.length === 0) {
        console.log("First mapped tenant row:", JSON.stringify({
          customerName,
          companyId,
          email,
          phone,
          roomSourceLabel,
          roomCodeRaw,
          deskCount,
          customerStatus
        }));
      }

      // Determine match status
      let matchStatus = "";
      let matchedRoom = false;
      let matchError: string | null = null;
      let roomNumber = "";
      let roomLabel = "";
      let roomArea = "";

      if (!roomCodeRaw) {
        matchStatus = "חסר קוד משרד";
      } else if (!customerName) {
        matchStatus = "חסר שם לקוח";
      } else if (!email) {
        matchStatus = "חסר אימייל";
      } else {
        const dupKey = `${roomCodeRaw}|${email}`;
        if (seenKeys.has(dupKey)) {
          matchStatus = "קוד משרד כפול באותו אימייל";
        } else if (customerStatus && customerStatus !== "active") {
          matchStatus = "לא נטען — סטטוס לא פעיל";
        } else {
          // Try to match room by extracting room number from code
          roomNumber = extractRoomNumber(roomCodeRaw);
          const roomData = roomNumber ? roomsByNumber.get(roomNumber) : null;
          if (roomData) {
            matchedRoom = true;
            roomLabel = roomData.room_label;
            roomArea = roomData.room_area;
            matchStatus = "נמצא חדר תואם";
          } else {
            matchError = "לא נמצא חדר תואם לפי קוד משרד";
            matchStatus = "לא נמצא חדר תואם";
          }
          seenKeys.add(dupKey);
        }
      }

      const willSave = matchStatus === "נמצא חדר תואם" || matchStatus === "לא נמצא חדר תואם";

      previewRows.push({
        room_code: roomCodeRaw,
        room_source_label: roomSourceLabel,
        room_number: roomNumber,
        room_label: roomLabel,
        room_area: roomArea,
        customer_name: customerName,
        contact_name: contactName,
        company_id: companyId,
        email,
        phone,
        desk_count: deskCount,
        security_amount: securityAmount,
        payment_method: paymentMethod,
        address,
        lease_start_date: leaseStart,
        industry,
        customer_status: customerStatus,
        auto_charge_day: autoChargeDay,
        matched_room: matchedRoom,
        match_error: matchError,
        match_status: matchStatus,
        will_save: willSave,
        is_primary_contact: true,
        contact_role: "",
        raw_import_row: row,
      });
    }

    const validRows = previewRows.filter(r => r.will_save);

    // If dry_run, return preview only
    if (dry_run) {
      return Response.json({
        ok: true,
        dry_run: true,
        total: rows.length,
        will_save: validRows.length,
        skipped: rows.length - validRows.length,
        preview: previewRows,
        detected_headers: detectedHeaders,
      });
    }

    // --- Actual save: upsert by room_code + email ---
    // Load existing tenants
    const existing = await base44.asServiceRole.entities.RoomTenant.list("-created_date", 2000);
    const existingByKey: Record<string, any> = {};
    existing.forEach((t: any) => {
      if (t.room_code && t.email) {
        existingByKey[`${normalizeRoomCode(t.room_code)}|${t.email.toLowerCase()}`] = t;
      }
    });

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const row of validRows) {
      const key = `${row.room_code}|${row.email}`;
      try {
        const recordData = {
          room_code: row.room_code,
          room_source_label: row.room_source_label,
          room_number: row.room_number,
          room_label: row.room_label,
          room_area: row.room_area,
          customer_name: row.customer_name,
          contact_name: row.contact_name || row.customer_name,
          company_id: row.company_id,
          email: row.email,
          phone: row.phone,
          desk_count: row.desk_count,
          security_amount: row.security_amount,
          payment_method: row.payment_method,
          address: row.address,
          lease_start_date: row.lease_start_date,
          industry: row.industry,
          customer_status: row.customer_status,
          auto_charge_day: row.auto_charge_day,
          matched_room: row.matched_room,
          match_error: row.match_error,
          source_system: "active_customers_import",
          last_import_batch_id: batchId,
          raw_import_row: row.raw_import_row,
        };

        const existingRecord = existingByKey[key];
        if (existingRecord) {
          // Update — preserve invite_sent and is_primary_contact fields
          await base44.asServiceRole.entities.RoomTenant.update(existingRecord.id, recordData);
          updated++;
        } else {
          await base44.asServiceRole.entities.RoomTenant.create({
            ...recordData,
            is_primary_contact: true,
            contact_role: "",
            invite_sent: false,
          });
          created++;
        }
      } catch (err) {
        errors.push(`${row.email} (${row.room_code}): ${err.message}`);
      }
    }

    return Response.json({
      ok: true,
      dry_run: false,
      total: rows.length,
      created,
      updated,
      skipped: rows.length - validRows.length,
      errors: errors.slice(0, 20),
      detected_headers: detectedHeaders,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});