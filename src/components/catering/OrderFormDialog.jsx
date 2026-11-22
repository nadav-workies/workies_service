import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { TIME_SLOTS, newToken } from "@/lib/catering";

const EMPTY = { company: "", contact_name: "", contact_phone: "", contact_email: "", event_name: "", event_date: "", event_time: "", time_slot: "", guests_count: "", location: "", aio_agreement_ref: "", message_to_customer: "" };

// Creates a new catering order link for an event, or edits the event details of an existing one.
export default function OrderFormDialog({ open, onOpenChange, order, user, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(order ? Object.fromEntries(Object.keys(EMPTY).map((k) => [k, order[k] ?? ""])) : EMPTY);
  }, [open, order]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save() {
    if (!form.company.trim() || !form.event_date) { setError("נא למלא לפחות שם לקוח ותאריך אירוע"); return; }
    setSaving(true);
    setError("");
    const who = user?.full_name || user?.email || "";
    const data = { ...form, guests_count: Number(form.guests_count) || null, time_slot: form.time_slot || null };
    try {
      let saved;
      if (order) {
        saved = await base44.entities.CateringOrder.update(order.id, {
          ...data, history: [...(order.history || []), { date: new Date().toISOString(), action: "עודכנו פרטי האירוע", user: who }],
        });
      } else {
        const last = await base44.entities.CateringOrder.list("-created_date", 1);
        const lastNum = Number(String(last?.[0]?.order_number || "").replace(/\D/g, "")) || 1000;
        saved = await base44.entities.CateringOrder.create({
          ...data, order_number: `CT-${lastNum + 1}`, token: newToken(), status: "link_created", lines: [], total: 0,
          created_by_name: who, history: [{ date: new Date().toISOString(), action: "נוצר קישור הזמנה", user: who }],
        });
      }
      onSaved(saved);
      onOpenChange(false);
    } catch (e) {
      setError(e?.message || "השמירה נכשלה");
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{order ? "עריכת פרטי האירוע" : "קישור הזמנת הסעדה חדש"}</DialogTitle></DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 sm:col-span-2"><Label>לקוח / חברה *</Label><Input value={form.company} onChange={set("company")} placeholder="לדוגמה: אסם" /></div>
          <div className="space-y-1.5"><Label>איש קשר</Label><Input value={form.contact_name} onChange={set("contact_name")} /></div>
          <div className="space-y-1.5"><Label>טלפון</Label><Input dir="ltr" type="tel" value={form.contact_phone} onChange={set("contact_phone")} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>אימייל</Label><Input dir="ltr" type="email" value={form.contact_email} onChange={set("contact_email")} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>שם האירוע</Label><Input value={form.event_name} onChange={set("event_name")} placeholder="לדוגמה: יום גיבוש צוות מכירות" /></div>
          <div className="space-y-1.5"><Label>תאריך *</Label><Input type="date" value={form.event_date} onChange={set("event_date")} /></div>
          <div className="space-y-1.5"><Label>שעת הגשה</Label><Input type="time" value={form.event_time} onChange={set("event_time")} /></div>
          <div className="space-y-1.5">
            <Label>חלק היום</Label>
            <select value={form.time_slot} onChange={set("time_slot")} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">לא נבחר</option>
              {Object.entries(TIME_SLOTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><Label>מספר משתתפים</Label><Input type="number" value={form.guests_count} onChange={set("guests_count")} /></div>
          <div className="space-y-1.5"><Label>חדר / חלל</Label><Input value={form.location} onChange={set("location")} /></div>
          <div className="space-y-1.5"><Label>מספר הסכם ב-AIO</Label><Input dir="ltr" value={form.aio_agreement_ref} onChange={set("aio_agreement_ref")} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>הודעה אישית ללקוח (תופיע בראש הטופס)</Label><Textarea rows={3} value={form.message_to_customer} onChange={set("message_to_customer")} placeholder="היי, מצרף את תפריטי ההסעדה שלנו לאירוע. אפשר לבחור ולשלוח, ואני אאשר מולכם." /></div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={save} disabled={saving} className="gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{order ? "שמירה" : "יצירת קישור"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
