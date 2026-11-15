// נתוני דמה למוקאפ מערכת הדיוור. שום דבר כאן לא מחובר לישויות אמיתיות ושום מייל לא נשלח.

export const SOURCES = {
  office: "התנסות במשרד יומי",
  podcast: "התנסות באולפן פודקאסט",
  workies_ai: "Workies AI",
  hr_meetup: "HR מחוץ לשגרה",
  tenants: "דיירי וורקיז",
  import: "ייבוא Excel",
  aio: "AIO",
};

export const CONSENT = {
  subscribed: { label: "מאושר לדיוור", tone: "green" },
  pending: { label: "ממתין להסכמה", tone: "yellow" },
  unsubscribed: { label: "הסיר את עצמו", tone: "gray" },
  bounced: { label: "כתובת חוזרת", tone: "red" },
  complained: { label: "סימן כספאם", tone: "red" },
};

export const CONTACTS = [
  { id: "c1", name: "מיכל אברהם", email: "michal.a@example.co.il", phone: "050-1234567", company: "סטודיו אבן", consent: "subscribed", sources: ["workies_ai", "hr_meetup"], tags: ["יזמות", "AI"], last: "2026-11-12", opens: 6, clicks: 3, score: 82 },
  { id: "c2", name: "יוסי כהן", email: "yossi@example.com", phone: "052-7654321", company: "כהן ייעוץ", consent: "subscribed", sources: ["office"], tags: ["משרד יחיד"], last: "2026-11-10", opens: 4, clicks: 2, score: 71 },
  { id: "c3", name: "רונית לוי", email: "ronit.levi@example.co.il", phone: "054-1112233", company: "לוי משאבי אנוש", consent: "subscribed", sources: ["hr_meetup"], tags: ["HR"], last: "2026-11-08", opens: 3, clicks: 0, score: 48 },
  { id: "c4", name: "אבי מזרחי", email: "avi.m@example.com", phone: "053-9988776", company: "מזרחי הפקות", consent: "subscribed", sources: ["podcast"], tags: ["פודקאסט"], last: "2026-11-14", opens: 7, clicks: 5, score: 90 },
  { id: "c5", name: "שירה בן דוד", email: "shira.bd@example.co.il", phone: "050-4455667", company: "", consent: "pending", sources: ["import"], tags: [], last: "2026-10-30", opens: 0, clicks: 0, score: 10 },
  { id: "c6", name: "דני פרץ", email: "dani.p@example.com", phone: "052-3344556", company: "פרץ הנדסה", consent: "subscribed", sources: ["tenants", "aio"], tags: ["דייר", "צוות"], last: "2026-11-13", opens: 5, clicks: 1, score: 64 },
  { id: "c7", name: "נועה שטרן", email: "noa.s@example.co.il", phone: "054-6677889", company: "שטרן דיגיטל", consent: "unsubscribed", sources: ["workies_ai"], tags: ["AI"], last: "2026-09-21", opens: 1, clicks: 0, score: 0 },
  { id: "c8", name: "עומר גולן", email: "omer.golan@example.com", phone: "053-2233445", company: "גולן סחר", consent: "subscribed", sources: ["office", "workies_ai"], tags: ["משרד יחיד", "AI"], last: "2026-11-11", opens: 4, clicks: 2, score: 69 },
  { id: "c9", name: "תמר רוזן", email: "tamar.r@example.co.il", phone: "050-8899001", company: "רוזן קליניקה", consent: "subscribed", sources: ["office"], tags: ["מטפלים"], last: "2026-11-05", opens: 2, clicks: 1, score: 55 },
  { id: "c10", name: "אלון ביטון", email: "alon.b@bad-domain.example", phone: "052-1212121", company: "", consent: "bounced", sources: ["import"], tags: [], last: "2026-10-28", opens: 0, clicks: 0, score: 0 },
  { id: "c11", name: "הדר שמעוני", email: "hadar.sh@example.com", phone: "054-3434343", company: "שמעוני משפטים", consent: "subscribed", sources: ["aio"], tags: ["לקוח פעיל"], last: "2026-11-09", opens: 3, clicks: 1, score: 58 },
  { id: "c12", name: "גיל אוחנה", email: "gil.o@example.co.il", phone: "053-5656565", company: "אוחנה מדיה", consent: "pending", sources: ["podcast", "import"], tags: ["פודקאסט"], last: "2026-10-25", opens: 0, clicks: 0, score: 12 },
];

