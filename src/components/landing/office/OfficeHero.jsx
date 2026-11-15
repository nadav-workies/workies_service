import { Phone } from "lucide-react";
import CampaignValidityGate from "@/components/landing/CampaignValidityGate";
import TourLeadForm from "@/components/landing/office/TourLeadForm";
import { LOGO, PHONE_DISPLAY, PHONE_TEL, scrollToForm, trackClick } from "@/lib/officeContact";

const HERO = "https://media.base44.com/images/public/6a1d5a36316988d9f113f88e/ec89027b2_2.png";

export default function OfficeHero() {
  return <>
    <header className="ot-header">
      <div className="ot-wrap ot-header-row">
        <img src={LOGO} alt="Workies" className="ot-logo" width="96" height="40" />
        <a href={PHONE_TEL} className="ot-header-phone" onClick={() => trackClick("click_call", "header")}><Phone className="w-4 h-4" /><bdi dir="ltr">{PHONE_DISPLAY}</bdi></a>
      </div>
    </header>
    <section className="ot-hero">
      <img className="ot-hero-bg" src={HERO} alt="משרד פרטי במתחם Workies באר שבע" fetchPriority="high" />
      <div className="ot-hero-shade" aria-hidden="true" />
      <div className="ot-wrap ot-hero-grid">
        <div className="ot-hero-text">
          <img src={LOGO} alt="Workies" className="ot-logo ot-logo--hero" width="96" height="40" />
          <h1>משרד פרטי <span>בבאר שבע</span></h1>
          <p>משרד סגור ושקט במתחם משרדים שלנו בביג באר שבע. אצלנו משלמים חודש בחודשו, בלי חוזה ארוך ובלי התחייבות.</p>
          <button type="button" className="ot-btn ot-btn--full ot-mobile-only" onClick={scrollToForm}>לתיאום סיור במתחם</button>
        </div>
        <div className="ot-hero-card" id="tour-form">
          <CampaignValidityGate campaign="office"><TourLeadForm id="hero" title="השאירו פרטים ונתאם לכם סיור במתחם" /></CampaignValidityGate>
        </div>
      </div>
    </section>
  </>;
}