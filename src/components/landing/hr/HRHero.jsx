import EditableImage from "@/components/landing/EditableImage";
import { SPEAKERS } from "@/components/landing/hr/hrContent";

const FACTS = [["מתי", "חמישי 19.11.2026"], ["שעה", "09:00–12:00"], ["איפה", "WORKIES, באר שבע"], ["השתתפות", "ללא עלות", true]];

export default function HRHero({ editor }) {
  return <header className="hr-hero">
    <nav className="hr-wrap hr-nav">
      <span className="hr-logo">Workies <small>באר שבע</small></span>
      <a href="#register" className="hr-pill">להרשמה</a>
    </nav>
    <div className="hr-wrap hr-hero-grid">
      <div>
        <p className="hr-eyebrow">מיטאפ למנהלות משאבי אנוש</p>
        <h1 className="hr-title">HR מחוץ לשגרה<span className="hr-dot">.</span></h1>
        <p className="hr-sub">בוקר של קפה, קולגות ורעיונות חדשים</p>
        <p className="hr-lead">אנחנו מזמינים אתכן לפתוח את הבוקר קצת אחרת, ליהנות מארוחת בוקר עשירה, לפגוש קולגות מהתחום, להחליף רעיונות ולהכיר כלים חדשים שיכולים לשנות את הדרך שבה אנחנו עובדות.</p>
        <p className="hr-lead">בוקר מקצועי למנהלות משאבי אנוש, עם שתי הרצאות על האתגרים וההזדמנויות שמביאה איתה הבינה המלאכותית לעולם העבודה והניהול.</p>
        <dl className="hr-facts">
          {FACTS.map(([k, v, hi]) => <div key={k} className={hi ? "hr-fact hr-fact-hi" : "hr-fact"}><dt>{k}</dt><dd>{/^\d/.test(v) ? <bdi dir="ltr">{v}</bdi> : v}</dd></div>)}
        </dl>
        <div className="hr-cta-row">
          <a href="#register" className="hr-btn">שריון מקום ←</a>
          <span><b>ההרשמה עד 17.11.2026</b> · מספר המקומות מוגבל</span>
        </div>
      </div>
      <div className="hr-speakers">
        {SPEAKERS.map(s => <div key={s.slot} className="hr-speaker">
          <EditableImage editor={editor} slot={s.slot} alt={s.name} placeholder={s.name} className="hr-avatar-lg" />
          <h2>{s.name}</h2>
          <p>{s.short}</p>
          <span className="hr-chip">{s.chip}</span>
        </div>)}
      </div>
    </div>
  </header>;
}