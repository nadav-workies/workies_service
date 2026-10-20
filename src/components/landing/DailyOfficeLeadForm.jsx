import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function DailyOfficeLeadForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    if (!name || !/^\+?[\d\s()-]+$/.test(phone) || phone.replace(/\D/g, "").length < 9) { setError("יש למלא שם ומספר טלפון תקין."); return; }
    setBusy(true); setError("");
    try {
      await base44.entities.DailyOfficeLead.create({ name, phone, status: "new" });
      setDone(true);
    } catch { setError("הפנייה לא נשלחה. נסו שוב בעוד רגע."); }
    finally { setBusy(false); }
  }
  if (done) return <div role="status" className="office-success office-fade office-delay-3 text-center py-8 space-y-3"><CheckCircle2 className="w-12 h-12 text-primary mx-auto" /><h2 className="text-2xl font-bold">הפנייה נקלטה!</h2><p className="text-muted-foreground">ניצור קשר לתיאום ההתנסות במשרד היומי.</p></div>;
  return (
    <form onSubmit={submit} className="office-form office-fade office-delay-3">
      <div><h2>נרשמים להתנסות</h2><p className="office-lead">משאירים שם וטלפון, ונחזור לתיאום.</p></div>
      <div className="office-field"><Label htmlFor="office-lead-name">שם מלא</Label><Input id="office-lead-name" name="name" autoComplete="name" required maxLength={100} disabled={busy} className="h-12 bg-background" placeholder="איך קוראים לך?" /></div>
      <div className="office-field"><Label htmlFor="office-lead-phone">טלפון</Label><Input id="office-lead-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} disabled={busy} className="h-12 bg-background text-right" dir="ltr" placeholder="מספר לחזרה" /></div>
      {error && <p role="alert" className="text-sm text-foreground">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full h-12 text-base font-bold">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? "שולחים…" : "לתיאום ההתנסות שלי"}</Button>
      <p className="office-note">הפרטים ישמשו ליצירת קשר בקשר להתנסות.</p>
    </form>
  );
}