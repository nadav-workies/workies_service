import { useState } from "react";
import { base44 } from "@/api/base44Client";

export const EVENT = {
  session: "01",
  date: "2026-11-10",
  start: new Date("2026-11-10T13:30:00+02:00"),
  dayLabel: "יום שלישי, 10.11",
  timeLabel: "13:30–14:30",
  place: "Workies באר שבע",
  calendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("Workies AI | בונים עמוד נחיתה עם Claude") + "&dates=20261110T113000Z/20261110T123000Z&location=" + encodeURIComponent("Workies, באר שבע"),
};

export default function WorkiesAIForm({ onDone }) {
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
      business_name: String(d.get("business_name") || "").trim(),
      session: EVENT.session,
      session_date: EVENT.date,
      terms_accepted: d.get("terms_accepted") === "on",
    };
    const phoneOk = /^\+?[\d\s()-]+$/.test(payload.phone) && payload.phone.replace(/\D/g, "").length >= 9;
    if (!form.checkValidity() || !phoneOk) { setError("יש למלא שם, טלפון ושם העסק, ולאשר את תנאי ההשתתפות."); return; }
    setBusy(true); setError("");
    try {
      await base44.functions.invoke("submitCampaignLead", payload);
      setDone(true);
      onDone?.();
    } catch {
      setError("ההרשמה לא נשלחה. נסו שוב בעוד רגע.");
    } finally { setBusy(false); }
  }

  if (done) {
    return (
      <div className="reg reg-done" role="status">
        <div className="reg-check" aria-hidden="true">✓</div>
        <h3>נרשמתם.</h3>
        <p>נתראה ב{EVENT.dayLabel} בשעה 13:30, ב-{EVENT.place}.</p>
        <p className="reg-muted">נחזור אליכם להשלמת ההרשמה.</p>
        <a className="btn btn-line-dark" href={EVENT.calendarUrl} target="_blank" rel="noopener noreferrer">הוספה ליומן</a>
      </div>
    );
  }

  return (
    <form className="reg" id="register-form" noValidate onSubmit={submit}>
      <div className="reg-head">
        <span className="live-dot" aria-hidden="true" />
        <h3>שריון מקום למפגש</h3>
      </div>
      <p className="reg-sub">{EVENT.dayLabel} · {EVENT.timeLabel} · ללא עלות</p>
      <label htmlFor="f-name">שם מלא<input id="f-name" name="full_name" type="text" autoComplete="name" maxLength={100} required disabled={busy} /></label>
      <label htmlFor="f-phone">טלפון<input id="f-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} required disabled={busy} /></label>
      <label htmlFor="f-biz">שם העסק<input id="f-biz" name="business_name" type="text" autoComplete="organization" maxLength={150} required disabled={busy} /></label>
      <label className="consent" htmlFor="f-terms"><input id="f-terms" name="terms_accepted" type="checkbox" required disabled={busy} /><span>מאשר/ת את תנאי ההשתתפות: פיקדון בכרטיס אשראי, ללא חיוב על השתתפות, 50 ש"ח במקרה של אי הגעה.</span></label>
      {error && <p className="reg-err" role="alert">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "שולחים…" : "שריון מקום"}</button>
      <p className="reg-note">מספר המקומות מוגבל.</p>
    </form>
  );
}
