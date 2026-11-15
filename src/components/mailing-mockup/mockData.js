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

// ---- מנוע מעורבות ----
// כל פעולה של איש קשר נרשמת כאירוע מעורבות: אוטומטית (מייל, טופס, AIO) או ידנית (שיחה, הגעה, פגישה).
export const ENGAGEMENT_TYPES = {
  opened: { label: "פתח מייל", points: 1, auto: true },
  clicked: { label: "הקליק על קישור", points: 3, auto: true },
  replied: { label: "השיב למייל", points: 5, auto: true },
  registered: { label: "נרשם (טופס / אירוע)", points: 6, auto: true },
  attended: { label: "הגיע לאירוע", points: 10 },
  call_answered: { label: "ענה לשיחה", points: 4 },
  meeting: { label: "פגישה / סיור במתחם", points: 12 },
  whatsapp: { label: "השיב בוואטסאפ", points: 4 },
  referral: { label: "הפנה מישהו", points: 8 },
};

export const STAGES = {
  cold: { label: "קר", tone: "gray" },
  warming: { label: "מתחמם", tone: "yellow" },
  engaged: { label: "מעורב", tone: "blue" },
  hot: { label: "חם", tone: "orange" },
};
export const stageOf = score => (score >= 45 ? "hot" : score >= 25 ? "engaged" : score >= 10 ? "warming" : "cold");

export const STAGE_COUNTS = { cold: 612, warming: 404, engaged: 211, hot: 57 };

export const RULES = [
  { id: "r1", name: "הקליק על משרד ולא נרשם", when: "הקליק על קישור 'משרד' · לא נרשם להתנסות תוך 3 ימים", move: "מייל 'הצעה למשרד' + משימת שיחה למכירות", mode: "suggest", hits: 14, active: true },
  { id: "r2", name: "פותח ולא מקליק", when: "3 פתיחות אחרונות בלי אף הקלקה", move: "מייל קצר עם שאלה אחת: מה הכי רלוונטי לך?", mode: "suggest", hits: 37, active: true },
  { id: "r3", name: "נרשם ולא הגיע", when: "נרשם לאירוע · לא סומנה נוכחות", move: "מייל 'פספסת' עם תקציר + הזמנה לאירוע הבא", mode: "auto", hits: 22, active: true },
  { id: "r4", name: "הגיע לאירוע", when: "סומנה נוכחות באירוע", move: "מייל תודה + הצעה להמשך (Lab / סיור במתחם)", mode: "auto", hits: 41, active: true },
  { id: "r5", name: "חצה את סף 'חם'", when: "ניקוד מעורבות עבר 45", move: "התראה למכירות + משימת שיחה", mode: "auto", hits: 9, active: true },
  { id: "r6", name: "שקט 60 יום", when: "אין אף פעולת מעורבות 60 יום", move: "מייל ערך בלי הצעה, לבדיקת עניין", mode: "suggest", hits: 186, active: false },
];

export const SUGGESTIONS = [
  { id: "s1", rule: "r1", signal: "14 אנשים הקליקו על 'משרד יומי' בניוזלטר נובמבר ולא נרשמו להתנסות", move: "לשלוח 'הצעה למשרד' ולפתוח 14 משימות שיחה למכירות", count: 14, urgency: "high" },
  { id: "s2", rule: "r5", signal: "אבי מזרחי עבר לסטטוס 'חם' (90): 7 פתיחות, 5 הקלקות, ענה לשיחה ב-10.11", move: "משימת שיחה היום", count: 1, urgency: "high" },
  { id: "s3", rule: "r2", signal: "37 אנשי קשר פתחו את 3 המיילים האחרונים ולא הקליקו על אף קישור", move: "מייל קצר עם שאלה אחת", count: 37, urgency: "mid" },
  { id: "s4", rule: "r6", signal: "186 אנשי קשר בלי שום מעורבות 60 יום", move: "מייל ערך לבדיקת עניין (החוק כבוי — הצעה חד-פעמית)", count: 186, urgency: "low" },
];

export const EVENTS_FOR_ATTENDANCE = [
  { id: "e1", name: "Workies AI Open Stage", date: "2026-11-09", registered: ["c1", "c4", "c6", "c8", "c11"] },
  { id: "e2", name: "HR מחוץ לשגרה", date: "2026-10-29", registered: ["c3", "c9", "c1"] },
];
