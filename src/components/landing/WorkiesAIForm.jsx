import { useState } from "react";
import { base44 } from "@/api/base44Client";

const SESSIONS = [
  ["01", "01 · עמודי נחיתה, אתרים ואפליקציות עם Base44 ו-Claude"],
  ["02", "02 · סרטוני שיווק עם Claude"],
  ["03", "03 · מצגות, עיצובים ותוכן לסושיאל עם Claude"],
  ["04", "04 · אוטומציות וסוכנים חכמים לעסק"],
  ["05", "05 · ניהול זמן, משימות ותיעדוף בעזרת AI"],
  ["06", "06 · GEO: איך גורמים למנועי הבינה למצוא את העסק שלכם?"],
];

export default function WorkiesAIForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (busy || done) return;
    const form = event.currentTarget;
    const d = new FormData(form);
    const payload = {
      campaign: "workies_ai",
      name: String(d.get("full_name") || "").trim(),
      phone: String(d.get("phone") || "").trim(),
      email: String(d.get("email") || "").trim(),
      business_name: String(d.get("business_name") || "").trim(),
      session: String(d.get("session") || ""),
      terms_accepted: d.get("terms_accepted") === "on",
    };
    const phoneOk = /^\+?[\d\s()-]+$/.test(payload.phone) && payload.phone.replace(/\D/g, "").length >= 9;
    if (!form.checkValidity() || !phoneOk) { setError("יש למלא את כל השדות ולאשר את תנאי ההשתתפות."); return; }
    setBusy(true); setError("");
    try {
      await base44.functions.invoke("submitCampaignLead", payload);
      setDone(true);
    } catch {
      setError("ההרשמה לא נשלחה. נסו שוב בעוד רגע.");
    } finally { setBusy(false); }
  }

  return (
    <form className="reg" id="register-form" noValidate onSubmit={submit}>
      <h3>הרשמה למפגש</h3>
      <div className="reg-grid">
        <label htmlFor="f-name">שם מלא<input id="f-name" name="full_name" type="text" autoComplete="name" maxLength={100} required disabled={busy || done} /></label>
        <label htmlFor="f-phone">טלפון<input id="f-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} required disabled={busy || done} /></label>
        <label htmlFor="f-email">אימייל<input id="f-email" name="email" type="email" autoComplete="email" maxLength={150} required disabled={busy || done} /></label>
        <label htmlFor="f-biz">שם העסק<input id="f-biz" name="business_name" type="text" autoComplete="organization" maxLength={150} required disabled={busy || done} /></label>
        <label htmlFor="f-session" className="wide">באיזה מפגש תרצו להשתתף?
          <select id="f-session" name="session" required defaultValue="" disabled={busy || done}>
            <option value="">בחרו מפגש</option>
            {SESSIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>
      <label className="consent" htmlFor="f-terms"><input id="f-terms" name="terms_accepted" type="checkbox" required disabled={busy || done} /><span>קראתי ואני מאשר/ת את תנאי ההשתתפות, כולל השארת פרטי כרטיס אשראי כפיקדון וחיוב של 50 ש"ח במקרה של אי הגעה.</span></label>
      {error && <p className="reg-err" role="alert">{error}</p>}
      <button className="btn" type="submit" disabled={busy || done}>{busy ? "שולחים…" : "הרשמה למפגש"}</button>
      {done && <p className="reg-ok" role="status">הפרטים התקבלו. נחזור אליכם להשלמת ההרשמה.</p>}
    </form>
  );
}
