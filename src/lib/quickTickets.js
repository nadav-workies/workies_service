export const QUICK_TICKET_LIST = [
  { id: "printing_package_update", ticket_type: "עדכון חבילת הדפסה", sla_label: "ללא SLA", sla_minutes: null, area: "אחר", priority: "רגילה", examples: "בקשה לטעינת חבילת הדפסות", is_printing_package_request: true, highlighted: true },
  { id: 1, ticket_type: "תחזוקת חדר", sla_label: "עד 30 דקות", sla_minutes: 30, area: "משרד / חדר לקוח", priority: "גבוהה", examples: "תלייה, צביעה, פתיחת דלת, תיקון חדר" },
  { id: 2, ticket_type: "מזגן SOS", sla_label: "עד 30 דקות", sla_minutes: 30, area: "מיזוג", priority: "קריטית", examples: "מזגן לא עובד / תקלה משביתה" },
  { id: 4, ticket_type: "שירותים", sla_label: "עד 10 דקות", sla_minutes: 10, area: "שירותים", priority: "קריטית", examples: "מים, סוללה, דלת, נייר, סבון" },
  { id: 5, ticket_type: "חדר ישיבות", sla_label: "עד 5 דקות", sla_minutes: 5, area: "חדר ישיבות", priority: "קריטית", examples: "HDMI, מצגת, מחשב" },
  { id: 6, ticket_type: "תאורה", sla_label: "עד 30 דקות", sla_minutes: 30, area: "תחזוקה כללית", priority: "גבוהה", examples: "תאורה בחדרים ובחללים" },
  { id: 7, ticket_type: "קודנים", sla_label: "עד 30 דקות", sla_minutes: 30, area: "תחזוקה כללית", priority: "גבוהה", examples: "קודן, צ׳יפ, בקר גישה" },
  { id: 8, ticket_type: "מכונת קפה", sla_label: "עד 20 דקות", sla_minutes: 20, area: "מטבחון", priority: "גבוהה", examples: "תקלה במכונת קפה" },
  { id: 9, ticket_type: "ניקיון חללים ציבוריים", sla_label: "שוטף", sla_minutes: null, area: "ניקיון", priority: "רגילה", examples: "ניקיון שוטף" },
];

export const QUICK_TICKET_HELP = {
  "תחזוקת חדר": "מיועד לתקלות בתוך החדר או המשרד: תלייה, תיקון דלת, צביעה קלה, ריהוט, מנעול או תחזוקה בסיסית.",
  "מזגן SOS": "מיועד לתקלת מיזוג דחופה או משביתה: מזגן לא עובד, חום / קור חריג, תקלה שמפריעה לעבודה בחדר.",
  "שירותים": "מיועד לתקלות שירותים: מים ברצפה, נייר חסר, סבון חסר, תקלה בדלת, סתימה או בעיית ניקיון דחופה.",
  "חדר ישיבות": "מיועד לתקלות בחדרי ישיבות: HDMI, מסך, חיבור מחשב, מצגת, מערכת שמע או תקלה שמפריעה לפגישה.",
  "תאורה": "מיועד לתקלות תאורה בחדרים או בחללים הציבוריים: מנורה שרופה, תאורה חלשה או תקלה במתג.",
  "קודנים": "מיועד לתקלות גישה: קודן, צ׳יפ, בקר כניסה, דלת שלא נפתחת או הרשאת כניסה שלא עובדת.",
  "מכונת קפה": "מיועד לתקלות במכונת קפה: מכונה לא עובדת, חסר מים, תקלה בהפעלה או בעיה לפני שימוש.",
  "ניקיון חללים ציבוריים": "מיועד לדיווח על צורך בניקיון במסדרונות, לאונג׳, Open Space, מטבחון או חללים משותפים.",
};

export const PRIORITY_COLORS_MAP = {
  'קריטית': 'border-red-300 bg-red-50 hover:bg-red-100',
  'גבוהה': 'border-orange-300 bg-orange-50 hover:bg-orange-100',
  'בינונית': 'border-amber-300 bg-amber-50 hover:bg-amber-100',
  'רגילה': 'border-slate-200 bg-slate-50 hover:bg-slate-100',
};