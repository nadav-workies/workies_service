import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import useCampaignValidity from "@/hooks/useCampaignValidity";
import { PAGE_TYPES, pageTypeOf } from "@/lib/pageTypes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import EventDetailsFields from "@/components/landing/EventDetailsFields";

const FIELDS = ["event_name", "event_date", "event_time", "event_location", "event_program"];

export default function CampaignEmailSettings({ campaign }) {
  const { data, isPending } = useCampaignValidity(campaign);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const client = useQueryClient();
  useEffect(() => {
    if (!data) return;
    setForm({ page_type: pageTypeOf(campaign, data), confirmation_email_enabled: data.confirmation_email_enabled !== false, reminders_enabled: data.reminders_enabled !== false, ...Object.fromEntries(FIELDS.map(f => [f, data[f] || ""])) });
  }, [data?.id, data?.updated_date]);
  if (isPending || !form) return null;
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setMessage(""); };
  async function save(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      if (data.id) await base44.entities.CampaignValidity.update(data.id, form);
      else await base44.entities.CampaignValidity.create({ campaign, end_date: data.end_date || "", ...form });
      await client.invalidateQueries({ queryKey: ["campaign-validity", campaign] });
      setMessage("ההגדרות נשמרו.");
    } catch { setMessage("השמירה נכשלה. נסו שוב."); }
    finally { setBusy(false); }
  }
  const isEvent = form.page_type === "event";
  return <form onSubmit={save} className="rounded-xl border bg-card p-4 space-y-4">
    <div><h2 className="font-bold">סוג העמוד ומיילים לנרשמים</h2><p className="text-sm text-muted-foreground">{PAGE_TYPES[form.page_type].hint}</p></div>
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="סוג העמוד">
      {Object.entries(PAGE_TYPES).map(([key, t]) => <button key={key} type="button" role="radio" aria-checked={form.page_type === key} onClick={() => set("page_type", key)}
        className={`min-h-11 rounded-lg border text-sm font-medium ${form.page_type === key ? "border-primary bg-primary/10 text-primary" : "bg-background"}`}>{t.label}</button>)}
    </div>
    {form.page_type !== "other" && <label className="flex items-center justify-between gap-3 text-sm"><span>{isEvent ? "מייל אישור הרשמה" : "מייל אישור קבלת פרטים"}</span><Switch checked={form.confirmation_email_enabled} onCheckedChange={v => set("confirmation_email_enabled", v)} /></label>}
    {isEvent && <>
      <label className="flex items-center justify-between gap-3 text-sm"><span>תזכורות: 3 ימים לפני ויום לפני</span><Switch checked={form.reminders_enabled} onCheckedChange={v => set("reminders_enabled", v)} /></label>
      <EventDetailsFields form={form} set={set} Input={Input} Textarea={Textarea} />
    </>}
    <Button type="submit" disabled={busy}>{busy ? "שומרים…" : "שמירת הגדרות"}</Button>
    {message && <p role="status" className="text-sm">{message}</p>}
  </form>;
}