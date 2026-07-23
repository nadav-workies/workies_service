// KPI definitions — Spec v1.2 Section 14.2
// Five core KPIs connected to the onboarding process

export const KPI_DEFINITIONS = [
  {
    id: "sla",
    name: "SLA שירות",
    target_text: "לפי הגדרת SLA",
    description: "הבנת זמני תגובה, תיעוד, העברה, מעקב וסגירת מעגל",
    data_source: "AIO, קריאות שירות, קבלה וסושיאל",
    is_active: true,
    order_number: 1,
  },
  {
    id: "customer_satisfaction",
    name: "שביעות רצון לקוח",
    target_text: "יעד ארגוני להגדרה",
    description: "יצירת חוויית קבלה, אירוח, שירות וליווי איכותית",
    data_source: "סקרי לקוחות, פידבקים ותיעוד שירות",
    is_active: true,
    order_number: 2,
  },
  {
    id: "feedback_score",
    name: "ציון משוב",
    target_text: "יעד ארגוני להגדרה",
    description: "הנעה למשוב, קבלת משוב, תיעוד ולמידה ממנו",
    data_source: "טופס משוב, Google וסקר שירות",
    is_active: true,
    order_number: 3,
  },
  {
    id: "community_initiatives",
    name: "יוזמות קהילה",
    target_text: "2 יוזמות בשבוע",
    description: "זיהוי צורך, יצירת חיבור, שיחה יזומה או פעילות קהילה",
    data_source: "יומן קהילה, WhatsApp ותיעוד פעילות",
    is_active: true,
    order_number: 4,
  },
  {
    id: "social_content",
    name: "ייזום תוכן סושיאל",
    target_text: "1 תוכן ביום",
    description: "זיהוי הזדמנות תוכן, יצירה, פרסום ומענה למעורבות",
    data_source: "Facebook, Instagram ו-LinkedIn",
    is_active: true,
    order_number: 5,
  },
];

// Spec v1.2 Section 14.5 — KPI simulation tasks per KPI
export const KPI_SIMULATION_TASKS = {
  sla: [
    "קבלת תרחיש שירות וסיווג רמת דחיפות",
    "פתיחת קריאה מלאה עם כל שדות החובה",
    "ניסוח עדכון ביניים ללקוח",
    "העברה לגורם מטפל תוך שמירה על אחריות",
    "סגירת מעגל ותיעוד זמן התגובה והטיפול",
    "טיפול בפניית סושיאל המדמה פנייה שירותית",
  ],
  customer_satisfaction: [
    "סימולציית קבלת פנים ללקוח משרד",
    "הצגת המתחם לאורח חדש",
    "טיפול בלקוח שמביע חוסר שביעות רצון",
    "ליווי לקוח אירוע או פודקאסט",
    "זיהוי שלוש נקודות המשפיעות על חוויית הלקוח",
    "כתיבת סיכום שירות והצעת שיפור",
  ],
  feedback_score: [
    "בחירת הרגע הנכון לבקשת משוב",
    "ניסוח בקשת משוב טבעית",
    "חלוקת כרטיס דירוג או שליחת קישור",
    "תיעוד משוב חיובי",
    "תיעוד והעברת משוב שלילי",
    "ניסוח פעולה מתקנת בעקבות משוב",
  ],
  community_initiatives: [
    "שיחה יזומה עם דייר לצורך היכרות",
    "זיהוי צורך או הזדמנות לחיבור",
    "הצעת חיבור בין שני דיירים",
    "תכנון יוזמת קהילה קטנה",
    "כתיבת מטרת היוזמה, קהל ופעולת המשך",
    "תיעוד היוזמה ביומן הקהילה",
  ],
  social_content: [
    "זיהוי הזדמנות תוכן מתוך פעילות אמיתית",
    "התאמת אותו נושא ל-Facebook, Instagram ו-LinkedIn",
    "יצירת סטורי",
    "יצירת פוסט",
    "פרסום בפועל לפי תוכנית מאושרת",
    "מענה לתגובות או שאלות",
    "תיעוד נתוני מעורבות ראשוניים",
    "הצעת שיפור לפרסום הבא",
  ],
};

// Spec v1.2 Section 14.5 — KPI understanding check topics
export const KPI_UNDERSTANDING_TOPICS = {
  sla: [
    "מהו זמן תגובה לעומת זמן טיפול",
    "מתי מעבירים ומתי ממשיכים לטפל",
    "מדוע אין לסגור קריאה לפני עדכון הלקוח",
    "כיצד פנייה מהסושיאל נכנסת לעולם השירות",
  ],
  customer_satisfaction: [
    "מה ההבדל בין השלמת משימה לבין חוויית שירות טובה",
    "כיצד ניקיון, סדר, קבלת פנים ועדכון משפיעים על המדד",
    "מה עושים כאשר התקלה נפתרה אך הלקוח עדיין אינו מרוצה",
  ],
  feedback_score: [
    "מתי מבקשים משוב",
    "כיצד מבקשים בלי להפעיל לחץ",
    "מה עושים עם משוב שלילי",
    "מדוע המשוב הוא כלי למידה ולא רק ציון",
  ],
  community_initiatives: [
    "מה נחשב יוזמת קהילה",
    "מדוע שיחה יזומה יכולה להיחשב יוזמה",
    "מה ההבדל בין פעילות קהילה לבין פוסט סושיאל",
    "כיצד מתעדים תוצאה והמשך טיפול",
  ],
  social_content: [
    "מהו תוכן יזום לעומת שיתוף טכני",
    "כיצד בוחרים פלטפורמה",
    "מתי ניתן לפרסם ללא אישור נקודתי",
    "מתי חובה לעצור ולקבל אישור",
    "כיצד מודדים מעורבות בסיסית",
  ],
};

// Spec v1.2 Section 14.6 — KPI contribution types
export const KPI_CONTRIBUTION_TYPES = {
  awareness: { label: "מודעות", color: "bg-blue-100 text-blue-700" },
  knowledge: { label: "ידע", color: "bg-indigo-100 text-indigo-700" },
  simulation: { label: "תרגול", color: "bg-orange-100 text-orange-700" },
  live_practice: { label: "יישום אמת", color: "bg-green-100 text-green-700" },
};

// Spec v1.2 Section 16.3 — Readiness score weights
export const READINESS_SCORE_WEIGHTS = {
  knowledge_tests: 0.6,
  learning_completion: 0.2,
  practice_completion: 0.2,
};