export const MAINTENANCE_CATEGORIES = [
  { key: "general", label: "כללי", color: "bg-slate-100 text-slate-700" },
  { key: "electrical", label: "חשמל", color: "bg-yellow-100 text-yellow-800" },
  { key: "plumbing", label: "אינסטלציה", color: "bg-blue-100 text-blue-800" },
  { key: "cleaning", label: "ניקיון", color: "bg-green-100 text-green-800" },
  { key: "ac", label: "מיזוג", color: "bg-cyan-100 text-cyan-800" },
  { key: "repairs", label: "תיקונים", color: "bg-orange-100 text-orange-800" },
  { key: "inspection", label: "ביקורת", color: "bg-purple-100 text-purple-800" },
  { key: "safety", label: "בטיחות", color: "bg-red-100 text-red-800" },
  { key: "other", label: "אחר", color: "bg-slate-100 text-slate-700" },
];

export const MAINTENANCE_STATUSES = [
  { key: "planned", label: "מתוכננת", color: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  { key: "in_progress", label: "בביצוע", color: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  { key: "done", label: "בוצע", color: "bg-green-100 text-green-800", dot: "bg-green-500" },
  { key: "not_done", label: "לא בוצע", color: "bg-red-100 text-red-800", dot: "bg-red-500" },
  { key: "checked", label: "נבדק/בוקר", color: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-600" },
  { key: "cancelled", label: "בוטלה", color: "bg-gray-200 text-gray-600", dot: "bg-gray-400" },
];

export const MAINTENANCE_APPROVAL_STATUSES = [
  { key: "pending_approval", label: "ממתינה לאישור", color: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  { key: "approved", label: "מאושרת / משובצת", color: "bg-green-100 text-green-800", dot: "bg-green-500" },
  { key: "rejected", label: "נדחתה", color: "bg-red-100 text-red-800", dot: "bg-red-500" },
];

export const getApprovalStatus = (k) => MAINTENANCE_APPROVAL_STATUSES.find(s => s.key === k) || MAINTENANCE_APPROVAL_STATUSES[0];

export const MAINTENANCE_PRIORITIES = [
  { key: "low", label: "נמוכה", color: "text-slate-500" },
  { key: "medium", label: "בינונית", color: "text-orange-600" },
  { key: "high", label: "גבוהה", color: "text-red-600" },
];

export const DEFAULT_WORKER = "עטיה";

export const getCategory = (k) => MAINTENANCE_CATEGORIES.find(c => c.key === k) || MAINTENANCE_CATEGORIES[0];
export const getStatus = (k) => MAINTENANCE_STATUSES.find(s => s.key === k) || MAINTENANCE_STATUSES[0];
export const getPriority = (k) => MAINTENANCE_PRIORITIES.find(p => p.key === k) || MAINTENANCE_PRIORITIES[1];

export const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? 6 : day - 1);
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
};

export const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const WEEKDAYS = [
  { key: 0, label: "ראשון" },
  { key: 1, label: "שני" },
  { key: 2, label: "שלישי" },
  { key: 3, label: "רביעי" },
  { key: 4, label: "חמישי" },
  { key: 5, label: "שישי" },
  { key: 6, label: "שבת" },
];

export const formatHebrewDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "numeric" });
  } catch { return dateStr; }
};