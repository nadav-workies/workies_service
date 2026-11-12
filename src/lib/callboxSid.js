const KEYS = ["session_id", "SID", "sid", "callbox_sid", "cb_sid"];
const STORE = "workies_callbox_sid";

function fromCookies() {
  const cookies = Object.fromEntries(document.cookie.split(";").map(c => c.trim().split("=")).filter(([k]) => k).map(([k, ...v]) => [k, decodeURIComponent(v.join("="))]));
  return KEYS.map(k => cookies[k]).find(Boolean);
}

// Remember a SID passed in the landing URL so it survives page navigation.
const params = new URLSearchParams(window.location.search);
const urlSid = KEYS.map(k => params.get(k)).find(Boolean);
if (urlSid) sessionStorage.setItem(STORE, urlSid);

// The CallBox session id (SID) of the current visitor, read at submit time.
export function getCallboxSid() {
  return String(KEYS.map(k => window[k]).find(v => typeof v === "string" && v) || sessionStorage.getItem(STORE) || fromCookies() || "");
}