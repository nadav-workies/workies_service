// ─── קובץ הרשאות מרכזי ──────────────────────────────────────────
// כל בדיקות ההרשאה במערכת צריכות לעבור דרך פונקציות אלו.
// אין לפזר בדיקות role === 'admin' וכו׳ ברחבי המסכים.

export function isAdmin(user) {
  return user?.role === "admin";
}

export function isManager(user) {
  return user?.role === "manager";
}

export function isManagerOrAdmin(user) {
  return ["admin", "manager"].includes(user?.role);
}

// ── פעולות רגישות — Admin בלבד ──────────────────────────────────

export function canDeleteRecords(user) {
  return isAdmin(user);
}

export function canManageSystemSettings(user) {
  return isAdmin(user);
}

export function canManageSlaSettings(user) {
  return isAdmin(user);
}

export function canOverrideSlaException(user) {
  return isAdmin(user);
}

export function canManagePermissions(user) {
  return isAdmin(user);
}

// ── ניהול לקוחות — Admin + Manager ────────────────────────────────

export function canManageCustomers(user) {
  return isManagerOrAdmin(user);
}

export function canImportCustomers(user) {
  return isManagerOrAdmin(user);
}

export function canInviteCustomers(user) {
  return isManagerOrAdmin(user);
}

export function canAddTenantToRoom(user) {
  return isManagerOrAdmin(user);
}

// ── צפייה וטיפול בקריאות — Admin + Manager ───────────────────────

export function canViewManagerDashboard(user) {
  return isManagerOrAdmin(user);
}

export function canViewAllTickets(user) {
  return isManagerOrAdmin(user);
}

export function canEditTicket(user) {
  return isManagerOrAdmin(user);
}

export function canCloseTicket(user) {
  return isManagerOrAdmin(user);
}