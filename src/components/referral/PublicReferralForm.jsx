import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { WORKIES_ROOMS } from "@/lib/workiesRooms";

const EMPTY = { referrer_room: "", friend_name: "", friend_phone: "", details: "" };
const OFFICES = WORKIES_ROOMS.filter(r => r.room_area === "משרדים");
const phoneOk = (p) => p.replace(/\D/g, "").length >= 9;

export default function PublicReferralForm({ onOpenTerms }) {
  const [form, setForm] = useState(EMPTY);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.referrer_room && form.friend_name.trim() && phoneOk(form.friend_phone) && accepted;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await base44.functions.invoke("publicReferral", { ...form, terms_accepted: accepted });
      setDone(res.data.ticket_number);
      setForm(EMPTY);
      setAccepted(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "שגיאה בשליחה");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="text-center space-y-3 py-4">
        <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto" />
        <p className="font-bold text-lg">תודה! ההמלצה התקבלה</p>
        <p className="text-sm text-zinc-300">מספר פנייה {done}. צוות Workies ייצור קשר עם החבר/ה.</p>
        <Button variant="outline" className="text-zinc-950" onClick={() => setDone(null)}>המלצה נוספת</Button>
      </div>
    );
  }

  const field = (key, label, props = {}) => (
    <div className="space-y-1">
      <Label className="text-zinc-200 text-xs">{label}</Label>
      <Input value={form[key]} onChange={e => update(key, e.target.value)} className="bg-white text-zinc-950" {...props} />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-bold text-teal-400">דייר/ת Workies — המשרד שלך</p>
        <select value={form.referrer_room} onChange={e => update("referrer_room", e.target.value)}
          className="w-full h-10 rounded-md bg-white text-zinc-950 px-3 text-sm">
          <option value="">בחירת משרד / עמדה *</option>
          {OFFICES.map(r => <option key={r.room_number} value={r.room_number}>משרד {r.room_number} — {r.room_label}</option>)}
          <option value="desk">עמדה (ללא משרד)</option>
        </select>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-bold text-teal-400">פרטי החבר/ה</p>
        {field("friend_name", "שם *")}
        {field("friend_phone", "טלפון *", { type: "tel", dir: "ltr", placeholder: "050-0000000" })}
        <div className="space-y-1">
          <Label className="text-zinc-200 text-xs">פרטים נוספים</Label>
          <Textarea rows={3} value={form.details} onChange={e => update("details", e.target.value)} className="bg-white text-zinc-950" placeholder="שם החברה, כמה עמדות, מתי נוח לחזור" />
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="w-4 h-4 mt-0.5" />
        <span>קראתי ואני מאשר/ת את <button type="button" onClick={onOpenTerms} className="text-teal-300 underline">תקנון המבצע</button></span>
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={!valid || saving}
        className="w-full h-11 rounded-full bg-teal-400 text-zinc-950 font-bold hover:bg-teal-300 disabled:opacity-50 inline-flex items-center justify-center gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{saving ? "שולח..." : "שליחת ההמלצה"}
      </button>
    </form>
  );
}