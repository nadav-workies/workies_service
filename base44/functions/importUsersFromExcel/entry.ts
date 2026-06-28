import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function normalizeRole(role) {
  const r = String(role || "").trim().toLowerCase();
  if (r === 'admin' || r === 'מנהל מערכת' || r === 'מנהל מערכת') return 'admin';
  if (r === 'manager' || r === 'מנהל' || r === 'מנהלית') return 'manager';
  return 'user';
}

function toStr(val) {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized — admin only' }, { status: 403 });
    }

    const { file_url } = await req.json();
    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    // Extract data from the Excel file
    const extractRes = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          users: {
            type: "array",
            items: {
              type: "object",
              properties: {
                full_name: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                room_number: { type: "string" },
                room_label: { type: "string" },
                room_area: { type: "string" },
                role: { type: "string" }
              }
            }
          }
        }
      }
    });

    if (!extractRes || extractRes.status !== 'success' || !extractRes.output) {
      return Response.json({ error: extractRes?.details || 'Failed to extract data from file' }, { status: 400 });
    }

    // Normalize rows — handle both array and object-with-users responses
    let rows: any[] = [];
    const output = extractRes.output;
    if (Array.isArray(output)) {
      rows = output;
    } else if (output?.users && Array.isArray(output.users)) {
      rows = output.users;
    } else if (output?.data && Array.isArray(output.data)) {
      rows = output.data;
    }

    if (rows.length === 0) {
      return Response.json({ error: 'No user rows found in file' }, { status: 400 });
    }

    // Load existing registered users (by email)
    const existingUsers = await base44.asServiceRole.entities.User.list("-created_date", 500);
    const existingByEmail: Record<string, any> = {};
    existingUsers.forEach((u: any) => {
      if (u.email) existingByEmail[u.email.toLowerCase()] = u;
    });

    // Load existing imported users (by email)
    const existingImported = await base44.asServiceRole.entities.ImportedUser.list("-created_date", 1000);
    const importedByEmail: Record<string, any> = {};
    existingImported.forEach((iu: any) => {
      if (iu.email) importedByEmail[iu.email.toLowerCase()] = iu;
    });

    let updatedUsers = 0;
    let updatedImported = 0;
    let newImported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const email = toStr(row.email).toLowerCase();
      const fullName = toStr(row.full_name);
      if (!email) { skipped++; continue; }

      try {
        // 1) Check if this is an existing registered user
        const existingUser = existingByEmail[email];
        if (existingUser) {
          // Only fill in missing fields — never overwrite existing data
          const updates: Record<string, any> = {};
          if (!existingUser.default_room_number && toStr(row.room_number)) {
            updates.default_room_number = toStr(row.room_number);
          }
          if (!existingUser.default_room_label && toStr(row.room_label)) {
            updates.default_room_label = toStr(row.room_label);
          }
          if (!existingUser.default_room_area && toStr(row.room_area)) {
            updates.default_room_area = toStr(row.room_area);
          }
          if (!existingUser.default_location_type && toStr(row.room_number)) {
            updates.default_location_type = "room";
          }
          if (Object.keys(updates).length > 0) {
            await base44.asServiceRole.entities.User.update(existingUser.id, updates);
            updatedUsers++;
          }
          continue;
        }

        // 2) Check if this is an existing imported user
        const existingImportedUser = importedByEmail[email];
        if (existingImportedUser) {
          // Only fill in missing fields
          const updates: Record<string, any> = {};
          if (!existingImportedUser.full_name && fullName) updates.full_name = fullName;
          if (!existingImportedUser.phone && toStr(row.phone)) updates.phone = toStr(row.phone);
          if (!existingImportedUser.room_number && toStr(row.room_number)) updates.room_number = toStr(row.room_number);
          if (!existingImportedUser.room_label && toStr(row.room_label)) updates.room_label = toStr(row.room_label);
          if (!existingImportedUser.room_area && toStr(row.room_area)) updates.room_area = toStr(row.room_area);
          if (Object.keys(updates).length > 0) {
            await base44.asServiceRole.entities.ImportedUser.update(existingImportedUser.id, updates);
            updatedImported++;
          }
          continue;
        }

        // 3) New imported user — not registered yet
        await base44.asServiceRole.entities.ImportedUser.create({
          full_name: fullName,
          email,
          phone: toStr(row.phone),
          room_number: toStr(row.room_number),
          room_label: toStr(row.room_label),
          room_area: toStr(row.room_area),
          role: normalizeRole(row.role),
          registered: false,
          invite_count: 0,
          imported_at: new Date().toISOString(),
          imported_by: user.email,
        });
        newImported++;
      } catch (err) {
        errors.push(`${email}: ${err.message}`);
      }
    }

    return Response.json({
      ok: true,
      total: rows.length,
      updatedUsers,
      updatedImported,
      newImported,
      skipped,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});