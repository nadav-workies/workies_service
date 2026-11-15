// Workies Be'er Sheva contact details for the private-office landing page.
export const PHONE_DISPLAY = "08-3760946";
export const PHONE_TEL = "tel:+97283760946";
export const WHATSAPP_URL = `https://wa.me/972559788056?text=${encodeURIComponent("היי, אשמח לתאם סיור במשרד פרטי בוורקיז באר שבע")}`;
export const WAZE_URL = `https://waze.com/ul?q=${encodeURIComponent("אליהו נאוי 24 באר שבע")}&navigate=yes`;
export const ADDRESS = "דרך אליהו נאוי 24, קומה 2, באר שבע (מתחם ביג)";
export const LOGO = "https://media.base44.com/images/public/6a1d5a36316988d9f113f88e/1c0d76342_1.png";

// GTM click events; the links themselves stay real <a href> so nothing is blocked.
export function trackClick(action, location) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: action, click_location: location, campaign: "office" });
}

export const scrollToForm = () => document.getElementById("tour-form")?.scrollIntoView({ behavior: "smooth", block: "start" });