import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const STATUSES = { new: "חדש", contacted: "נוצר קשר", scheduled: "תואמה התנסות", completed: "ההתנסות בוצעה", not_relevant: "לא רלוונטי" };
export default function DailyOfficeLeadRow({ lead, onSaved, entity = "DailyOfficeLead", category = "התנסות במשרד יומי" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function update(status) {
    setBusy(true); setError("");
    try { await base44.entities[entity].update(lead.id, { status }); await onSaved(); }
    catch { setError("העדכון לא נשמר. נסו שוב."); }
    finally { setBusy(false); }
  }
  return <article className={`border rounded-xl p-4 flex flex-wrap items-center gap-4 ${lead.status === "not_relevant" ? "bg-destructive/10 border-destructive/40" : "bg-card"}`}>
    <div className="flex-1 min-w-0"><span className="inline-block rounded-full bg-primary/10 text-primary px-2 py-1 text-xs mb-2">{category}</span><h2 className="font-bold break-words">{lead.name}</h2><a href={`tel:${(lead.phone || "").replace(/[^+\d]/g, "")}`} dir="ltr" className="text-primary inline-flex min-h-11 items-center underline">{lead.phone}</a>{lead.business_name && <p className="text-sm">{lead.business_name}{lead.session && <span className="text-muted-foreground"> · מפגש {lead.session}</span>}</p>}{lead.organization && <p className="text-sm">{lead.organization}{lead.job_title && <span className="text-muted-foreground"> · {lead.job_title}</span>}</p>}{lead.email && <p dir="ltr" className="text-sm text-muted-foreground text-right break-all">{lead.email}</p>}<p className="text-xs text-muted-foreground">{new Date(lead.created_date).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" })}</p></div>
    <div className="space-y-2 w-full sm:w-auto"><Button asChild variant="outline" className="w-full min-h-11 gap-2"><a href="https://workies-aio-docs-production.up.railway.app/pipeline" target="_blank" rel="noopener noreferrer" title="פתיחת עמוד הדילים ב־AIO להוספה ידנית"><ExternalLink className="w-4 h-4" />הוספה ל־AIO</a></Button><Select value={lead.status || "new"} onValueChange={update} disabled={busy}><SelectTrigger aria-label={`סטטוס הפנייה של ${lead.name}`} className="w-full sm:w-44 h-11"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUSES).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>
  </article>;
}