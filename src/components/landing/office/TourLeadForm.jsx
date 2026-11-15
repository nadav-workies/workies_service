import { useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getLeadSid } from "@/lib/ctmSid";
import { completeLandingLead } from "@/lib/landingTracking";
import CallboxSidField from "@/components/landing/CallboxSidField";

const SIZES = [["1", "1"], ["2-3", "2–3"], ["4+", "4 ומעלה"]];

export default function TourLeadForm({ id, title }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [teamSize, setTeamSize] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const email = String(data.get("email") || "").trim();
    if (!name || !/^\+?[\d\s()-]+$/.test(phone) || phone.replace(/\D/g, "").length < 9) { setError("יש למלא שם וטלפון תקינים."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("יש למלא אימייל תקין."); return; }
    if (!teamSize) { setError("בחרו כמה אנשים יעבדו במשרד."); return; }
    setBusy(true); setError("");
    try {
      const res = await base44.functions.invoke("submitCampaignLead", { campaign: "office", name, phone, email, team_size: teamSize, sid: getLeadSid() });
      if (!res.data?.success) throw new Error("Lead not saved");
      completeLandingLead("office");
    } catch { setError("הפרטים לא נשלחו. נסו שוב בעוד רגע."); setBusy(false); }
  }
  return <form onSubmit={submit} className="ot-form" noValidate>
    <CallboxSidField />
    {title && <h2 className="ot-form-title">{title}</h2>}
    <label className="ot-label" htmlFor={`${id}-name`}>שם</label>
    <input className="ot-input" id={`${id}-name`} name="name" autoComplete="name" required maxLength={100} disabled={busy} />
    <label className="ot-label" htmlFor={`${id}-phone`}>טלפון</label>
    <input className="ot-input" id={`${id}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} disabled={busy} dir="ltr" />
    <label className="ot-label" htmlFor={`${id}-email`}>אימייל</label>
    <input className="ot-input" id={`${id}-email`} name="email" type="email" autoComplete="email" required maxLength={150} disabled={busy} dir="ltr" />
    <p className="ot-label" id={`${id}-size`}>כמה אנשים יעבדו במשרד?</p>
    <div className="ot-sizes" role="radiogroup" aria-labelledby={`${id}-size`}>
      {SIZES.map(([value, label]) => <button key={value} type="button" role="radio" aria-checked={teamSize === value} disabled={busy}
        className="ot-size" onClick={() => { setTeamSize(value); setError(""); }}>{label}</button>)}
    </div>
    {error && <p role="alert" className="ot-error">{error}</p>}
    <button type="submit" className="ot-btn ot-btn--full" disabled={busy}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}{busy ? "שולחים…" : "לתיאום סיור במתחם"}</button>
  </form>;
}