import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ExternalLink, Phone, Mail, Building2, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LeadCopyButton from "@/components/landing/LeadCopyButton";

export const STATUSES = { new: "חדש", contacted: "נוצר קשר", scheduled: "תואמה התנסות", completed: "ההתנסות בוצעה", not_relevant: "לא רלוונטי" };
const AIO_URL = "https://workies-aio-docs-production.up.railway.app/pipeline";

export default function DailyOfficeLeadRow({ lead, onSaved, entity = "DailyOfficeLead", category = "התנסות במשרד יומי" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function update(status) {
    setBusy(true); setError("");
    try { await base44.entities[entity].update(lead.id, { status }); await onSaved(); }
    catch { setError("העדכון לא נשמר. נסו שוב."); }
    finally { setBusy(false); }
  }
  const date = new Date(lead.created_date).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" });
  const company = lead.organization || lead.business_name;
  const role = lead.job_title || (lead.session && `מפגש ${lead.session}`);
  const copyFields = [["שם", lead.name], ["טלפון", lead.phone], ["מייל", lead.email], ["חברה", company], ["תפקיד", lead.job_title], ["מפגש", lead.session], ["מקור", category], ["תאריך פנייה", date]];
  return <article className={`border rounded-xl overflow-hidden ${lead.status === "not_relevant" ? "bg-destructive/10 border-destructive/40" : "bg-card"}`}>
    <div className="p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-primary/10 text-primary px-2 py-1 text-xs">{category}</span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{date}</span>
      </div>
      <h2 className="font-bold text-lg break-words">{lead.name}</h2>
      <div className="grid gap-1 sm:grid-cols-2 text-sm">
        <a href={`tel:${(lead.phone || "").replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-2 min-h-9 text-primary underline"><Phone className="w-4 h-4 shrink-0" /><bdi dir="ltr">{lead.phone}</bdi></a>
        {lead.email && <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-2 min-h-9 text-primary break-all"><Mail className="w-4 h-4 shrink-0" /><bdi dir="ltr">{lead.email}</bdi></a>}
        {company && <p className="inline-flex items-center gap-2 min-h-9"><Building2 className="w-4 h-4 shrink-0 text-muted-foreground" />{company}{role && <span className="text-muted-foreground">· {role}</span>}</p>}
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 p-3">
      <Select value={lead.status || "new"} onValueChange={update} disabled={busy}><SelectTrigger aria-label={`סטטוס הפנייה של ${lead.name}`} className="w-full sm:w-44 h-10 bg-card"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUSES).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
      <LeadCopyButton fields={copyFields} className="flex-1 sm:flex-none h-10" />
      <Button asChild variant="outline" className="flex-1 sm:flex-none h-10 gap-2"><a href={AIO_URL} target="_blank" rel="noopener noreferrer" title="פתיחת עמוד הדילים ב־AIO להוספה ידנית"><ExternalLink className="w-4 h-4" />הוספה ל־AIO</a></Button>
      {error && <p role="alert" className="w-full text-sm text-destructive">{error}</p>}
    </div>
  </article>;
}