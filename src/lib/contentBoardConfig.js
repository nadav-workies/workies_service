export const WORK_STATUS_ORDER = [
  "idea", "planned", "in_progress", "draft_ready", "needs_approval",
  "approved", "published", "not_done", "cancelled",
];

export const WORK_STATUS_LABELS = {
  idea: "רעיון",
  planned: "מתוכנן",
  in_progress: "בעבודה",
  draft_ready: "טיוטה מוכנה",
  needs_approval: "ממתין לאישור",
  approved: "מאושר",
  published: "פורסם",
  not_done: "לא בוצע",
  cancelled: "בוטל",
};

export const WORK_STATUS_COLORS = {
  idea: "bg-blue-100 text-blue-700",
  planned: "bg-cyan-100 text-cyan-700",
  in_progress: "bg-amber-100 text-amber-700",
  draft_ready: "bg-purple-100 text-purple-700",
  needs_approval: "bg-indigo-100 text-indigo-700",
  approved: "bg-green-100 text-green-700",
  published: "bg-emerald-100 text-emerald-700",
  not_done: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export const WORK_STATUS_DOT_COLORS = {
  idea: "bg-blue-500",
  planned: "bg-cyan-500",
  in_progress: "bg-amber-500",
  draft_ready: "bg-purple-500",
  needs_approval: "bg-indigo-500",
  approved: "bg-green-500",
  published: "bg-emerald-500",
  not_done: "bg-red-500",
  cancelled: "bg-gray-400",
};

// legacy statuses -> current operational statuses
const LEGACY_STATUS_MAP = {
  to_plan: "planned",
  to_write: "in_progress",
  needs_visual: "in_progress",
  ready_for_approval: "needs_approval",
  dismissed: "cancelled",
};

export function normalizeStatus(s) {
  if (LEGACY_STATUS_MAP[s]) return LEGACY_STATUS_MAP[s];
  return WORK_STATUS_LABELS[s] ? s : "idea";
}

export const OUTPUT_TYPE_LABELS = {
  post: "פוסט",
  community_event: "אירוע קהילה",
  story: "סטורי",
  reels: "רילס",
  podcast: "פודקאסט",
};

export const SOURCE_TYPE_LABELS = {
  customer_interview: "ראיון לקוח",
  event_story_photos: "צילום אירוע לסטורי",
  survey: "סקר",
  conversation_transcript: "תמלול שיחה",
  meeting: "פגישה",
};

export const EXECUTION_STATUS_LABELS = {
  not_checked: "טרם נבדק",
  done: "בוצע",
  not_done: "לא בוצע",
};

export const KPI_GROUPS = [
  { key: "idea", label: "רעיונות" },
  { key: "planning", label: "בתכנון" },
  { key: "working", label: "בעבודה" },
  { key: "waiting_approval", label: "ממתין לאישור" },
  { key: "approved", label: "מאושר לשבוע" },
  { key: "done", label: "פורסם / בוצע" },
  { key: "not_done", label: "לא בוצע" },
];

export function matchesKpi(item, key) {
  const s = normalizeStatus(item.status);
  switch (key) {
    case "idea": return s === "idea";
    case "planning": return s === "planned";
    case "working": return s === "in_progress" || s === "draft_ready";
    case "waiting_approval": return s === "needs_approval";
    case "approved": return (item.final_approved || s === "approved") && s !== "published" && item.execution_status !== "done";
    case "done": return s === "published" || item.execution_status === "done";
    case "not_done": return s === "not_done" || item.execution_status === "not_done";
    default: return true;
  }
}

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