import { base44 } from "@/api/base44Client";
import { csvCell } from "@/lib/csvCell";

export const CONSENT = {
  subscribed: { label: "מאושר לדיוור", tone: "green" },
  pending: { label: "ממתין להסכמה", tone: "yellow" },
  unsubscribed: { label: "הסיר את עצמו", tone: "gray" },
  bounced: { label: "כתובת חוזרת", tone: "red" },
  complained: { label: "סימן כספאם", tone: "red" },
};

export const SOURCES = {
  office: "התנסות במשרד יומי",
  podcast: "אולפן פודקאסט",
  workies_ai: "Workies AI",
  hr_meetup: "HR מחוץ לשגרה",
  tenants: "דיירי וורקיז",
  import: "ייבוא קובץ",
  manual: "הוספה ידנית",
};

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function contactQuery({ q = "", consent = "all", source = "all" }) {
  const query = {};
  if (consent !== "all") query.consent = consent;
  if (source !== "all") query.sources = source;
  const term = q.trim();
  if (term) {
    const rx = { $regex: escapeRegex(term.toLowerCase()) };
    query.$or = [{ email: rx }, { name: { $regex: escapeRegex(term) } }, { phone: rx }, { company: { $regex: escapeRegex(term) } }];
  }
  return query;
}

export function listQuery(list) {
  if (list.type === "static") return { list_ids: list.id };
  const query = {};
  if (list.rule_consent) query.consent = list.rule_consent;
  if (list.rule_source) query.sources = list.rule_source;
  if (list.rule_tag) query.tags = list.rule_tag;
  return query;
}

export function listRuleText(list) {
  if (list.type === "static") return "רשימה ידנית";
  const parts = [];
  if (list.rule_consent) parts.push(`הסכמה: ${CONSENT[list.rule_consent]?.label}`);
  if (list.rule_source) parts.push(`מקור: ${SOURCES[list.rule_source]}`);
  if (list.rule_tag) parts.push(`תגית: ${list.rule_tag}`);
  return parts.join(" · ") || "כל אנשי הקשר";
}

export async function exportContacts(query, label) {
  const rows = [];
  let cursor = null;
  do {
    const page = await base44.entities.MailContact.filter(query, { sort: "email", limit: 500, ...(cursor ? { cursor } : {}) });
    rows.push(...page.items);
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  const esc = csvCell;
  const lines = [["אימייל", "שם", "טלפון", "חברה", "הסכמה", "מקורות", "תגיות"].map(esc).join(",")]
    .concat(rows.map(r => [r.email, r.name, r.phone, r.company, CONSENT[r.consent]?.label, (r.sources || []).map(s => SOURCES[s] || s).join(" | "), (r.tags || []).join(" | ")].map(esc).join(",")));
  const url = URL.createObjectURL(new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
  Object.assign(document.createElement("a"), { href: url, download: `${label} - ${new Date().toISOString().slice(0, 10)}.csv` }).click();
  URL.revokeObjectURL(url);
}

export const splitTags = s => [...new Set(String(s || "").split(",").map(t => t.trim()).filter(Boolean))].slice(0, 10);