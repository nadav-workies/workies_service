import { base44 } from "@/api/base44Client";
import campaigns from "@/components/landing/campaigns";
import { pageTypeOf } from "@/lib/pageTypes";

export const SEGMENTS = [["event", "אירועים"], ["sponsored", "קמפיינים ממומנים"], ["all", "כל העמודים"]];
const LIST_CAMPAIGNS = ["hr_meetup", "workies_ai", "office", "podcast"];

async function allLeads(entity) {
  const out = [];
  let cursor = null;
  do {
    const page = await base44.entities[entity].filter({ status: { $ne: "not_relevant" } }, { sort: "-created_date", limit: 200, ...(cursor ? { cursor } : {}) });
    out.push(...page.items);
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return out;
}

// One contact per email address, with every landing page they registered on.
export async function loadMailingList(type) {
  const { items: settings } = await base44.entities.CampaignValidity.list({ sort: "-created_date", limit: 50 });
  const chosen = LIST_CAMPAIGNS.filter(c => type === "all" || pageTypeOf(c, settings.find(s => s.campaign === c)) === type);
  const groups = await Promise.all(chosen.map(async c => (await allLeads(campaigns[c].entity)).map(l => ({ ...l, campaign: c }))));
  const byEmail = new Map();
  groups.flat().forEach(l => {
    const email = String(l.email || "").trim().toLowerCase();
    if (!email) return;
    const row = byEmail.get(email) || { email, name: l.name, phone: l.phone, pages: [], last: l.created_date };
    if (!row.pages.includes(campaigns[l.campaign].title)) row.pages.push(campaigns[l.campaign].title);
    if (l.created_date > row.last) row.last = l.created_date;
    byEmail.set(email, row);
  });
  return [...byEmail.values()].sort((a, b) => (b.last || "").localeCompare(a.last || ""));
}

export function downloadMailingList(rows, label) {
  const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["אימייל", "שם", "טלפון", "עמודים", "הרשמה אחרונה"].map(esc).join(",")]
    .concat(rows.map(r => [r.email, r.name, r.phone, r.pages.join(" | "), new Date(r.last).toLocaleDateString("he-IL")].map(esc).join(",")));
  const url = URL.createObjectURL(new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `רשימת תפוצה - ${label} - ${new Date().toISOString().slice(0, 10)}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}