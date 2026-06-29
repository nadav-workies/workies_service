import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// --- Room list (inlined from WORKIES_ROOMS) ---
const ROOMS: { n: string; l: string; a: string }[] = [
  { n: "1", l: "V - O1", a: "משרדים" }, { n: "2", l: "IV - O2", a: "משרדים" },
  { n: "3", l: "IV - O3", a: "משרדים" }, { n: "4", l: "IV - O4", a: "משרדים" },
  { n: "5", l: "IV - O5", a: "משרדים" }, { n: "6", l: "VI + VIEW - O6 - בקר", a: "משרדים" },
  { n: "7", l: "V+ - O7", a: "משרדים" }, { n: "8", l: "CONFERENCE - O8", a: "חדרי ישיבות" },
  { n: "9", l: "I - O9", a: "משרדים" }, { n: "10", l: "II - O10", a: "משרדים" },
  { n: "11", l: "II - O11", a: "משרדים" }, { n: "12", l: "II - O12", a: "משרדים" },
  { n: "13", l: "I - O13", a: "משרדים" }, { n: "14", l: "II - O14 - בקר", a: "משרדים" },
  { n: "15", l: "II - O15", a: "משרדים" }, { n: "16", l: "II - O16", a: "משרדים" },
  { n: "17", l: "II - O17 - בקר", a: "משרדים" }, { n: "18", l: "II - O18", a: "משרדים" },
  { n: "19", l: "II - O19", a: "משרדים" }, { n: "20", l: "II - O20", a: "משרדים" },
  { n: "21", l: "I - O21", a: "משרדים" }, { n: "22", l: "22 II מורחב", a: "משרדים" },
  { n: "23", l: "23 II מורחב", a: "משרדים" }, { n: "24", l: "24 II מורחב", a: "משרדים" },
  { n: "25", l: "25 II מורחב", a: "משרדים" }, { n: "26", l: "26 CONFERENCE - בקר", a: "חדרי ישיבות" },
  { n: "27", l: "27 II מורחב - בקר", a: "משרדים" }, { n: "28", l: "28 CONFERENCE", a: "חדרי ישיבות" },
  { n: "29", l: "29 II מורחב", a: "משרדים" }, { n: "30", l: "30 II מורחב", a: "משרדים" },
  { n: "31", l: "31 VI + VIEW", a: "משרדים" }, { n: "32", l: "32 I", a: "משרדים" },
  { n: "33", l: "בקר - 33 IV +", a: "משרדים" }, { n: "34", l: "34 I - בקר", a: "משרדים" },
  { n: "35", l: "35 IV +", a: "משרדים" }, { n: "36", l: "36 VI + VIEW", a: "משרדים" },
  { n: "37", l: "37 I", a: "משרדים" }, { n: "38", l: "38 III - בקר", a: "משרדים" },
  { n: "39", l: "39 I", a: "משרדים" }, { n: "40", l: "40 I", a: "משרדים" },
  { n: "41", l: "41 I", a: "משרדים" }, { n: "42", l: "42 I", a: "משרדים" },
  { n: "43", l: "43 I - בקר", a: "משרדים" }, { n: "44", l: "44 I", a: "משרדים" },
  { n: "45", l: "45 I", a: "משרדים" }, { n: "46", l: "46 III", a: "משרדים" },
  { n: "47", l: "47 III", a: "משרדים" }, { n: "48", l: "48 III", a: "משרדים" },
  { n: "49", l: "49 I", a: "משרדים" }, { n: "50", l: "50 CHILL - בקר", a: "חללים משותפים" },
  { n: "51", l: "51 I", a: "משרדים" }, { n: "52", l: "52 II", a: "משרדים" },
  { n: "53", l: "53 II", a: "משרדים" }, { n: "54", l: "54 V", a: "משרדים" },
  { n: "55", l: "55 III בקר", a: "משרדים" }, { n: "56", l: "56 III", a: "משרדים" },
  { n: "57", l: "57 II", a: "משרדים" }, { n: "58", l: "II 58 בקר", a: "משרדים" },
  { n: "59", l: "59 II", a: "משרדים" }, { n: "60", l: "60 II", a: "משרדים" },
  { n: "61", l: "61 III", a: "משרדים" }, { n: "62", l: "62 III", a: "משרדים" },
  { n: "63", l: "63 III", a: "משרדים" }, { n: "64", l: "64 III", a: "משרדים" },
  { n: "65", l: "65 II", a: "משרדים" }, { n: "66", l: "66 II", a: "משרדים" },
  { n: "67", l: "67 II", a: "משרדים" }, { n: "68", l: "68 II", a: "משרדים" },
  { n: "69", l: "69 IV", a: "משרדים" }, { n: "70", l: "70 CONFERENCE", a: "חדרי ישיבות" },
  { n: "71", l: "71 III", a: "משרדים" }, { n: "72", l: "72 III", a: "משרדים" },
  { n: "73", l: "מס' 73 - III", a: "משרדים" }, { n: "74", l: "מס' 74 - בקר", a: "משרדים" },
  { n: "75", l: "מס' 75 - IV", a: "משרדים" }, { n: "76", l: "מס' 76 - I+", a: "משרדים" },
  { n: "77", l: "מס' 77 - II+", a: "משרדים" }, { n: "78", l: "מס' 78 II", a: "משרדים" },
  { n: "79", l: "מס' 79 - II+ - בקר", a: "משרדים" }, { n: "80", l: "מס' 80 II - בקר", a: "משרדים" },
  { n: "81", l: "מס' 81 I+", a: "משרדים" }, { n: "82", l: "מס' 82 - II", a: "משרדים" },
  { n: "83", l: "מס' 83 - III", a: "משרדים" }, { n: "84", l: "מס' 84 - I+", a: "משרדים" },
  { n: "85", l: "מס' 85 +IV - בקר", a: "משרדים" }, { n: "101", l: "101 III", a: "משרדים" },
  { n: "102", l: "102 III", a: "משרדים" }, { n: "103", l: "103 II", a: "משרדים" },
  { n: "104", l: "104 II - בקר", a: "משרדים" }, { n: "105", l: "105 II", a: "משרדים" },
];

