import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONSENT, splitTags } from "@/lib/mailing";
import useStaticLists from "./useStaticLists";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ContactForm({ contact, onSaved }) {
  const isNew = !contact.id;
  const lists = useStaticLists();
  const [f, setF] = useState({ email: contact.email || "", name: contact.name || "", phone: contact.phone || "", company: contact.company || "", consent: contact.consent || "pending", tags: (contact.tags || []).join(", "), notes: contact.notes || "", list_ids: contact.list_ids || [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const toggleList = id => set("list_ids", f.list_ids.includes(id) ? f.list_ids.filter(x => x !== id) : [...f.list_ids, id]);

  async function save(e) {
    e.preventDefault();
    const email = f.email.trim().toLowerCase();
    if (!EMAIL.test(email)) return setError("כתובת מייל לא תקינה");
    setBusy(true); setError("");
    try {
      const data = { ...f, email, tags: splitTags(f.tags) };
      if (f.consent === "unsubscribed" && contact.consent !== "unsubscribed") data.unsubscribed_at = new Date().toISOString();
      if (isNew) {
        if (await base44.entities.MailContact.count({ email })) { setBusy(false); return setError("כתובת המייל כבר קיימת במאגר"); }
        await base44.entities.MailContact.create({ ...data, sources: ["manual"], score: 0, opens: 0, clicks: 0 });
      } else await base44.entities.MailContact.update(contact.id, data);
      onSaved();
    } catch { setError("השמירה נכשלה. נסו שוב."); setBusy(false); }
  }

  const field = (k, label, props = {}) => <label className="block space-y-1"><span className="text-xs text-muted-foreground">{label}</span><Input value={f[k]} onChange={e => set(k, e.target.value)} {...props} /></label>;
  return <form onSubmit={save} className="mt-4 space-y-3 text-sm">
    {field("email", "מייל", { dir: "ltr", type: "email", disabled: !isNew, required: true })}
    {field("name", "שם")}
    {field("phone", "טלפון", { dir: "ltr" })}
    {field("company", "חברה")}
    <label className="block space-y-1"><span className="text-xs text-muted-foreground">סטטוס הסכמה</span>
      <select value={f.consent} onChange={e => set("consent", e.target.value)} className="h-10 w-full rounded-md border bg-background px-3">
        {Object.entries(CONSENT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select></label>
    {field("tags", "תגיות (מופרדות בפסיק)")}
    {(lists.data || []).length > 0 && <fieldset className="space-y-1"><legend className="text-xs text-muted-foreground mb-1">רשימות</legend>
      {lists.data.map(l => <label key={l.id} className="flex items-center gap-2"><input type="checkbox" checked={f.list_ids.includes(l.id)} onChange={() => toggleList(l.id)} />{l.name}</label>)}
    </fieldset>}
    <label className="block space-y-1"><span className="text-xs text-muted-foreground">הערות</span><Textarea value={f.notes} onChange={e => set("notes", e.target.value)} rows={3} /></label>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Button type="submit" className="w-full" disabled={busy}>{busy ? "שומר..." : "שמירה"}</Button>
  </form>;
}