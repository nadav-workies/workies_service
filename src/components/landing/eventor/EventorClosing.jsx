import { MessageCircle, Phone, MapPin } from "lucide-react";
import { WAZE_URL, telHref } from "@/lib/eventorContent";
import { trackEventor } from "@/lib/eventorTracking";
import EventorStickyBar from "@/components/landing/eventor/EventorStickyBar";
import EventorLeadForm from "@/components/landing/eventor/EventorLeadForm";

export default function EventorClosing({ settings }) {
  const tel = telHref(settings.phone);
  const wa = settings.whatsapp_url;
  return <>
    <section id="lead-form" className="ev-closing" aria-labelledby="ev-closing-title">
      <div className="ev-wrap"><div className="ev-closing-inner">
        <h2 id="ev-closing-title" className="ev-h2-lg">האירוע הבא שלכם<br />מתחיל <span className="ev-y">כאן.</span></h2>
        <p className="ev-text">תאמו סיור בחללים או שריינו תאריך עוד היום.</p>
        <EventorLeadForm whatsappUrl={wa} />
        <a href={wa} target="_blank" rel="noopener" onClick={() => trackEventor("whatsapp_click", "footer_cta")} className="ev-btn ev-btn-secondary"><MessageCircle className="w-5 h-5" aria-hidden="true" />לתיאום סיור בוואטסאפ</a>
        <a href={tel} onClick={() => trackEventor("phone_click", "footer_cta")} className="ev-btn ev-btn-outline"><Phone className="w-5 h-5" aria-hidden="true" />פרטים והזמנות: <span dir="ltr">{settings.phone}</span></a>
        <div className="ev-address">
          <span>דרך אליהו נאוי 24, באר שבע<small>מרכז B7, מול BIG · חניה חינם</small></span>
          <a href={WAZE_URL} target="_blank" rel="noopener" onClick={() => trackEventor("waze_click", "footer_cta")} className="ev-waze"><MapPin className="w-[18px] h-[18px]" aria-hidden="true" />ניווט בווייז</a>
        </div>
      </div></div>
    </section>
    <EventorStickyBar tel={tel} wa={wa} />
    <a href={wa} target="_blank" rel="noopener" onClick={() => trackEventor("whatsapp_click", "sticky_bar")} className="ev-float" aria-label="וואטסאפ לתיאום סיור"><MessageCircle className="w-5 h-5" aria-hidden="true" />וואטסאפ</a>
  </>;
}