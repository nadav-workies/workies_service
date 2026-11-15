import { Check, MessageCircle } from "lucide-react";
import { ADDRESS, LOGO, WHATSAPP_URL, trackClick } from "@/lib/officeContact";
import "@/components/landing/office/OfficeTour.css";

export default function OfficeThankYou() {
  return <main dir="rtl" lang="he" className="ot-page ot-thanks">
    <header className="ot-wrap ot-thanks-head"><img src={LOGO} alt="Workies" className="ot-logo" width="96" height="40" /></header>
    <section className="ot-wrap ot-thanks-body">
      <span className="ot-thanks-check" aria-hidden="true"><Check className="w-8 h-8" /></span>
      <h1>תודה, קיבלנו.</h1>
      <p>נתקשר אליכם כדי לקבוע סיור.<br />רוצים לדבר כבר עכשיו? כתבו לנו בוואטסאפ.</p>
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="ot-btn ot-btn--full" onClick={() => trackClick("click_whatsapp", "thank_you")}><MessageCircle className="w-5 h-5" />לשיחה בוואטסאפ</a>
    </section>
    <footer className="ot-wrap ot-thanks-foot"><address className="ot-address">{ADDRESS}</address></footer>
  </main>;
}