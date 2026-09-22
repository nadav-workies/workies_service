const normalizeEmail = (v) => String(v || "").trim().toLowerCase();

export const MONTHS_HE = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

/** Days from today until the next occurrence of the birthday (0 = today) */
export function daysUntilBirthday(birthdate) {
  const bd = new Date(birthdate + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
  if (next < today) next = new Date(now.getFullYear() + 1, bd.getMonth(), bd.getDate());
  return Math.round((next - today) / 86400000);
}

/** Resolve a tenant's birthdate — own field, or the matching registered user's */
export function tenantBirthdate(t, users) {
  if (t.birthdate) return t.birthdate;
  const email = normalizeEmail(t.email);
  const byEmail = users.find(u => normalizeEmail(u.email) === email && u.birthdate);
  if (email && byEmail) return byEmail.birthdate;
  const rn = String(t.room_number || "").trim();
  const byRoom = users.find(u => String(u.default_room_number || u.room_number || "").trim() === rn && u.birthdate);
  return rn && byRoom ? byRoom.birthdate : null;
}

/** Unified birthday rows for contacts + employees */
export function buildBirthdayRows(tenants, employees, users) {
  const rows = [];
  for (const t of tenants) {
    const bd = tenantBirthdate(t, users);
    if (!bd) continue;
    rows.push({
      key: `t-${t.id}`, kind: "contact", tenant: t, birthdate: bd,
      name: t.contact_name || t.customer_name || "—",
      customer: t.customer_name || "", room: t.room_label || t.room_number || "",
      email: t.email || "", phone: t.phone || "",
    });
  }
  const tenantById = new Map(tenants.map(t => [t.id, t]));
  for (const e of employees) {
    if (!e.birthdate) continue;
    const t = tenantById.get(e.tenant_id);
    rows.push({
      key: `e-${e.id}`, kind: "employee", tenant: t, employee: e, birthdate: e.birthdate,
      name: e.name, customer: e.customer_name || t?.customer_name || "",
      room: t?.room_label || e.room_number || t?.room_number || "",
      email: e.email || "", phone: e.phone || "",
    });
  }
  return rows.map(r => {
    const d = new Date(r.birthdate + "T00:00:00");
    return { ...r, month: d.getMonth(), day: d.getDate(), diffDays: daysUntilBirthday(r.birthdate), dateLabel: `${d.getDate()}/${d.getMonth() + 1}` };
  });
}