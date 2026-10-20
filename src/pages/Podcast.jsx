import DailyOfficeLeadForm from "@/components/landing/DailyOfficeLeadForm";
import "@/components/landing/Podcast.css";

export default function Podcast() {
  return <main dir="rtl" className="podcast-theme bg-background text-foreground font-body">
    <div className="podcast-content">
      <header className="podcast-hero">
        <img src="https://media.base44.com/images/public/6a1d5a36316988d9f113f88e/aed3050d1_IMG-20261016-WA00121.jpg" alt="אולפן הפודקאסט של וורקיז, כורסאות טורקיז ומיקרופונים מול קיר עץ" fetchPriority="high" />
        <div className="podcast-scrim" />
        <div className="podcast-top">
          <div className="podcast-brand" dir="ltr" aria-label="Workies">Work<span>i</span>es</div>
          <p className="podcast-tag">WORK · MEET · GROW</p>
        </div>
        <div className="podcast-bottom">
          <h1>אולפן הפודקאסט<span>להתנסות</span></h1>
          <div className="podcast-rule" />
          <p className="podcast-sub">מקום לקול ולסיפור שלכם. וורקיז באר שבע.</p>
        </div>
      </header>
      <section aria-label="הרשמה להתנסות בפודקאסט" className="podcast-form-section">
        <DailyOfficeLeadForm campaign="podcast" />
        <p className="podcast-more">MORE THAN AN OFFICE</p>
      </section>
    </div>
  </main>;
}