import { useEffect } from "react";
import "@/components/landing/hr/HRMeetup.css";
import useLandingImages from "@/hooks/useLandingImages";
import HRHero from "@/components/landing/hr/HRHero";
import HRLecture from "@/components/landing/hr/HRLecture";
import HRSchedule from "@/components/landing/hr/HRSchedule";
import HRLogos from "@/components/landing/hr/HRLogos";
import HRMeetupForm from "@/components/landing/hr/HRMeetupForm";
import CampaignValidityGate from "@/components/landing/CampaignValidityGate";
import { LECTURES } from "@/components/landing/hr/hrContent";

export default function HRMeetup() {
  const editor = useLandingImages("hr_meetup");
  useEffect(() => { document.title = "HR מחוץ לשגרה | מיטאפ למנהלות משאבי אנוש | Workies"; }, []);
  return <div dir="rtl" lang="he" className="hr-page landing-font">
    {editor.canEdit && <p className="hr-admin-bar">מצב עריכה: לחיצה על תמונה מחליפה אותה</p>}
    {editor.needsLogin && <p className="hr-admin-bar">כדי לערוך את העמוד יש להתחבר כאדמין · <button type="button" onClick={editor.login} className="underline font-bold">התחברות</button></p>}
    <HRHero editor={editor} />
    <main>
      {LECTURES.map((l, i) => <HRLecture key={l.title} lecture={l} editor={editor} alt={i % 2 === 1} />)}
      <HRSchedule />
      <section id="register" className="hr-register" aria-labelledby="hr-register-title">
        <div className="hr-wrap hr-register-grid">
          <div>
            <span className="hr-badge">ללא עלות</span>
            <h2 id="hr-register-title" className="hr-register-title">שריון מקום בפחות מדקה</h2>
            <p className="hr-register-meta"><b>יום שלישי | 24.11.2026 | <bdi dir="ltr">09:00–12:00</bdi></b></p>
            <p className="hr-register-meta">WORKIES, באר שבע</p>
            <p className="hr-register-meta">ההשתתפות ללא עלות, בהרשמה מראש.</p>
            <p className="hr-register-small">מספר המקומות מוגבל. ההרשמה פתוחה עד 23.11.2026.</p>
          </div>
          <div className="hr-form-card">
            <h3 className="hr-form-title">פרטי הרשמה</h3>
            <CampaignValidityGate campaign="hr_meetup"><HRMeetupForm /></CampaignValidityGate>
          </div>
        </div>
      </section>
      <section className="hr-closing">
        <div className="hr-wrap">
          <h2>מחכות לכן לבוקר קצת אחר</h2>
          <p>בוקר של מפגש מקצועי, למידה, רעיונות חדשים, חיבורים משמעותיים וכמובן ארוחת בוקר מפנקת.</p>
          <p><b>שריינו את מקומכן והצטרפו אלינו!</b></p>
          <a href="#register" className="hr-btn">אני רוצה להירשם</a>
        </div>
      </section>
      <HRLogos />
    </main>
    <footer className="hr-footer">
      <div className="hr-wrap hr-footer-row">
        <span className="hr-logo">Workies</span>
        <span className="hr-tag">WORK • MEET • GROW</span>
        <span>בשיתוף PARGODA</span>
      </div>
    </footer>
  </div>;
}