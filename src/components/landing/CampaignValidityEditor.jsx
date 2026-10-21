import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import useCampaignValidity from "@/hooks/useCampaignValidity";
import { formatEndDate } from "@/lib/campaignValidity";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CampaignValidityEditor({ campaign }) {
  const { data, active, isPending, isError } = useCampaignValidity(campaign);
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const client = useQueryClient();
  useEffect(() => { if (data) setDate(data.end_date || ""); }, [data?.id, data?.end_date]);
  async function save(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const value = { campaign, end_date: date };
      if (data.id) await base44.entities.CampaignValidity.update(data.id, value);
      else await base44.entities.CampaignValidity.create(value);
      await client.invalidateQueries({ queryKey: ["campaign-validity", campaign] });
      setMessage("התוקף עודכן. תאריך עתידי פותח מחדש את ההרשמה באותו קישור.");
    } catch { setMessage("עדכון התוקף נכשל. נסו שוב."); }
    finally { setBusy(false); }
  }
  if (isPending) return <p role="status">טוענים תוקף…</p>;
  if (isError) return <p role="alert">לא ניתן לטעון את הגדרות התוקף.</p>;
  return <form onSubmit={save} className="rounded-xl border bg-card p-4 space-y-3">
    <div><h2 className="font-bold">תוקף הקמפיין / הפעילות</h2><p className="text-sm text-muted-foreground">{active ? "פעיל" : "התוקף הסתיים"} · {formatEndDate(data.end_date)}</p></div>
    <label className="block space-y-1 text-sm"><span>תאריך סיום (כולל)</span><Input type="date" value={date} onChange={e => { setDate(e.target.value); setMessage(""); }} disabled={busy} /></label>
    <p className="text-xs text-muted-foreground">ניתן להאריך גם קמפיין שהסתיים. השארת התאריך ריק מאפשרת הרשמה ללא הגבלת תוקף. התוקף לפי שעון ישראל.</p>
    <Button type="submit" disabled={busy}>{busy ? "שומרים…" : "שמירת תוקף"}</Button>
    {message && <p role="status" className="text-sm">{message}</p>}
  </form>;
}