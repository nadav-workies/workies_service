import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { submitReferral } from "@/lib/referralService";
import { isCampaignActive } from "@/lib/referralConfig";

export default function ReferralForm({ user, onSubmitted, onOpenTerms }) {
  const [form, setForm] = useState({ friend_name: "", friend_phone: "", details: "" });
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const active = isCampaignActive();
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const phoneOk = form.friend_phone.replace(/\D/g, "").length >= 9;
  const valid = form.friend_name.trim() && phoneOk && accepted && active;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { ticket } = await submitReferral(user, {
        friend_name: form.friend_name.trim(), friend_phone: form.friend_phone.trim(), details: form.details.trim(),
      });
      setDone(ticket.ticket_number);
      setForm({ friend_name: "", friend_phone: "", details: "" });
      setAccepted(false);
      onSubmitted?.();
    } catch (err) {
      setError(err.message || "שגיאה בשליחת ההמלצה");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <Card><CardContent className="pt-6 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
        <p className="font-bold">תודה! ההמלצה התקבלה</p>
        <p className="text-sm text-muted-foreground">נפתחה קריאה מספר {done}. צוות Workies ייצור קשר עם החבר/ה.</p>
        <Button variant="outline" onClick={() => setDone(null)}>המלצה נוספת</Button>
      </CardContent></Card>
    );
  }

  return (
    <Card><CardContent className="pt-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>שם החבר/ה *</Label>
          <Input value={form.friend_name} onChange={e => update("friend_name", e.target.value)} placeholder="שם מלא" />
        </div>
        <div className="space-y-1.5">
          <Label>טלפון *</Label>
          <Input value={form.friend_phone} onChange={e => update("friend_phone", e.target.value)} placeholder="050-0000000" type="tel" dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label>פרטים נוספים</Label>
          <Textarea value={form.details} onChange={e => update("details", e.target.value)} rows={3} placeholder="למשל: שם החברה, כמה עמדות מחפשים, מתי נוח לחזור" />
        </div>
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="w-4 h-4 mt-0.5" />
          <span>קראתי ואני מאשר/ת את <button type="button" onClick={onOpenTerms} className="text-primary underline">תקנון המבצע</button></span>
        </label>
        {!active && <p className="text-sm text-destructive">המבצע הסתיים ב-15.10.2026 ולא ניתן לשלוח המלצות חדשות.</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={!valid || saving} className="w-full gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {saving ? "שולח..." : "שליחת ההמלצה"}
        </Button>
      </form>
    </CardContent></Card>
  );
}