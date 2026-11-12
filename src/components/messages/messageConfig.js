export const PER_PAGE = 8;

export const SOURCE_LABELS = {
  tickets: "קריאות שירות", users: "משתמשים", leads: "לידים", hr_meetup: "מיטאפ HR", events: "אירועים",
  onboarding: "חפיפה", birthdays: "ימי הולדת", summaries: "סיכומים", managers: "התראות מנהלים",
};

export const STATUS_PILLS = [
  { key: "all", label: "הכל", style: { "--dt1-fc": "#9A9A9A", "--dt1-fc-ink": "#14181f", "--dt1-fc-cap": "hsl(var(--primary))", "--dt1-fc-cap-ink": "#ffffff" } },
  { key: "sent", label: "נשלחו", badge: "shipped", style: { "--dt1-fc": "#22c55e", "--dt1-fc-fill": "var(--dt1-shipped-grad)", "--dt1-fc-ink": "#0B0B0B" } },
  { key: "pending", label: "ממתינות", badge: "pending", style: { "--dt1-fc": "#F7CC32", "--dt1-fc-fill": "var(--dt1-pending-grad)", "--dt1-fc-ink": "#0B0B0B" } },
  { key: "skipped", label: "דולגו", badge: "refunded", style: { "--dt1-fc": "#636FE5", "--dt1-fc-fill": "var(--dt1-refunded-grad)", "--dt1-fc-ink": "#0B0B0B" } },
  { key: "failed", label: "נכשלו", badge: "cancelled", style: { "--dt1-fc": "#FF2F2F", "--dt1-fc-fill": "var(--dt1-cancelled-grad)", "--dt1-fc-ink": "#0B0B0B" } },
];

export const STATUS_META = Object.fromEntries(STATUS_PILLS.filter((p) => p.badge).map((p) => [p.key, p]));

export const sourceOf = (log) => log.source || (["user_invitation", "user_registered"].includes(log.notification_key) ? "users" : "tickets");
export const sentAt = (log) => log.sent_at || log.created_date;

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" });
}

export function downloadCsv(list) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["תאריך", "נמען", "נושא", "אזור", "סוג", "סטטוס", "נפתח", "שגיאה"].map(esc).join(",")]
    .concat(list.map((l) => [formatDate(sentAt(l)), l.recipient_email, l.subject, SOURCE_LABELS[sourceOf(l)], l.notification_key, STATUS_META[l.status]?.label || l.status, l.opened_at ? formatDate(l.opened_at) : "", l.error_message].map(esc).join(",")));
  const url = URL.createObjectURL(new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `messages-${new Date().toISOString().slice(0, 10)}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}