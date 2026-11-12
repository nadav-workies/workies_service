const HEX24 = /^[0-9a-f]{24}$/i;
let fallback = "";

// CallTrackingMetrics session id, or "" while CTM hasn't loaded yet.
export function readCtmSid() {
  const match = document.cookie.match(/(?:^|;\s*)__ctmid=([^;]*)/);
  const cookie = match ? decodeURIComponent(match[1]) : "";
  if (HEX24.test(cookie)) return cookie;
  const sid = window.__ctm?.config?.sid;
  return typeof sid === "string" && HEX24.test(sid) ? sid : "";
}

// Value sent as "sid" on submit: CTM's id, else one stable generated fallback.
export function getLeadSid() {
  const sid = readCtmSid();
  if (sid) return sid;
  if (!fallback) fallback = (Date.now().toString(16) + Math.random().toString(16).slice(2, 14)).slice(0, 24);
  return fallback;
}