// Shared helpers for telling apart active customers (appear in the latest
// active-offices report) from archived ones (no longer renting).

export function isArchivedTenant(tenant) {
  return String(tenant?.customer_status || "").trim().toLowerCase() === "archived";
}

export function isActiveTenant(tenant) {
  return !isArchivedTenant(tenant);
}

export function tenantRoomDisplay(tenant) {
  if (tenant?.room_label) return tenant.room_label;
  if (tenant?.room_number) return `חדר ${tenant.room_number}`;
  if (tenant?.room_source_label) return tenant.room_source_label;
  return "ללא חדר";
}