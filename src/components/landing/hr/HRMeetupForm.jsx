import { useState } from "react";
import { base44 } from "@/api/base44Client";

const FIELDS = [
  ["name", "שם מלא", "text", "name"],
  ["phone", "טלפון נייד", "tel", "tel"],
  ["email", "אימייל", "email", "email"],
  ["organization", "ארגון", "text", "organization"],
  ["job_title", "תפקיד", "text", "organization-title"],
];

export default function HRMeetupForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, String(v).trim()]));
    const phoneOk = /^\+?[\d\s()-]+$/.test(d.phone) && d.phone.replace(/\D/g, "").length >= 9;
    if (!form.checkValidity() || !phoneOk) { setError("יש למלא את כל השדות, עם טלפון ואימייל תקינים."); return; }
    setBusy(true); setError("");
    try { await base44.functions.invoke("submitCampaignLead", { campaign: "hr_meetup", ...d }); setDone(true); }
    catch (err) { setError(err?.response?.data?.error || "ההרשמה לא נשלחה. נסו שוב."); }
    finally { setBusy(false); }
  }
  if (done) return <div role="status" className="hr-done"><h3>המקום שלך שמור!</h3><p>אישור הרשמה יישלח לכתובת האימייל שהוזנה.</p></div>;
  return <form onSubmit={submit} noValidate className="hr-form">
    <div className="hr-fields">
      {FIELDS.map(([name, label, type, auto]) => <label key={name}><span>{label}</span>
        <input name={name} type={type} autoComplete={auto} required maxLength={150} dir={type === "email" || type === "tel" ? "ltr" : "rtl"} placeholder={type === "tel" ? "050-0000000" : undefined} />
      </label>)}
    </div>
    {error && <p role="alert" className="hr-error">{error}</p>}
    <button type="submit" disabled={busy} className="hr-btn hr-btn-block">{busy ? "שולחים…" : "שריון מקום ←"}</button>
    <p className="hr-note">כל השדות נדרשים · אישור הרשמה יישלח לכתובת האימייל שהוזנה.</p>
  </form>;
}