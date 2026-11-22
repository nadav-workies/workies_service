export const RSVP = { attending: "מגיע/ה", not_attending: "לא מגיע/ה" };
export const RSVP_SOURCE = { representative: "נציג/ה", link: "הנרשם/ת דרך הקישור" };

export const RSVP_FILTERS = {
  attending: { label: "מגיעים", query: { rsvp_status: "attending" } },
  not_attending: { label: "לא מגיעים", query: { rsvp_status: "not_attending" } },
  none: { label: "טרם ענו", query: { rsvp_status: { $nin: ["attending", "not_attending"] } } },
  all: { label: "כל הנרשמים", query: {} },
};

export const formatDateTime = v => v ? new Date(v).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" }) : "";

const COLUMNS = [
  ["שם", l => l.name], ["טלפון", l => l.phone], ["מייל", l => l.email],
  ["חברה / ארגון", l => l.organization || l.business_name], ["תפקיד", l => l.job_title],
  ["אישור הגעה", l => RSVP[l.rsvp_status] || "טרם ענה/תה"], ["עודכן ע״י", l => l.rsvp_source ? `${RSVP_SOURCE[l.rsvp_source]}${l.rsvp_by ? ` (${l.rsvp_by})` : ""}` : ""],
  ["מועד אישור", l => formatDateTime(l.rsvp_at)],
];
const cell = v => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function downloadRsvpCsv(leads, title) {
  const csv = [COLUMNS.map(([h]) => cell(h)).join(","), ...leads.map(l => COLUMNS.map(([, get]) => cell(get(l))).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `אישורי הגעה - ${title} - ${new Date().toISOString().slice(0, 10)}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}