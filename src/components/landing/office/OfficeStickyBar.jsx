import { MessageCircle, Phone } from "lucide-react";
import { PHONE_TEL, WHATSAPP_URL, scrollToForm, trackClick } from "@/lib/officeContact";

// Mobile-only bottom bar: call, WhatsApp, jump to the form.
export default function OfficeStickyBar() {
  return <nav className="ot-sticky" aria-label="יצירת קשר">
    <a href={PHONE_TEL} className="ot-sticky-btn" onClick={() => trackClick("click_call", "sticky_bar")}><Phone className="w-4 h-4" />התקשרו</a>
    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="ot-sticky-btn" onClick={() => trackClick("click_whatsapp", "sticky_bar")}><MessageCircle className="w-4 h-4" />וואטסאפ</a>
    <button type="button" className="ot-sticky-btn ot-sticky-btn--primary" onClick={scrollToForm}>השאירו פרטים</button>
  </nav>;
}