const roomsByNumber = new Map(ROOMS.map(r => [r.n, { room_label: r.l, room_area: r.a }]));

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

function normalizePhone(value: any): string {
  if (value === null || value === undefined) return "";
  let raw = String(value).trim();
  // Excel scientific notation, e.g. 9.72525E+11
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

    // Extract data from the file
    const extractRes = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          customers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Name column — customer/company name" },
                company: { type: "string", description: "company column — company ID / ח.פ. MUST be string, not number" },
                email: { type: "string" },
                phone_number: { type: "string", description: "phone-number column. MUST be string, not number" },
                offices: { type: "string", description: "Offices column — room description like Office 9" },
                number_of_desks: { type: "number" },
                security: { type: "number" },
                payment_method: { type: "string" },
                address: { type: "string" },
                date_joined: { type: "string" },
                industry: { type: "string" },
                status: { type: "string" },
                auto_charge_day: { type: "number" },
                contact_name: { type: "string", description: "Contact name column if exists, otherwise same as Name" },
                room_code: { type: "string", description: "קוד column — full office code like I - 09, II 65, VI + VIEW 31. MUST be string" },
              },
            },
          },
        },
      },
    });

    if (!extractRes || extractRes.status !== 'success' || !extractRes.output) {
      return Response.json({ error: extractRes?.details || 'Failed to extract data from file' }, { status: 400 });
    }

    let rows: any[] = [];
    const output = extractRes.output;
    if (Array.isArray(output)) {
      rows = output;
    } else if (output?.customers && Array.isArray(output.customers)) {
      rows = output.customers;
    } else if (output?.data && Array.isArray(output.data)) {
      rows = output.data;
    }

    if (rows.length === 0) {
      return Response.json({ error: 'No rows found in file' }, { status: 400 });
    }

    const batchId = `import_${Date.now()}_${user.email}`;
    const previewRows: any[] = [];
    const seenKeys = new Set<string>();

    for (const row of rows) {
      const roomCodeRaw = normalizeRoomCode(row.room_code);
      const roomSourceLabel = toStr(row.offices);
      const customerName = toStr(row.name);
      const contactName = toStr(row.contact_name) || customerName;
      const email = toStr(row.email).toLowerCase();
      const phone = normalizePhone(row.phone_number);
      const companyId = toStr(row.company);
      const deskCount = toNum(row.number_of_desks);
      const securityAmount = toNum(row.security);
      const paymentMethod = toStr(row.payment_method);
      const address = toStr(row.address);
      const leaseStart = normalizeDate(row.date_joined);
      const industry = toStr(row.industry);
      const customerStatus = toStr(row.status).toLowerCase();
      const autoChargeDay = toNum(row.auto_charge_day);

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
        raw_import_row: {
          Name: row.name ?? "",
          company: row.company ?? "",
          email: row.email ?? "",
          "phone-number": row.phone_number ?? "",
          Offices: row.offices ?? "",
          "Number of desks": row.number_of_desks ?? "",
          Security: row.security ?? "",
          payment_method: row.payment_method ?? "",
          address: row.address ?? "",
          "Date Joined": row.date_joined ?? "",
          Industry: row.industry ?? "",
          Status: row.status ?? "",
          "Auto Charge Day": row.auto_charge_day ?? "",
          "קוד": row.room_code ?? "",
        },
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
          // Update — preserve invite_sent fields
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
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});