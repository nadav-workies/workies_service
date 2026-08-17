export const WORK_STATUS_ORDER = [
  "idea", "to_plan", "to_write", "draft_ready", "needs_visual",
  "ready_for_approval", "approved", "published", "dismissed",
];

export const WORK_STATUS_LABELS = {
  idea: "רעיון",
  to_plan: "לתכנון",
  to_write: "לכתיבה",
  draft_ready: "טיוטה מוכנה",
  needs_visual: "נדרש ויז׳ואל",
  ready_for_approval: "מוכן לאישור",
  approved: "אושר לפרסום",
  published: "פורסם",
  dismissed: "נדחה",
};

export const WORK_STATUS_COLORS = {
  idea: "bg-blue-100 text-blue-700",
  to_plan: "bg-cyan-100 text-cyan-700",
  to_write: "bg-amber-100 text-amber-700",
  draft_ready: "bg-purple-100 text-purple-700",
  needs_visual: "bg-pink-100 text-pink-700",
  ready_for_approval: "bg-indigo-100 text-indigo-700",
  approved: "bg-green-100 text-green-700",
  published: "bg-emerald-100 text-emerald-700",
  dismissed: "bg-gray-100 text-gray-500",
};

// legacy statuses -> operational statuses
export function normalizeStatus(s) {
  if (s === "planned") return "to_plan";
  return WORK_STATUS_LABELS[s] ? s : "idea";
}

export const CONTENT_FORMAT_LABELS = {
  post: "פוסט",
  reels: "רילס",
  story: "סטורי",
  carousel: "קרוסלה",
  newsletter: "ניוזלטר",
  whatsapp: "וואטסאפ קהילה",
  linkedin: "לינקדאין",
  other: "אחר",
};

export const FULL_DAY_ORDER = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export const FULL_DAY_LABELS = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
  friday: "שישי",
  saturday: "שבת",
};

export function toLocalDateStr(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toLocalDateStr(d);
}

// planned_date if set, otherwise derived from week_start_date + day_of_week
export function effectiveDate(item) {
  if (item.planned_date) return item.planned_date;
  if (item.week_start_date) {
    const idx = FULL_DAY_ORDER.indexOf(item.day_of_week);
    return addDays(item.week_start_date, idx >= 0 ? idx : 0);
  }
  return null;
}

export function hebDate(dateStr) {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  return `${Number(d)}.${Number(m)}`;
}