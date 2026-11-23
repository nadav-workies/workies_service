import { Coffee, Bean, Milk, Leaf, UtensilsCrossed } from "lucide-react";
import { COFFEE_BAR } from "@/lib/eventorContent";
import Reveal from "@/components/landing/eventor/Reveal";
import EventorSoftCta from "@/components/landing/eventor/EventorSoftCta";

const COFFEE_ICONS = [Coffee, Bean, Milk, Leaf];

// Coffee bar + kosher catering. No prices here on purpose: the goal is a quick enquiry.
export default function EventorHospitality() {
  return <section className="ev-catering" aria-labelledby="ev-catering-title">
    <div className="ev-wrap"><div className="ev-catering-inner ev-stack">
      <span className="ev-label-soft">אירוח והסעדה</span>
      <h2 id="ev-catering-title" className="ev-h2">קפה טוב, אוכל טוב, ואתם פנויים לאורחים.</h2>
      <p className="ev-text">בכל מתחם יש מטבחון לכיבוד, וכל החללים מתאימים לאירוח עם אוכל.</p>
      <Reveal className="ev-coffee">
        <strong className="ev-coffee-title">בר קפה בכל מתחם</strong>
        <ul className="ev-coffee-grid">
          {COFFEE_BAR.map((item, i) => { const Icon = COFFEE_ICONS[i]; return <li key={item}><Icon aria-hidden="true" strokeWidth={2} />{item}</li>; })}
        </ul>
      </Reveal>
      <Reveal className="ev-food" delay={0.08}>
        <span className="ev-food-head"><UtensilsCrossed aria-hidden="true" strokeWidth={2} /><strong>הסעדה כשרה ומותאמת לאירוע</strong></span>
        <p>ארוחות בוקר, צהריים וערב בכשרות מלאה, בכל אחד מהמתחמים.</p>
        <div className="ev-meals">
          {["בוקר", "צהריים", "ערב"].map(m => <div key={m} className="ev-meal"><span>ארוחת</span><strong>{m}</strong></div>)}
        </div>
        <small>בתיאום מראש ובתוספת תשלום</small>
      </Reveal>
      <EventorSoftCta>ספרו לנו על האירוע, ונבנה תפריט</EventorSoftCta>
    </div></div>
  </section>;
}