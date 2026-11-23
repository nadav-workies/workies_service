import { useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { captureUtm, trackEventor } from "@/lib/eventorTracking";
import { getLeadSid } from "@/lib/ctmSid";

const FIELDS = [
  { key: "name", label: "שם מלא", type: "text", autoComplete: "name" },
  { key: "phone", label: "טלפון", type: "tel", autoComplete: "tel", dir: "ltr", inputMode: "tel" },
  { key: "email", label: "מייל", type: "email", autoComplete: "email", dir: "ltr" },
];

function validate(v) {
  const e = {};
  if (!v.name.trim()) e.name = "נא למלא שם מלא";
  if (!/^05\d{8}$/.test(v.phone.replace(/[\s-]/g, ""))) e.phone = "נא למלא מספר נייד תקין, למשל 050-1234567";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "נא למלא כתובת מייל תקינה";
  return e;
}

export default function EventorLeadForm({ whatsappUrl }) {
  const [values, setValues] = useState({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState("idle");
  const [serverError, setServerError] = useState("");

  const submit = async e => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) return e.currentTarget.querySelector(`[name="${Object.keys(errs)[0]}"]`)?.focus();
    setState("sending"); setServerError("");
    const res = await base44.functions.invoke("submitCampaignLead", { campaign: "eventor", ...values, ...captureUtm(), sid: getLeadSid() }).catch(err => ({ data: { error: err?.response?.data?.error || "השליחה נכשלה. נסו שוב." } }));
    if (res.data?.success) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "generate_lead", campaign: "eventor", form_id: "eventor_form" });
      window.fbq?.("track", "Lead");
      return setState("done");
    }
    setServerError(res.data?.error || "השליחה נכשלה. נסו שוב."); setState("idle");
  };

  if (state === "done") return <div className="ev-form-card" role="status">
    <p className="ev-form-title">תודה, קיבלנו. מנהל תיק האירועים יחזור אליכם בקרוב.</p>
    <a href={whatsappUrl} target="_blank" rel="noopener" onClick={() => trackEventor("whatsapp_click", "lead_form")} className="ev-btn ev-btn-primary"><MessageCircle className="w-5 h-5" aria-hidden="true" />לוואטסאפ</a>
  </div>;

  return <form className="ev-form-card" onSubmit={submit} noValidate>
    <h3 className="ev-form-title">השאירו פרטים ונחזור אליכם</h3>
    {FIELDS.map(f => <div key={f.key} className="ev-field">
      <label htmlFor={`ev-${f.key}`}>{f.label}</label>
      <input id={`ev-${f.key}`} name={f.key} type={f.type} autoComplete={f.autoComplete} dir={f.dir} inputMode={f.inputMode} required
        value={values[f.key]} onChange={e => setValues({ ...values, [f.key]: e.target.value })}
        aria-invalid={!!errors[f.key]} aria-describedby={errors[f.key] ? `ev-${f.key}-err` : undefined} />
      {errors[f.key] && <span id={`ev-${f.key}-err`} className="ev-err">{errors[f.key]}</span>}
    </div>)}
    {serverError && <span className="ev-err" role="alert">{serverError}</span>}
    <button type="submit" className="ev-btn ev-btn-primary" disabled={state === "sending"}>
      {state === "sending" && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}שלחו לי פרטים
    </button>
    <p className="ev-form-note">נחזור אליכם תוך יום עבודה. לא נשלח דיוור בלי הסכמה.</p>
  </form>;
}