import { useState } from "react";
import { base44 } from "@/api/base44Client";
import HRCalendarButtons from "@/components/landing/hr/HRCalendarButtons";

const QUICK = [["name", "שם מלא", "text", "name"], ["phone", "טלפון נייד", "tel", "tel"], ["email", "אימייל", "email", "email"]];
const DETAILS = [["organization", "ארגון", "text", "organization"], ["job_title", "תפקיד", "text", "organization-title"]];
const STORE = "hr_meetup_registration";

function loadSaved() { try { return JSON.parse(localStorage.getItem(STORE)) || null; } catch { return null; } }

function Fields({ list }) {
  return <div className="hr-fields">{list.map(([name, label, type, auto]) => <label key={name}><span>{label}</span>
    <input name={name} type={type} autoComplete={auto} required maxLength={150} dir={type === "email" || type === "tel" ? "ltr" : "rtl"} placeholder={type === "tel" ? "050-0000000" : undefined} />
  </label>)}</div>;
}

export default function HRMeetupForm() {
  const [saved, setSaved] = useState(loadSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const step = saved?.step || "quick";

  function persist(next) { localStorage.setItem(STORE, JSON.stringify(next)); setSaved(next); }

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, String(v).trim()]));
    const phoneOk = step !== "quick" || (/^\+?[\d\s()-]+$/.test(d.phone) && d.phone.replace(/\D/g, "").length >= 9);
    if (!form.checkValidity() || !phoneOk) { setError(step === "quick" ? "יש למלא שם, טלפון ואימייל תקינים." : "יש למלא ארגון ותפקיד."); return; }
    setBusy(true); setError("");
    try {
      if (step === "quick") {
        const res = await base44.functions.invoke("submitCampaignLead", { campaign: "hr_meetup", ...d });
        persist({ step: "details", lead_id: res.data.lead_id, token: res.data.token, first_name: d.name.split(" ")[0] });
      } else {
        await base44.functions.invoke("submitCampaignLead", { campaign: "hr_meetup", step: "details", lead_id: saved.lead_id, token: saved.token, ...d });
        persist({ ...saved, step: "done", token: "" });
      }
    } catch (err) { setError(err?.response?.data?.error || "השליחה לא הצליחה. נסו שוב."); }
    finally { setBusy(false); }
  }

  if (step === "done") return <div role="status" className="hr-done"><h3>תודה{saved.first_name ? `, ${saved.first_name}` : ""}!</h3><p>הפרטים נשמרו. נשלח תזכורות לפני המיטאפ.</p><HRCalendarButtons /></div>;
  return <form key={step} onSubmit={submit} noValidate className="hr-form">
    {step === "details" && <div role="status" className="hr-done hr-done-inline"><h3>המקום שלך שמור!</h3><p>אישור הרשמה נשלח למייל. נשמח להשלמת שני פרטים קצרים:</p></div>}
    <Fields list={step === "quick" ? QUICK : DETAILS} />
    {error && <p role="alert" className="hr-error">{error}</p>}
    <button type="submit" disabled={busy} className="hr-btn hr-btn-block">{busy ? "שולחים…" : step === "quick" ? "שריון מקום ←" : "שמירת פרטים"}</button>
    {step === "details" ? <HRCalendarButtons /> : <p className="hr-note">רישום מהיר · אישור הרשמה יישלח לכתובת האימייל שהוזנה.</p>}
  </form>;
}