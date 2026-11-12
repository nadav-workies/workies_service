export const PAGE_TYPES = {
  event: { label: "אירוע", hint: "מייל אישור הרשמה + תזכורות: 3 ימים לפני (עם התוכנית) ויום לפני" },
  sponsored: { label: "קמפיין ממומן", hint: "מייל אישור קבלת פרטים לאחר שליחת הטופס" },
  other: { label: "אחר", hint: "ללא מיילים אוטומטיים לנרשמים" },
};

// Default type per landing page until an admin sets one.
export const DEFAULT_PAGE_TYPE = { office: "sponsored", podcast: "sponsored", workies_ai: "event", hr_meetup: "event", referral: "other" };

export const pageTypeOf = (campaign, validity) => validity?.page_type || DEFAULT_PAGE_TYPE[campaign] || "other";