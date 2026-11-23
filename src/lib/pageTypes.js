export const PAGE_TYPES = {
  event: { label: "אירוע", hint: "מייל אישור הרשמה + תזכורות: 3 ימים לפני (עם התוכנית) ויום לפני" },
  sponsored: { label: "קמפיין ממומן", hint: "מייל אישור קבלת פרטים לאחר שליחת הטופס" },
  other: { label: "אחר", hint: "ללא מיילים אוטומטיים לנרשמים" },
  // Fixed type for showcase pages (no form, no RSVP); not offered in the type picker.
  showcase: { label: "תדמית", hint: "עמוד מידע בלי טופס. נמדדים צפיות וקליקים לוואטסאפ ולטלפון", fixed: true },
};

// Default type per landing page until an admin sets one.
export const DEFAULT_PAGE_TYPE = { office: "sponsored", podcast: "sponsored", workies_ai: "event", hr_meetup: "event", referral: "other", eventor: "showcase" };

export const pageTypeOf = (campaign, validity) => DEFAULT_PAGE_TYPE[campaign] === "showcase" ? "showcase" : validity?.page_type || DEFAULT_PAGE_TYPE[campaign] || "other";