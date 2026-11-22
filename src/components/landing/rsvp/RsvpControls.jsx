import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Check, X, Link2, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RSVP, RSVP_SOURCE, formatDateTime } from "@/lib/rsvp";

// RSVP row inside an event lead card: the representative marks attendance or sends the lead a link.
export default function RsvpControls({ lead, entity, campaign, onSaved }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function run(key, fn) {
    setBusy(key); setError("");
    try { await fn(); } catch (e) { setError(e?.response?.data?.error || "הפעולה לא הושלמה. נסו שוב."); } finally { setBusy(""); }
  }
  const mark = status => run(status, async () => {
    const me = await base44.auth.me();
    await base44.entities[entity].update(lead.id, { rsvp_status: status, rsvp_at: new Date().toISOString(), rsvp_source: "representative", rsvp_by: me.full_name || me.email });
    await onSaved();
  });
  const copyLink = () => run("link", async () => {
    const { data } = await base44.functions.invoke("eventRsvp", { action: "link", campaign, lead_id: lead.id });
    await navigator.clipboard.writeText(data.url);
    toast({ title: "קישור אישור ההגעה הועתק", description: "אפשר להדביק ולשלוח לנרשם/ת בכל ערוץ." });
  });
  const send = () => run("send", async () => {
    const { data } = await base44.functions.invoke("eventRsvp", { action: "send", campaign, lead_id: lead.id });
    await onSaved();
    if (!data.sent) throw new Error();
    toast({ title: "בקשת אישור הגעה נשלחה במייל" });
  });
  const pick = (status, Icon, on) => <Button type="button" size="sm" variant="outline" disabled={!!busy} onClick={() => mark(status)} aria-pressed={lead.rsvp_status === status}
    className={cn("h-9 gap-1.5 transition-colors", lead.rsvp_status === status && on)}>
    {busy === status ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}{RSVP[status]}
  </Button>;
  return <div className="border-t px-4 py-3 space-y-2">
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium me-1">אישור הגעה</span>
      {pick("attending", Check, "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-600/90 hover:text-white")}
      {pick("not_attending", X, "bg-destructive border-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground")}
      <span className="hidden sm:block w-px h-6 bg-border mx-1" />
      <Button type="button" size="sm" variant="ghost" disabled={!!busy} onClick={copyLink} className="h-9 gap-1.5">{busy === "link" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}העתקת קישור</Button>
      <Button type="button" size="sm" variant="ghost" disabled={!!busy || !lead.email} onClick={send} title={lead.email ? "" : "אין מייל לנרשם/ת"} className="h-9 gap-1.5">{busy === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}שליחה במייל</Button>
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {lead.rsvp_status ? <span>עודכן ע״י {RSVP_SOURCE[lead.rsvp_source] || "נציג/ה"}{lead.rsvp_by && lead.rsvp_source !== "link" ? ` ${lead.rsvp_by}` : ""} · {formatDateTime(lead.rsvp_at)}</span> : <span>טרם התקבל אישור הגעה</span>}
      {lead.rsvp_requested_at && <span className={lead.rsvp_request_status === "failed" ? "text-destructive" : ""}>{lead.rsvp_request_status === "failed" ? "שליחת המייל נכשלה" : "בקשה נשלחה במייל"} · {formatDateTime(lead.rsvp_requested_at)}</span>}
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}