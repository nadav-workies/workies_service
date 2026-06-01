// Quick ticket types with SLA definitions
export const QUICK_TICKETS = [
  { id: 1, ticket_type: "תחזוקת חדר", examples: "תלייה, צביעה, פתיחת דלת, תיקון חדר", sla_label: "עד 30 דקות", sla_minutes: 30, area: "משרד / חדר לקוח", priority: "גבוהה" },
  { id: 2, ticket_type: "מזגן SOS", examples: "מזגן לא עובד / תקלה משביתה", sla_label: "מענה ראשוני עד 30 דקות", sla_minutes: 30, area: "מיזוג", priority: "קריטית" },
  { id: 3, ticket_type: "מזגן סיום טיפול", examples: "תקלה שדורשת ספק חיצוני", sla_label: "עד 24 שעות", sla_minutes: 1440, area: "מיזוג", priority: "גבוהה" },
  { id: 4, ticket_type: "שירותים", examples: "מים ברצפה, סוללה, דלת, מאגרה, נייר, סבון", sla_label: "עד 10 דקות", sla_minutes: 10, area: "שירותים", priority: "קריטית" },
  { id: 5, ticket_type: "חדר ישיבות", examples: "HDMI, חיבור מערכת, בעיית מצגת", sla_label: "עד 5 דקות", sla_minutes: 5, area: "חדר ישיבות", priority: "קריטית" },
  { id: 6, ticket_type: "תאורה בחללים", examples: "תאורה בחדרים ובחללים ציבוריים", sla_label: "עד 30 דקות", sla_minutes: 30, area: "תחזוקה כללית", priority: "גבוהה" },
  { id: 7, ticket_type: "קודנים", examples: "קודן, צ׳יפ, בקר גישה", sla_label: "עד 30 דקות", sla_minutes: 30, area: "תחזוקה כללית", priority: "גבוהה" },
  { id: 8, ticket_type: "מכונת קפה", examples: "תקלה במכונת קפה", sla_label: "עד 20 דקות", sla_minutes: 20, area: "מטבחון", priority: "גבוהה" },
  { id: 9, ticket_type: "ניקיון חללים", examples: "ניקיון שוטף במסדרונות ובחללים", sla_label: "שוטף", sla_minutes: null, area: "ניקיון", priority: "רגילה" },
];

export const PRIORITY_SLA_MINUTES = {
  'רגילה': 48 * 60,
  'בינונית': 24 * 60,
  'גבוהה': 8 * 60,
  'קריטית': 2 * 60,
};

export function getSlaDeadline(createdAt, slaMinutes) {
  if (!slaMinutes) return null;
  const d = new Date(createdAt);
  d.setMinutes(d.getMinutes() + slaMinutes);
  return d.toISOString();
}

export function getSlaWarningAt(createdAt, slaMinutes) {
  if (!slaMinutes) return null;
  const created = new Date(createdAt);

  if (slaMinutes <= 5) return created.toISOString();

  let warningBefore;
  if (slaMinutes === 10) warningBefore = 5;
  else if (slaMinutes === 20) warningBefore = 10;
  else if (slaMinutes === 30) warningBefore = 15;
  else warningBefore = 30;

  return new Date(created.getTime() + (slaMinutes - warningBefore) * 60000).toISOString();
}

export function getSlaStatus(ticket) {
  if (ticket.status === 'נסגרה') return 'closed';
  if (!ticket.sla_deadline) return 'ok';
  const now = new Date();
  const deadline = new Date(ticket.sla_deadline);
  if (deadline < now) return 'breached';
  const warning = ticket.sla_warning_at ? new Date(ticket.sla_warning_at) : null;
  if (warning && now >= warning) return 'warning';
  return 'ok';
}

export function getTimeRemainingLabel(slaDeadline) {
  if (!slaDeadline) return { text: '—', breached: false };
  const now = new Date();
  const deadline = new Date(slaDeadline);
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    const over = Math.abs(diffMs);
    const h = Math.floor(over / 3600000);
    const m = Math.floor((over % 3600000) / 60000);
    return { text: h > 0 ? `חריגה ${h}ש׳ ${m}ד׳` : `חריגה ${m}ד׳`, breached: true };
  }

  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  if (h === 0) return { text: `${m} דק׳`, breached: false };
  if (h >= 24) return { text: `${Math.floor(h / 24)} ימים`, breached: false };
  return { text: `${h}ש׳ ${m}ד׳`, breached: false };
}

export function generateTicketNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `WK-${y}${m}${d}-${rand}`;
}

export const PRIORITY_COLORS = {
  'רגילה': 'bg-blue-100 text-blue-800',
  'בינונית': 'bg-amber-100 text-amber-800',
  'גבוהה': 'bg-orange-100 text-orange-800',
  'קריטית': 'bg-red-100 text-red-800',
};

export const STATUS_COLORS = {
  'פתוחה': 'bg-slate-100 text-slate-700',
  'שויכה לטיפול': 'bg-blue-100 text-blue-700',
  'בטיפול': 'bg-indigo-100 text-indigo-700',
  'ממתינה': 'bg-amber-100 text-amber-700',
  'טופלה': 'bg-emerald-100 text-emerald-700',
  'נסגרה': 'bg-green-100 text-green-800',
};

export function isManagerOrAdmin(user) {
  return user?.role === 'admin' || user?.role === 'manager';
}