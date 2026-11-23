import { Video, Lightbulb, Volume2, Coffee } from "lucide-react";
import EventorSoftCta from "@/components/landing/eventor/EventorSoftCta";
import { EV_IMAGES, HALL_AMENITIES, SUITS } from "@/lib/eventorContent";
import AmenityChips from "@/components/landing/eventor/AmenityChips";
import Reveal from "@/components/landing/eventor/Reveal";

const BENEFITS = [
  [Video, "מולטימדיה והקלטת וידאו", "הקלטה מלאה מכמה זוויות. כל הרצאה הופכת לתוכן איכותי שאפשר להפיץ."],
  [Lightbulb, "שולחן אור דיגיטלי", "האווירה המדויקת לכל רגע: קבלת פנים, הרצאה או הרמת כוסית."],
  [Volume2, "מערכת סאונד משוכללת", "כל מילה נשמעת בבירור בכל פינה באולם."],
  [Coffee, "בר קפה ומטבחון", "מכונות אספרסו, מקרר ושולחן ארוך לכיבוד ולאירוח ברמה גבוהה."],
];

export default function EventorHall({ capacity }) {
  return <section className="ev-light ev-hall" aria-labelledby="ev-hall-title">
    <div className="ev-wrap ev-hall-grid">
      <Reveal className="ev-hall-intro ev-stack">
        <span className="ev-label">גולת הכותרת</span>
        <h2 id="ev-hall-title" className="ev-h2-lg">האיוונטור<span className="ev-p">.</span></h2>
        <p className="ev-hall-text">חלל אירוח עד {capacity} משתתפים, שתוכנן מהיסוד לאירועים עסקיים. אזור ישיבה פתוח, פינות לאונג', בר עם שולחן ארוך, חצר צמודה לקבלת פנים ומינגלינג, ושירותים בתוך המתחם.</p>
      </Reveal>
      <img className="ev-hall-img" src={EV_IMAGES.art} alt="האיוונטור: שולחנות עגולים, ספות ויצירת אמנות צהובה" loading="lazy" />
      <ul className="ev-benefits">
        {BENEFITS.map(([Icon, title, text], i) => <Reveal as="li" key={title} delay={i * 0.06} className="ev-benefit">
          <span className="ev-benefit-icon" aria-hidden="true"><Icon size={24} strokeWidth={2.2} /></span>
          <div className="ev-benefit-text"><strong>{title}</strong><span>{text}</span></div>
        </Reveal>)}
      </ul>
      <div className="ev-hall-more ev-stack">
        <div className="ev-stack-sm"><span className="ev-sub-title">באולם:</span><AmenityChips items={HALL_AMENITIES} /></div>
        <div className="ev-stack-sm"><span className="ev-sub-title">מתאים ל:</span>
          <div className="ev-suits">{SUITS.map(s => <span key={s} className="ev-suit">{s}</span>)}</div>
        </div>
        <EventorSoftCta light>לבדיקת תאריך פנוי באיוונטור</EventorSoftCta>
      </div>
    </div>
  </section>;
}