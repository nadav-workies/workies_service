const IMG = "https://base44.app/api/apps/6a1d5a36316988d9f113f88e/files/mp/public/6a1d5a36316988d9f113f88e/";

export const EV_IMAGES = {
  hall: IMG + "2c6be4e32c90a840f433edec591d400b_ev-hall.jpg",
  logo: IMG + "1a702c322a33bbde3ca4167afd2bc1ec_workies-logo-white.png",
  art: IMG + "899b3038275912f0d4b93348e57e3c66_ev-art.jpg",
  lounge: IMG + "2ed9a23677d041218b3f6312a2224d27_ev-lounge.jpg",
  bar: IMG + "0af6a29c36a1162c99dae57318f79047_ev-bar.jpg",
  terrace: IMG + "5fed78f95988d588f330f95a380fc66b_ev-terrace.jpg",
  kitchen: IMG + "6d3ee13adc41c974c35f4cf354ebea41_ev-kitchen.jpg",
  classroom: IMG + "82c5a75eaba29d3943be3a226a7b98b2_classroom.jpg",
  meeting: IMG + "435e992ba8a1c93185402b8650d2903c_meeting.jpg",
  sign: IMG + "b27b81d8d89629d27859eeb05e7a87e9_ev-sign.jpg",
};

export const EVENTOR_DEFAULTS = {
  phone: "055-3070051",
  whatsapp_url: "https://wa.me/message/7JXBZSHA7L23O1",
  capacity_eventor: 80,
  capacity_classroom: 40,
  capacity_mamad: 25,
  capacity_meeting: 15,
};

export const WAZE_URL = "https://waze.com/ul?q=" + encodeURIComponent("דרך אליהו נאוי 24 באר שבע");

// 055-3070051 -> tel:+972553070051
export const telHref = phone => {
  const digits = String(phone || "").replace(/\D/g, "");
  return "tel:+" + (digits.startsWith("0") ? "972" + digits.slice(1) : digits);
};

// What makes each space different (4 each). Shared items are listed once in SHARED_AMENITIES.
export const HALL_AMENITIES = ["לאונג' ופינות ישיבה", "שירותים בתוך המתחם", "חצר לקבלת פנים", "מקרן ושיחות וידאו"];
export const CLASS_AMENITIES = ["לאונג' ופינות ישיבה", "שירותים בתוך המתחם", "מקרן ומסך", "לוח מחיק ולוח נייר"];
export const MEETING_AMENITIES = ["טרקלין צמוד", "מסך גדול", "שיחות וידאו", "מערכת שמע"];
export const SHARED_AMENITIES = ["נגישות מלאה", "בר קפה", "מטבחון לכיבוד", "חניה חינם", "Wi‑Fi", "מיזוג"];
export const COFFEE_BAR = ["אספרסו וקפוצ'ינו", "קפה מכמה סוגים", "חלב רגיל, שיבולת שועל ועוד", "מבחר תה"];
export const SUITS = ["הרצאות", "סדנאות", "ערבי מיטאפ", "השקות", "הרמות כוסית", "השתלמויות", "אירועים עסקיים"];

export const GALLERY = [
  { src: EV_IMAGES.lounge, alt: "פינת לאונג' באיוונטור", caption: "פינות לאונג'" },
  { src: EV_IMAGES.bar, alt: "שולחן בר ארוך מעץ באיוונטור", caption: "בר ושולחן אירוח" },
  { src: EV_IMAGES.terrace, alt: "החצר של האיוונטור עם דשא, פרגולה ופינות ישיבה", caption: "חצר לקבלת פנים ומינגלינג" },
  { src: EV_IMAGES.kitchen, alt: "המטבחון באיוונטור", caption: "מטבחון מאובזר" },
];

export const FAQ = [
  ["צריך להיות דייר ב־Workies כדי לקיים אירוע?", "לא. המתחם פתוח לכל חברה, ארגון ועסק."],
  ["ההקלטה עולה בנפרד?", "לא. מערכת המולטימדיה וההקלטה כלולות בהשכרת האיוונטור."],
  ["אפשר לארח ארוחה?", "כן. כל המתחמים מתאימים לאירוח עם אוכל, ובכל אחד יש מטבחון לכיבוד. הסעדה כשרה ומותאמת מזמינים בתיאום מראש ובתוספת תשלום."],
  ["יש שירותים בתוך המתחם?", "כן. באיוונטור ובכיתות הלימוד יש שירותים צמודים בתוך המתחם, כך שלא צריך לצאת."],
  ["איפה חונים?", "יש חניה חינם בשפע, צמוד למתחם."],
];

export const SEO = {
  title: "מתחם האירועים של Workies באר שבע | Eventor",
  description: "אולם אירועים עד 80 משתתפים, כיתות לימוד וחדרי ישיבות בבאר שבע. מולטימדיה והקלטה, הסעדה כשרה וחניה חינם.",
  keywords: "מתחם אירועים באר שבע, אולם אירועים עסקיים באר שבע, השכרת אולם הרצאות, אולם כנסים באר שבע, חדר ישיבות להשכרה באר שבע, כיתת לימוד להשכרה, השכרת כיתה לקורס, מקום לסדנה באר שבע, אירוע חברה באר שבע, ערב מיטאפ, השקת מוצר, הרמת כוסית, הסעדה כשרה לאירועים, אולם עם מקרן והקלטה, Eventor, Workies, וורקיז",
};