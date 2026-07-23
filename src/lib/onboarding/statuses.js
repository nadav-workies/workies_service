// Status configs — extracted from onboardingTemplate.js
// Spec v1.2 Section 5 (expanded statuses), Section 14.3, Section 26.3, Section 27.3

export const STAGE_STATUS_CONFIG = {
  not_started: { label: "טרם התחיל", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  available: { label: "זמין ללמידה", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  learning: { label: "בלמידה", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  guided_practice: { label: "בתרגול מודרך", color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  application: { label: "ביישום", color: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-500" },
  quiz_pending: { label: "ממתין למבדק", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  failed: { label: "נכשל במבדק", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
  relearning: { label: "נדרשת למידה מחדש", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
  required_feedback: { label: "ממתין למשוב חונך", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  completed: { label: "הושלם", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  reopened: { label: "נפתח מחדש", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
};

export const TRACK_STATUS_CONFIG = {
  draft: { label: "טיוטה", color: "bg-gray-100 text-gray-600" },
  pending: { label: "ממתין להתחלה", color: "bg-blue-100 text-blue-700" },
  active: { label: "פעיל", color: "bg-green-100 text-green-700" },
  at_risk: { label: "בסיכון", color: "bg-red-100 text-red-700" },
  paused: { label: "מושהה", color: "bg-orange-100 text-orange-700" },
  completed: { label: "הושלם", color: "bg-green-100 text-green-700" },
  closed: { label: "נסגר", color: "bg-gray-100 text-gray-600" },
};

export const CATEGORY_LABELS = {
  hr: "משאבי אנוש",
  service: "שירות",
  operations: "תפעול",
  aio: "AIO",
  customers: "לקוחות",
  events: "אירועים",
  social: "סושיאל וקהילה",
  community: "קהילה",
  podcast: "פודקאסט",
  review: "סיכום",
};

export const TASK_STATUS_CONFIG = {
  pending: { label: "טרם בוצע", color: "bg-gray-100 text-gray-600" },
  in_progress: { label: "בביצוע", color: "bg-blue-100 text-blue-700" },
  done: { label: "בוצע", color: "bg-green-100 text-green-700" },
  revision_required: { label: "נדרש תיקון", color: "bg-orange-100 text-orange-700" },
};

export const REVIEW_TYPE_CONFIG = {
  daily: { label: "סיכום יומי", color: "bg-blue-100 text-blue-700" },
  week_1: { label: "סוף שבוע ראשון", color: "bg-indigo-100 text-indigo-700" },
  week_2: { label: "סוף שבוע שני", color: "bg-purple-100 text-purple-700" },
  day_30: { label: "30 יום", color: "bg-amber-100 text-amber-700" },
  day_60: { label: "60 יום", color: "bg-amber-100 text-amber-700" },
  day_90: { label: "90 יום", color: "bg-green-100 text-green-700" },
};

// Spec v1.2 Section 14.3 — KPI readiness statuses
export const KPI_READINESS_STATUS_CONFIG = {
  not_started: { label: "טרם נלמד", color: "bg-gray-100 text-gray-600" },
  introduced: { label: "הוצג", color: "bg-blue-100 text-blue-700" },
  practicing: { label: "בתרגול", color: "bg-blue-100 text-blue-700" },
  partial_understanding: { label: "הבנה חלקית", color: "bg-orange-100 text-orange-700" },
  good_understanding: { label: "הבנה טובה", color: "bg-green-100 text-green-700" },
  reinforcement_required: { label: "נדרש חיזוק", color: "bg-red-100 text-red-700" },
  ready_for_guided_application: { label: "מוכן ליישום מלווה", color: "bg-green-100 text-green-700" },
  onboarding_completed: { label: "הושלם בחפיפה", color: "bg-green-100 text-green-700" },
};

// Spec v1.2 Section 26.3 — Learning item statuses
export const LEARNING_ITEM_STATUS_CONFIG = {
  locked: { label: "נעולה", color: "bg-gray-100 text-gray-600" },
  available: { label: "זמינה", color: "bg-blue-100 text-blue-700" },
  opened: { label: "נפתחה", color: "bg-blue-100 text-blue-700" },
  learning: { label: "בלמידה", color: "bg-blue-100 text-blue-700" },
  clarification_needed: { label: "נדרשת הבהרה", color: "bg-orange-100 text-orange-700" },
  awaiting_admin: { label: "ממתינה לתשובת אדמין", color: "bg-amber-100 text-amber-700" },
  ready_for_practice: { label: "מוכנה לתרגול", color: "bg-cyan-100 text-cyan-700" },
  practicing: { label: "בתרגול", color: "bg-indigo-100 text-indigo-700" },
  completed: { label: "הושלמה", color: "bg-green-100 text-green-700" },
  reopened: { label: "נפתחה מחדש", color: "bg-orange-100 text-orange-700" },
};

// Spec v1.2 Section 27.3 — Clarification request statuses
export const CLARIFICATION_STATUS_CONFIG = {
  submitted: { label: "נשלחה", color: "bg-blue-100 text-blue-700" },
  received: { label: "התקבלה", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "בטיפול", color: "bg-orange-100 text-orange-700" },
  answered: { label: "נענתה", color: "bg-green-100 text-green-700" },
  content_update_required: { label: "נדרש עדכון תוכן", color: "bg-red-100 text-red-700" },
  closed: { label: "נסגרה", color: "bg-gray-100 text-gray-600" },
};

// Spec v1.2 Section 17 — Daily learning plan day types
export const DAY_TYPE_CONFIG = {
  learning: { label: "למידה", color: "bg-blue-100 text-blue-700" },
  guided_practice: { label: "תרגול מודרך", color: "bg-indigo-100 text-indigo-700" },
  live_application: { label: "יישום בזמן אמת", color: "bg-cyan-100 text-cyan-700" },
  review: { label: "סיכום", color: "bg-purple-100 text-purple-700" },
  completion: { label: "השלמה", color: "bg-green-100 text-green-700" },
};

// Spec v1.2 Section 17 — Daily learning item types
export const LEARNING_ITEM_TYPE_CONFIG = {
  lesson: { label: "לומדה", icon: "BookOpen" },
  video: { label: "סרטון", icon: "Video" },
  document: { label: "מסמך", icon: "FileText" },
  link: { label: "קישור", icon: "Link" },
  quiz: { label: "מבדק", icon: "HelpCircle" },
  simulation_task: { label: "משימת סימולציה", icon: "FlaskConical" },
  live_task: { label: "משימת אמת", icon: "CheckSquare" },
  mentor_session: { label: "פגישת חונך", icon: "Users" },
  review_meeting: { label: "שיחת בקרה", icon: "MessageSquare" },
};