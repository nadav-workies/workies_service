import { MapPin } from "lucide-react";
import CampaignValidityGate from "@/components/landing/CampaignValidityGate";
import TourLeadForm from "@/components/landing/office/TourLeadForm";
import { ADDRESS, WAZE_URL, trackClick } from "@/lib/officeContact";

export default function OfficeTour() {
  return <section className="ot-tour">
    <div className="ot-wrap ot-tour-grid">
      <div className="ot-tour-text">
        <h2>בואו לראות את המשרד לפני שמחליטים</h2>
        <p>בסיור תראו את המשרדים הפנויים, את חדרי הישיבות ואת החניה. השאירו פרטים ונחזור אליכם לקבוע יום ושעה.</p>
        <address className="ot-address ot-desktop-only">{ADDRESS}</address>
        <a href={WAZE_URL} target="_blank" rel="noopener noreferrer" className="ot-btn-outline ot-desktop-only" onClick={() => trackClick("click_waze", "tour")}><MapPin className="w-4 h-4" />ניווט בווייז</a>
      </div>
      <div className="ot-tour-card">
        <CampaignValidityGate campaign="office"><TourLeadForm id="tour" /></CampaignValidityGate>
      </div>
      <div className="ot-mobile-only ot-tour-foot">
        <address className="ot-address">{ADDRESS}</address>
        <a href={WAZE_URL} target="_blank" rel="noopener noreferrer" className="ot-btn-outline" onClick={() => trackClick("click_waze", "tour")}><MapPin className="w-4 h-4" />ניווט בווייז</a>
      </div>
    </div>
  </section>;
}