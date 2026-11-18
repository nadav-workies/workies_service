const SITE = "https://service.workies.co.il";
const FILES = "https://base44.app/api/apps/6a1d5a36316988d9f113f88e/files/mp/public/6a1d5a36316988d9f113f88e/";
export const MAIL_LOGO = "https://media.base44.com/images/public/6a1d5a36316988d9f113f88e/1c0d76342_1.png";

// Operational emails the system already sends.
export const TEMPLATE_LABELS = {
  LeadReceived: "אישור קבלת פרטים",
  EventConfirmation: "אישור הרשמה לאירוע",
  HRMeetupConfirmation: "אישור הרשמה למיטאפ HR",
  EventReminderThreeDays: "תזכורת 3 ימים לפני אירוע",
  EventReminderTomorrow: "תזכורת יום לפני אירוע",
  MailingOffice: "דיוור בסגנון משרד",
  MailingEvent: "דיוור בסגנון אירוע",
  MailingPodcast: "דיוור בסגנון פודקאסט",
};
export const SYSTEM_TEMPLATES = ["LeadReceived", "EventConfirmation", "HRMeetupConfirmation", "EventReminderThreeDays", "EventReminderTomorrow"];

// Marketing styles: the palette of each one is fixed and matches its landing page.
// The sample copy comes from the live landing pages.
export const MAIL_STYLES = [
  {
    key: "office", template: "MailingOffice", name: "סגנון משרד", fits: "משרדים, סיורים והצעות לעסקים", page: "/daily-office",
    c: { page: "#f4f4f4", surface: "#ffffff", ink: "#111111", muted: "#5b5f66", accent: "#16a5b4", accentInk: "#ffffff", band: "#111111", bandInk: "#ffffff", bandMuted: "#c9cbce", radius: 12 },
    image: FILES + "05f35138d_office_2880x4074.jpg",
    sample: { headline: "משרד פרטי ליום עבודה אחד", subheadline: "באים לסיור במתחם, בוחרים משרד ומתחילים לעבוד.", body: "משרד פרטי ומאובזר ב-Workies באר שבע, לצוות קטן או לעבודה לבד. משאירים פרטים ואנחנו חוזרים לתאם סיור.", cta_label: "לתיאום סיור", cta_url: SITE + "/daily-office" },
  },
  {
    key: "event", template: "MailingEvent", name: "סגנון אירוע", fits: "הזמנות לאירועים, מיטאפים וסדנאות", page: "/hr-meetup",
    c: { page: "#f4f0fd", surface: "#ffffff", ink: "#1e1638", muted: "#5d567a", accent: "#7c5fc8", accentInk: "#ffffff", band: "#1f1838", bandInk: "#ffffff", bandMuted: "#cfc6ef", highlight: "#f2c62e", soft: "#e8e1fb", radius: 999 },
    image: FILES + "58ceb9525_hr-hero-lounge.jpg",
    sample: { headline: "HR מחוץ לשגרה", subheadline: "מיטאפ למנהלות ולמנהלי משאבי אנוש.", body: "בוקר של נטוורקינג, ארוחת בוקר ושלוש הרצאות קצרות. ההשתתפות בהרשמה מראש.", cta_label: "להרשמה למיטאפ", cta_url: SITE + "/hr-meetup", event_date: "יום שלישי, 24.11.2026", event_time: "09:00–12:00", event_location: "WORKIES, אליהו נאווי 24, באר שבע" },
  },
  {
    key: "podcast", template: "MailingPodcast", name: "סגנון פודקאסט", fits: "אולפן הפודקאסט ותוכן מוקלט", page: "/podcast",
    c: { page: "#0e1112", surface: "#141819", ink: "#F6EFE5", muted: "#bdb6ab", accent: "#D59C70", accentInk: "#141819", band: "#1c2223", bandInk: "#F6EFE5", bandMuted: "#bdb6ab", radius: 6 },
    sample: { headline: "התנסות באולפן הפודקאסט", subheadline: "מגיעים, מתיישבים מול המיקרופון ומקליטים.", body: "אולפן מקצועי ב-Workies באר שבע, עם ליווי בהקלטה. משאירים פרטים ואנחנו חוזרים לתאם התנסות.", cta_label: "לתיאום התנסות", cta_url: SITE + "/podcast" },
  },
];