import DailyOfficeLeadForm from "@/components/landing/DailyOfficeLeadForm";
import "@/components/landing/DailyOffice.css";

export default function DailyOffice() {
  return (
    <main dir="rtl" className="daily-office-immersive">
      <img className="office-bg" src="https://media.base44.com/images/public/6a1d5a36316988d9f113f88e/5a65bd060_generated_1d0fe6fc.jpg" alt="משרד במתחם וורקיז" fetchPriority="high" />
      <div className="office-shade" aria-hidden="true" />
      <div className="office-glow" aria-hidden="true" />
      <div className="office-content">
        <div className="office-logo office-fade office-delay-1">
          <img src="https://media.base44.com/images/public/6a1d5a36316988d9f113f88e/1c0d76342_1.png" alt="Workies" width="96" height="66" />
          <p className="office-location">וורקיז באר שבע</p>
        </div>
        <div className="office-hero office-fade office-delay-2">
          <div className="office-line" aria-hidden="true" />
          <div className="office-heading"><h1>משרד יומי<span>להתנסות</span></h1><p className="office-sub">ללא עלות וללא התחייבות</p></div>
        </div>
        <DailyOfficeLeadForm />
      </div>
    </main>
  );
}