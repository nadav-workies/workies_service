export const QUICK_TICKET_LIST = [
  { id: 1, ticket_type: "תחזוקת חדר", sla_label: "עד 30 דקות", sla_minutes: 30, area: "משרד / חדר לקוח", priority: "גבוהה", examples: "תלייה, צביעה, פתיחת דלת, תיקון חדר" },
  { id: 2, ticket_type: "מזגן SOS", sla_label: "עד 30 דקות", sla_minutes: 30, area: "מיזוג", priority: "קריטית", examples: "מזגן לא עובד / תקלה משביתה" },
  { id: 3, ticket_type: "מזגן סיום טיפול", sla_label: "עד 24 שעות", sla_minutes: 1440, area: "מיזוג", priority: "גבוהה", examples: "תקלה שדורשת ספק חיצוני" },
  { id: 4, ticket_type: "שירותים", sla_label: "עד 10 דקות", sla_minutes: 10, area: "שירותים", priority: "קריטית", examples: "מים, סוללה, דלת, נייר, סבון" },
  { id: 5, ticket_type: "חדר ישיבות", sla_label: "עד 5 דקות", sla_minutes: 5, area: "חדר ישיבות", priority: "קריטית", examples: "HDMI, מצגת, מחשב" },
  { id: 6, ticket_type: "תאורה", sla_label: "עד 30 דקות", sla_minutes: 30, area: "תחזוקה כללית", priority: "גבוהה", examples: "תאורה בחדרים ובחללים" },
  { id: 7, ticket_type: "קודנים", sla_label: "עד 30 דקות", sla_minutes: 30, area: "תחזוקה כללית", priority: "גבוהה", examples: "קודן, צ׳יפ, בקר גישה" },
  { id: 8, ticket_type: "מכונת קפה", sla_label: "עד 20 דקות", sla_minutes: 20, area: "מטבחון", priority: "גבוהה", examples: "תקלה במכונת קפה" },
  { id: 9, ticket_type: "ניקיון חללים", sla_label: "שוטף", sla_minutes: null, area: "ניקיון", priority: "רגילה", examples: "ניקיון שוטף" },
];

export const PRIORITY_COLORS_MAP = {
  'קריטית': 'border-red-300 bg-red-50 hover:bg-red-100',
  'גבוהה': 'border-orange-300 bg-orange-50 hover:bg-orange-100',
  'בינונית': 'border-amber-300 bg-amber-50 hover:bg-amber-100',
  'רגילה': 'border-slate-200 bg-slate-50 hover:bg-slate-100',
};