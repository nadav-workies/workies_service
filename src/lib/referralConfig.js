export const TERMS_IMAGE_URL = "https://media.base44.com/images/public/6a1d5a36316988d9f113f88e/47e4d75f8_file_00000000b38481f6839400cfd71d7a7e.png";
export const CAMPAIGN_END_DATE = "2026-10-15";
export const REFERRAL_TICKET_TYPE = "חבר מביא חבר";
export const VOUCHER_PER_OFFICE = 500;

export function isCampaignActive(now = new Date()) {
  return now <= new Date(`${CAMPAIGN_END_DATE}T23:59:59`);
}

// ticketStatus = הסטטוס שמתעדכן בקריאת השירות המקושרת
export const REFERRAL_STATUSES = {
  new: { label: "התקבלה", color: "bg-blue-100 text-blue-700", ticketStatus: "פתוחה" },
  contacted: { label: "בטיפול צוות המכירות", color: "bg-amber-100 text-amber-700", ticketStatus: "בטיפול" },
  tour: { label: "נקבע סיור / פגישה", color: "bg-purple-100 text-purple-700", ticketStatus: "בטיפול" },
  signed: { label: "נחתם הסכם", color: "bg-teal-100 text-teal-700", ticketStatus: "בטיפול" },
  eligible: { label: "זכאי לשובר — חיוב ראשון שולם", color: "bg-emerald-100 text-emerald-700", ticketStatus: "בטיפול" },
  voucher_given: { label: "השובר נמסר", color: "bg-green-600 text-white", ticketStatus: "הושלם" },
  not_relevant: { label: "לא רלוונטי", color: "bg-muted text-muted-foreground", ticketStatus: "נסגרה" },
  existing_lead: { label: "לקוח / ליד קיים ב-CRM", color: "bg-orange-100 text-orange-700", ticketStatus: "נסגרה" },
  duplicate: { label: "המלצה כפולה", color: "bg-red-100 text-red-700", ticketStatus: "נסגרה" },
};

export const TERMINAL_REFERRAL_STATUSES = ["voucher_given", "not_relevant", "existing_lead", "duplicate"];

export function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "").replace(/^972/, "0");
}