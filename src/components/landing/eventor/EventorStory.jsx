import { ChevronDown } from "lucide-react";
import { EV_IMAGES, FAQ } from "@/lib/eventorContent";
import Reveal from "@/components/landing/eventor/Reveal";
import { trackEventor } from "@/lib/eventorTracking";
import EventorSoftCta from "@/components/landing/eventor/EventorSoftCta";

// Sign banner, team and FAQ sections.
export default function EventorStory({ whatsappUrl }) {
  return <>
    <section className="ev-sign" aria-label="השלט של Eventor">
      <img src={EV_IMAGES.sign} alt="השלט EVENTOR BY WORKIES על זכוכית הכניסה" loading="lazy" />
      <div className="ev-sign-fade" aria-hidden="true" />
    </section>
    <section className="ev-team" aria-labelledby="ev-team-title">
      <div className="ev-wrap"><Reveal className="ev-team-inner ev-stack">
        <span className="ev-label-soft">הסוד של Workies</span>
        <h2 id="ev-team-title" className="ev-h2">אתם מביאים את הרעיון<span className="ev-y">.</span><br />אנחנו דואגים לכל השאר<span className="ev-y">.</span></h2>
        <p className="ev-text">צוות Workies עומד לרשותכם בכל שלב, לכל רעיון, בקשה ואפילו גחמה. מהתכנון ועד שהאורח האחרון יוצא, אתם לא לבד.</p>
        <EventorSoftCta href={whatsappUrl} onClick={() => trackEventor("whatsapp_click", "team_cta")}>דברו עם מנהל תיק האירועים</EventorSoftCta>
      </Reveal></div>
    </section>
    <section aria-labelledby="ev-faq-title" className="ev-light ev-faq">
      <div className="ev-wrap">
        <h2 id="ev-faq-title" className="ev-h2">שאלות שחוזרות אלינו</h2>
        <div className="ev-faq-list">
          {FAQ.map(([q, a], i) => <details key={q} className="ev-faq-item" open={i === 0}>
            <summary>{q}<ChevronDown size={20} aria-hidden="true" /></summary>
            <p>{a}</p>
          </details>)}
        </div>
      </div>
    </section>
  </>;
}