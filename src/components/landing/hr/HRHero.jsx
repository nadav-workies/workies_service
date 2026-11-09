import EditableImage from "@/components/landing/EditableImage";
import { LECTURES } from "@/components/landing/hr/hrContent";

const HERO_BG = "https://base44.app/api/apps/6a1d5a36316988d9f113f88e/files/mp/public/6a1d5a36316988d9f113f88e/58ceb9525_hr-hero-lounge.jpg";
const FACTS = [["מתי", "שלישי 24.11.2026"], ["שעה", "09:00–12:00"], ["איפה", "WORKIES, באר שבע"], ["השתתפות", "ללא עלות", true]];

export default function HRHero({ editor }) {
  const bgEditor = { ...editor, images: { hero_bg: HERO_BG, ...editor.images } };
  return <header className="hr-hero2">
    <div className="hr-hero-photo">
      <EditableImage editor={bgEditor} slot="hero_bg" alt="לאונג' WORKIES באר שבע" placeholder="" className="hr-hero-bg" />
      <div className="hr-hero-shade" aria-hidden="true" />
      <div className="hr-hero-content">
        <nav className="hr-nav2">
          <span className="hr-logo">Workies <small>באר שבע</small></span>
          <a href="#register" className="hr-pill">להרשמה</a>
        </nav>
        <p className="hr-eyebrow">מיטאפ למנהלות משאבי אנוש · בשיתוף PARGODA</p>
        <h1 className="hr-title">HR מחוץ לשגרה<span className="hr-dot">.</span></h1>
        <p className="hr-sub">בוקר של קפה, קולגות ורעיונות חדשים</p>
        <p className="hr-lead">ארוחת בוקר עשירה, קולגות מהתחום והרצאות על האתגרים וההזדמנויות שמביאה הבינה המלאכותית לעולם העבודה והניהול.</p>
        <dl className="hr-facts">
          {FACTS.map(([k, v, hi]) => <div key={k} className={hi ? "hr-fact hr-fact-hi" : "hr-fact"}><dt>{k}</dt><dd>{/^\d/.test(v) ? <bdi dir="ltr">{v}</bdi> : v}</dd></div>)}
        </dl>
        <div className="hr-cta-row">
          <a href="#register" className="hr-btn">שריון מקום ←</a>
          <span><b>ההרשמה עד 23.11.2026</b> · מספר המקומות מוגבל</span>
        </div>
      </div>
    </div>
    <aside className="hr-hero-panel" aria-label="ההרצאות">
      <h2 className="hr-panel-title">ההרצאות:</h2>
      {LECTURES.map(l => <div key={l.title} className="hr-panel-talk">
        <EditableImage editor={editor} slot={l.speaker.slot} alt={l.speaker.name} placeholder={l.speaker.name} className="hr-panel-avatar" />
        <div>
          <span className="hr-chip">{l.speaker.chip}</span>
          <h3>{l.title}</h3>
          <b>{l.speaker.name}</b>
          <p>{l.speaker.short}</p>
        </div>
      </div>)}
    </aside>
  </header>;
}