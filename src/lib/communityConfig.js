export const CONVERSATION_TYPES = [
  { value: "intro", label: "שיחת היכרות" },
  { value: "service", label: "שיחת שירות" },
  { value: "community", label: "שיחת קהילה" },
  { value: "retention", label: "שיחת שימור" },
  { value: "sales", label: "שיחת מכירה" },
  { value: "onboarding", label: "שיחת חפיפה" },
  { value: "general", label: "שיחה כללית" },
];

export const CONVERSATION_TYPE_LABELS = CONVERSATION_TYPES.reduce((acc, t) => {
  acc[t.value] = t.label;
  return acc;
}, {});

export const CONVERSATION_TYPE_COLORS = {
  intro: "bg-blue-100 text-blue-700",
  service: "bg-orange-100 text-orange-700",
  community: "bg-purple-100 text-purple-700",
  retention: "bg-green-100 text-green-700",
  sales: "bg-pink-100 text-pink-700",
  onboarding: "bg-teal-100 text-teal-700",
  general: "bg-gray-100 text-gray-700",
};

export const INSIGHT_TYPE_LABELS = {
  business_domain: "תחום עיסוק",
  expertise: "התמחות",
  target_customer: "קהל יעד",
  need: "צורך",
  opportunity: "הזדמנות",
  content_idea: "רעיון תוכן",
  connection_idea: "רעיון חיבור",
  follow_up: "פעולת המשך",
  birthday: "יום הולדת",
  tag: "תווית",
};

export const INSIGHT_TYPE_COLORS = {
  business_domain: "bg-blue-100 text-blue-700",
  expertise: "bg-indigo-100 text-indigo-700",
  target_customer: "bg-cyan-100 text-cyan-700",
  need: "bg-amber-100 text-amber-700",
  opportunity: "bg-green-100 text-green-700",
  content_idea: "bg-purple-100 text-purple-700",
  connection_idea: "bg-pink-100 text-pink-700",
  follow_up: "bg-orange-100 text-orange-700",
  birthday: "bg-red-100 text-red-700",
  tag: "bg-gray-100 text-gray-700",
};

export const INSIGHT_STATUS_LABELS = {
  new: "חדש",
  reviewed: "נבדק",
  used: "שומש",
  dismissed: "נדחה",
};

export const INSIGHT_STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700",
  reviewed: "bg-gray-100 text-gray-700",
  used: "bg-green-100 text-green-700",
  dismissed: "bg-red-100 text-red-700",
};

export const CONFIDENCE_LABELS = {
  high: "גבוה",
  medium: "בינוני",
  low: "נמוך",
  unknown: "לא ידוע",
};

export const CONFIDENCE_COLORS = {
  high: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-red-100 text-red-700",
  unknown: "bg-gray-100 text-gray-700",
};

export const CONNECTION_STATUS_LABELS = {
  idea: "רעיון",
  to_review: "לבדיקה",
  approved: "מאושר",
  done: "בוצע",
  not_relevant: "לא רלוונטי",
};

export const CONNECTION_STATUS_COLORS = {
  idea: "bg-blue-100 text-blue-700",
  to_review: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  done: "bg-emerald-100 text-emerald-700",
  not_relevant: "bg-gray-100 text-gray-700",
};

export const DAY_LABELS = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
};

export const DAY_ORDER = ["sunday", "monday", "tuesday", "wednesday", "thursday"];

export const PLATFORM_LABELS = {
  facebook: "פייסבוק",
  instagram: "אינסטגרם",
  linkedin: "לינקדאין",
  story: "סטורי",
  whatsapp_community: "וואטסאפ קהילה",
  newsletter: "ניוזלטר",
};

export const PLATFORM_COLORS = {
  facebook: "bg-blue-100 text-blue-700",
  instagram: "bg-pink-100 text-pink-700",
  linkedin: "bg-indigo-100 text-indigo-700",
  story: "bg-purple-100 text-purple-700",
  whatsapp_community: "bg-green-100 text-green-700",
  newsletter: "bg-amber-100 text-amber-700",
};

export const CONTENT_STATUS_LABELS = {
  idea: "רעיון",
  planned: "מתוכנן",
  approved: "מאושר",
  published: "פורסם",
  dismissed: "נדחה",
};

export const CONTENT_STATUS_COLORS = {
  idea: "bg-blue-100 text-blue-700",
  planned: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  published: "bg-emerald-100 text-emerald-700",
  dismissed: "bg-gray-100 text-gray-700",
};

export const CONTENT_TYPE_LABELS = {
  customer_specific: "מותאם ללקוח",
  workies_general: "כללי לוורקיז",
};

export const CONTENT_TYPE_COLORS = {
  customer_specific: "bg-purple-100 text-purple-700",
  workies_general: "bg-teal-100 text-teal-700",
};

export const AI_ANALYSIS_STATUS_LABELS = {
  not_analyzed: "טרם נותח",
  analyzed: "נותח",
  failed: "נכשל",
};

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? 0 : day;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split("T")[0];
}