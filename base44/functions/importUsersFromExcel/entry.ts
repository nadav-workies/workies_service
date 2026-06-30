import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as XLSX from 'npm:xlsx@0.18.5';

// --- Helpers ---

function toStr(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function normalizePhone(value: any): string {
  if (value === null || value === undefined) return "";
  let raw = String(value).trim();
  if (/e\+/i.test(raw)) {
    const num = Number(raw);
    if (Number.isFinite(num)) {
      raw = String(Math.trunc(num));
    }
  }
  raw = raw.replace(/[^\d+]/g, "");
  if (raw.startsWith("972")) {
    raw = "+" + raw;
  }
  if (raw.length === 9 && raw.startsWith("5")) {
    raw = "+972" + raw;
  }
  if (raw.length === 10 && raw.startsWith("0")) {
    raw = "+972" + raw.slice(1);
  }
  return raw;
}

function normalizeRole(role: string): string {
  const r = String(role || "").trim().toLowerCase();
  if (r === 'admin' || r === 'מנהל מערכת') return 'admin';
  if (r === 'manager' || r === 'מנהל' || r === 'מנהלית') return 'manager';
  if (r === 'user' || r === 'משתמש') return 'user';
  return "";
}

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

function getValue(row: any, aliases: string[]): any {
  const entries = Object.keys(row).map(key => ({
    key,
    normKey: normalizeKey(key),
    value: row[key]
  }));
  for (const alias of aliases) {
    const normAlias = normalizeKey(alias);
    const exact = entries.find(e => e.normKey === normAlias);
    if (exact && exact.value !== undefined && exact.value !== null && String(exact.value).trim() !== "") {
      return exact.value;
    }
  }
  return "";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized — admin or manager only' }, { status: 403 });
    }

    const isAdmin = user.role === 'admin';

    const { file_url, dry_run, file_name } = await req.json();
    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    // --- Fetch and parse the file directly (handles both Excel and CSV) ---
    const fileRes = await fetch(file_url);
    if (!fileRes.ok) {
      return Response.json({ error: 'Failed to fetch file from storage' }, { status: 400 });
    }
    const buffer = await fileRes.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    const isExcel = (uint8.length > 1 && uint8[0] === 0x50 && uint8[1] === 0x4B) ||
                    (uint8.length > 1 && uint8[0] === 0xD0 && uint8[1] === 0xCF);
    let workbook;
    if (isExcel) {
      workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    } else {
      const text = new TextDecoder('utf-8').decode(buffer);
      workbook = XLSX.read(text, { type: 'string', cellDates: true });
    }
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
      blankrows: false
    });

    if (!matrix || matrix.length < 2) {
      return Response.json({ error: "No data rows found in file" }, { status: 400 });
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

    if (rows.length === 0) {
      return Response.json({ error: 'No rows found in file' }, { status: 400 });
    }

    // --- Load existing users by email ---
    const existingUsers = await base44.asServiceRole.entities.User.list("-created_date", 500);
    const usersByEmail: Record<string, any> = {};
    existingUsers.forEach((u: any) => {
      if (u.email) usersByEmail[u.email.toLowerCase()] = u;
    });

    const adminCount = existingUsers.filter((u: any) => u.role === 'admin').length;

    const previewRows: any[] = [];
    let willUpdate = 0;
    let notFound = 0;
    let skipped = 0;
    let permErrors = 0;

    for (const row of rows) {
      const email = toStr(getValue(row, ["email", "Email", "אימייל", "מייל", "כתובת מייל"])).toLowerCase();
      const fullName = toStr(getValue(row, ["שם מלא", "שם", "full_name", "name", "Full Name", "Name"]));
      const phone = toStr(getValue(row, ["טלפון", "phone", "phone-number", "phone number", "נייד", "mobile", "Phone"]));
      const roleRaw = toStr(getValue(row, ["תפקיד", "role", "Role"]));
      const roomNumber = toStr(getValue(row, ["חדר", "מספר חדר", "room_number", "default_room_number", "Room Number"]));
      const roomCode = toStr(getValue(row, ["קוד משרד", "קוד", "room_code", "office_code", "Office Code"]));
      const status = toStr(getValue(row, ["סטטוס", "status", "Status", "סטאטוס"]));

      if (!email) {
        previewRows.push({
          email: "",
          existing_name: "",
          new_name: fullName,
          existing_phone: "",
          new_phone: "",
          existing_role: "",
          new_role: "",
          action: "חסר אימייל",
          will_update: false,
        });
        skipped++;
        continue;
      }

      const existingUser = usersByEmail[email];
      if (!existingUser) {
        previewRows.push({
          email,
          existing_name: "",
          new_name: fullName,
          existing_phone: "",
          new_phone: phone ? normalizePhone(phone) : "",
          existing_role: "",
          new_role: roleRaw,
          action: "לא נמצא",
          will_update: false,
        });
        notFound++;
        continue;
      }

      // Build updates — only fields that have values
      const updates: Record<string, any> = {};
      if (fullName) updates.full_name = fullName;
      if (phone) updates.phone = normalizePhone(phone);
      if (roomNumber) updates.default_room_number = roomNumber;
      if (roomCode) updates.room_code = roomCode;
      if (status) updates.status = status;

      // Role protection
      let newRole = "";
      let roleAction = "";
      if (roleRaw) {
        const normalizedRole = normalizeRole(roleRaw);
        if (normalizedRole) {
          if (!isAdmin) {
            roleAction = "שגיאת הרשאה — Manager לא יכול לעדכן תפקיד";
            permErrors++;
          } else if (existingUser.role === 'admin' && normalizedRole !== 'admin' && adminCount <= 1) {
            roleAction = "לא ניתן להסיר הרשאת Admin מהאדמין היחיד";
            permErrors++;
          } else {
            updates.role = normalizedRole;
            newRole = normalizedRole;
          }
        }
      }

      const hasUpdates = Object.keys(updates).length > 0;

      if (hasUpdates) {
        willUpdate++;
      }

      previewRows.push({
        email,
        existing_name: existingUser.full_name || "",
        new_name: fullName || "",
        existing_phone: existingUser.phone || "",
        new_phone: phone ? normalizePhone(phone) : "",
        existing_role: existingUser.role || "",
        new_role: newRole || roleRaw,
        action: roleAction || (hasUpdates ? "יעודכן" : "אין שינוי"),
        will_update: hasUpdates && !roleAction,
        updates,
        user_id: existingUser.id,
      });
    }

    // --- Dry run: return preview only ---
    if (dry_run) {
      return Response.json({
        ok: true,
        dry_run: true,
        total: rows.length,
        will_update: willUpdate,
        not_found: notFound,
        skipped,
        perm_errors: permErrors,
        preview: previewRows,
      });
    }

    // --- Apply: update users ---
    let updatedCount = 0;
    const errors: string[] = [];

    for (const row of previewRows) {
      if (!row.will_update) continue;
      try {
        await base44.asServiceRole.entities.User.update(row.user_id, row.updates);
        updatedCount++;
      } catch (err) {
        errors.push(`${row.email}: ${err.message}`);
      }
    }

    // --- Save import log ---
    try {
      await base44.asServiceRole.entities.UserImportLog.create({
        imported_at: new Date().toISOString(),
        imported_by: user.email,
        file_name: file_name || "",
        file_url: file_url || "",
        total_rows: rows.length,
        updated_count: updatedCount,
        not_found_count: notFound,
        skipped_count: skipped,
        error_count: errors.length,
        raw_summary: {
          will_update: willUpdate,
          perm_errors: permErrors,
        },
      });
    } catch (logErr) {
      // Log failure should not block the response
      console.log("Failed to save import log:", logErr.message);
    }

    return Response.json({
      ok: true,
      dry_run: false,
      total: rows.length,
      updated: updatedCount,
      not_found: notFound,
      skipped,
      perm_errors: permErrors,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});