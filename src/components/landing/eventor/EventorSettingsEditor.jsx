import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useEventorSettings from "@/hooks/useEventorSettings";

const FIELDS = [
  ["phone", "טלפון לפרטים והזמנות", "text"], ["whatsapp_url", "קישור וואטסאפ", "url"],
  ["capacity_eventor", "קיבולת האיוונטור", "number"], ["capacity_classroom", "קיבולת כיתת לימוד", "number"],
  ["capacity_mamad", "קיבולת כיתת ממ״ד", "number"], ["capacity_meeting", "קיבולת חדר ישיבות", "number"],
];

export default function EventorSettingsEditor() {
  const { data, isPending } = useEventorSettings();
  const client = useQueryClient();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { if (data) setForm(data); }, [data]);
  async function save(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      if (!/^https:\/\//.test(form.whatsapp_url)) throw new Error("קישור הוואטסאפ צריך להתחיל ב־https://");
      const value = Object.fromEntries(FIELDS.map(([k, , t]) => [k, t === "number" ? Number(form[k]) : String(form[k]).trim()]));
      if (data.id) await base44.entities.EventorSettings.update(data.id, value);
      else await base44.entities.EventorSettings.create(value);
      await client.invalidateQueries({ queryKey: ["eventor-settings"] });
      setMessage("הפרטים נשמרו ומוצגים בעמוד.");
    } catch (err) { setMessage(err.message?.startsWith("קישור") ? err.message : "השמירה נכשלה. נסו שוב."); }
    finally { setBusy(false); }
  }
  if (isPending || !form) return <p role="status">טוענים פרטים…</p>;
  return <form onSubmit={save} className="rounded-xl border bg-card p-4 space-y-3">
    <div><h2 className="font-bold">פרטי קשר וקיבולות בעמוד</h2><p className="text-sm text-muted-foreground">כל שינוי כאן מתעדכן מיד בעמוד הציבורי.</p></div>
    <div className="grid sm:grid-cols-2 gap-3">
      {FIELDS.map(([k, label, type]) => <label key={k} className="block space-y-1 text-sm"><span>{label}</span>
        <Input type={type} dir={type === "number" ? undefined : "ltr"} min={type === "number" ? 1 : undefined} required value={form[k] ?? ""} disabled={busy} onChange={e => { setForm(f => ({ ...f, [k]: e.target.value })); setMessage(""); }} />
      </label>)}
    </div>
    <Button type="submit" disabled={busy}>{busy ? "שומרים…" : "שמירה"}</Button>
    {message && <p role="status" className="text-sm">{message}</p>}
  </form>;
}