export const LISTS = [
  { id: "l1", name: "כל המאושרים לדיוור", type: "dynamic", rule: "סטטוס הסכמה = מאושר", count: 1284 },
  { id: "l2", name: "משתתפי Workies AI", type: "dynamic", rule: "מקור = Workies AI", count: 412 },
  { id: "l3", name: "התעניינו במשרד ולא סגרו", type: "dynamic", rule: "מקור = משרד יומי · לא לקוח פעיל", count: 236 },
  { id: "l4", name: "פתחו ב-30 הימים האחרונים", type: "dynamic", rule: "פתיחה אחרונה ≤ 30 יום", count: 517 },
  { id: "l5", name: "מוזמנים לערב קהילה דצמבר", type: "static", rule: "רשימה ידנית", count: 85 },
  { id: "l6", name: "אנשי HR ומשאבי אנוש", type: "static", rule: "ייבוא מקובץ · 01.11.2026", count: 143 },
];

export const TEMPLATES = [
  { id: "t1", name: "ניוזלטר חודשי", category: "ניוזלטר", subject: "מה קורה בוורקיז החודש", updated: "2026-11-10" },
  { id: "t2", name: "הזמנה לאירוע", category: "אירוע", subject: "{{first_name}}, שמרנו לך מקום", updated: "2026-11-03" },
  { id: "t3", name: "הצעה למשרד", category: "מכירה", subject: "משרד שקט בבאר שבע, מהיום", updated: "2026-10-28" },
  { id: "t4", name: "ברוכים הבאים", category: "אוטומציה", subject: "נעים להכיר, זה וורקיז", updated: "2026-10-20" },
  { id: "t5", name: "תזכורת התנסות", category: "אוטומציה", subject: "עוד לא קבעת את יום ההתנסות?", updated: "2026-10-18" },
];

export const CAMPAIGNS = [
  { id: "m1", name: "ניוזלטר נובמבר", status: "sent", list: "כל המאושרים לדיוור", sentAt: "2026-11-04 10:00", recipients: 1262, delivered: 1239, opened: 538, clicked: 141, bounced: 23, unsub: 6 },
  { id: "m2", name: "הזמנה ל-Workies AI Open Stage", status: "sent", list: "משתתפי Workies AI", sentAt: "2026-11-09 09:30", recipients: 408, delivered: 404, opened: 231, clicked: 97, bounced: 4, unsub: 1 },
  { id: "m3", name: "מבצע משרד יחיד — דצמבר", status: "scheduled", list: "התעניינו במשרד ולא סגרו", sentAt: "2026-11-18 09:00", recipients: 236 },
  { id: "m4", name: "ערב קהילה דצמבר", status: "draft", list: "מוזמנים לערב קהילה דצמבר", sentAt: "", recipients: 85 },
];

export const CAMPAIGN_STATUS = {
  draft: { label: "טיוטה", tone: "gray" },
  scheduled: { label: "מתוזמן", tone: "yellow" },
  sending: { label: "בשליחה", tone: "blue" },
  sent: { label: "נשלח", tone: "green" },
};

export const AUTOMATIONS = [
  {
    id: "a1", name: "ליד חדש — התנסות במשרד יומי", active: true, trigger: "ליד חדש מעמוד נחיתה: התנסות במשרד יומי", enrolled: 58, completed: 41,
    steps: [
      { type: "email", title: "מייל ברוכים הבאים", template: "ברוכים הבאים" },
      { type: "delay", title: "המתנה 2 ימים" },
      { type: "condition", title: "האם קבע יום התנסות?", yes: "יציאה מהמסלול", no: "המשך" },
      { type: "email", title: "תזכורת התנסות", template: "תזכורת התנסות" },
      { type: "delay", title: "המתנה 5 ימים" },
      { type: "email", title: "הצעה למשרד", template: "הצעה למשרד" },
    ],
  },
  { id: "a2", name: "נרשם ל-Workies AI — חימום ל-Lab", active: true, trigger: "ליד חדש מעמוד נחיתה: Workies AI", enrolled: 132, completed: 97, steps: [] },
  { id: "a3", name: "לקוח חדש מ-AIO — קליטה לקהילה", active: false, trigger: "אירוע AIO: חוזה נחתם", enrolled: 0, completed: 0, steps: [] },
];

export const TREND = [
  { month: "06/26", contacts: 910, unsub: 4 },
  { month: "07/26", contacts: 968, unsub: 7 },
  { month: "08/26", contacts: 1031, unsub: 5 },
  { month: "09/26", contacts: 1102, unsub: 9 },
  { month: "10/26", contacts: 1190, unsub: 8 },
  { month: "11/26", contacts: 1284, unsub: 7 },
];

export const IMPORT_HISTORY = [
  { id: "i1", file: "אנשי HR - כנס נובמבר.xlsx", by: "נדב", at: "2026-11-01", added: 143, updated: 12, rejected: 4 },
  { id: "i2", file: "לקוחות ישנים 2023.csv", by: "נדב", at: "2026-10-12", added: 318, updated: 44, rejected: 19 },
];

export const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
export const fmt = n => Number(n || 0).toLocaleString("he-IL");
export const dateHe = d => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d.replace(" ", "T")).toLocaleDateString("he-IL") : "—");
