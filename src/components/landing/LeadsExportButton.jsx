import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { STATUSES } from "@/components/landing/DailyOfficeLeadRow";

const COLUMNS = [
  ["שם", l => l.name], ["טלפון", l => l.phone], ["מייל", l => l.email],
  ["חברה / ארגון", l => l.organization || l.business_name], ["תפקיד", l => l.job_title],
  ["מפגש", l => l.session], ["סטטוס", l => STATUSES[l.status] || l.status],
  ["תאריך פנייה", l => new Date(l.created_date).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })],
];
const cell = v => `"${String(v ?? "").replace(/"/g, '""')}"`;

// Exports every lead of the campaign (all statuses) to a CSV file that opens in Excel.
export default function LeadsExportButton({ entity, title }) {
  const [busy, setBusy] = useState(false);
  async function exportAll() {
    setBusy(true);
    const leads = [];
    let cursor = null;
    do {
      const page = await base44.entities[entity].filter({}, { sort: "-created_date", limit: 200, ...(cursor ? { cursor } : {}) });
      leads.push(...page.items);
      cursor = page.has_more ? page.next_cursor : null;
    } while (cursor);
    const csv = [COLUMNS.map(([h]) => cell(h)).join(","), ...leads.map(l => COLUMNS.map(([, get]) => cell(get(l))).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `לידים - ${title} - ${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
    setBusy(false);
  }
  return <Button variant="outline" onClick={exportAll} disabled={busy} className="h-11 gap-2">
    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}ייצוא לאקסל
  </Button>;
}