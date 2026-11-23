import { base44 } from "@/api/base44Client";

const UTM_KEY = "eventor_utm";
const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign"];

// Keep the UTM parameters from the entry URL for every event in this visit.
export function captureUtm() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = Object.fromEntries(UTM_FIELDS.map(f => [f, (params.get(f) || "").slice(0, 150)]));
  if (UTM_FIELDS.some(f => fromUrl[f])) sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl));
  return JSON.parse(sessionStorage.getItem(UTM_KEY) || "{}");
}

const device = () => (window.matchMedia("(min-width: 1024px)").matches ? "desktop" : "mobile");

// Fire-and-forget: never delays the WhatsApp / dialer / Waze navigation.
export function trackEventor(event_type, button_location = "") {
  base44.entities.LandingPageEvent.create({
    landing_page_id: "eventor", event_type, button_location, ...captureUtm(),
    referrer: (document.referrer || "").slice(0, 500), device: device(),
  }).catch(() => {});
  if (event_type === "view") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: "Contact", contact_method: event_type, button_location, campaign: "eventor" });
  window.fbq?.("track", "Contact");
}