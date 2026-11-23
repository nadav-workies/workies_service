import { Video, SlidersHorizontal, Volume2, UtensilsCrossed } from "lucide-react";
import { EV_IMAGES, HALL_AMENITIES, SUITS } from "@/lib/eventorContent";
import AmenityChips from "@/components/landing/eventor/AmenityChips";

const BENEFITS = [
  [Video, "מולטימדיה והקלטת וידאו", "הקלטה מלאה מכמה זוויות. כל הרצאה הופכת לתוכן איכותי שאפשר להפיץ."],
  [SlidersHorizontal, "שולחן אור דיגיטלי", "האווירה המדויקת לכל רגע: קבלת פנים, הרצאה או הרמת כוסית."],
  [Volume2, "מערכת סאונד משוכללת", "כל מילה נשמעת בבירור בכל פינה באולם."],
  [UtensilsCrossed, "מטבחון מאובזר ומפנק", "מכונת קפה, מקרר, בר מים ושולחן ארוך לאירוח ברמה גבוהה."],
];

export default function EventorHall({ capacity }) {
  return <section className="ev-light ev-hall" aria-labelledby="ev-hall-title">
    <div className="ev-wrap ev-hall-grid">
      <div className="ev-hall-intro ev-stack">
        <span className="ev-label">גולת הכותרת</span>
        <h2 id="ev-hall-title" className="ev-h2-lg">האיוונטור<span className="ev-p">.</span></h2>
        <p className="ev-hall-text">חלל אירוח עד {capacity} משתתפים, שתוכנן מהיסוד לאירועים עסקיים. אזור ישיבה פתוח, פינות לאונג', בר עם שולחן ארוך, וחצר צמודה לקבלת פנים ומינגלינג.</p>
      </div>
      <img className="ev-hall-img" src={EV_IMAGES.art} alt="האיוונטור: שולחנות עגולים, ספות ויצירת אמנות צהובה" loading="lazy" />
      <ul className="ev-benefits">
        {BENEFITS.map(([Icon, title, text]) => <li key={title} className="ev-benefit">
          <span className="ev-benefit-icon" aria-hidden="true"><Icon className="w-5 h-5" strokeWidth={2} /></span>
          <span><strong>{title}</strong><span>{text}</span></span>
        </li>)}
      </ul>
      <div className="ev-hall-more ev-stack">
        <div className="ev-stack-sm"><span className="ev-sub-title">באולם:</span><AmenityChips items={HALL_AMENITIES} /></div>
        <div className="ev-stack-sm"><span className="ev-sub-title">מתאים ל:</span>
          <div className="ev-suits">{SUITS.map(s => <span key={s} className="ev-suit">{s}</span>)}</div>
        </div>
      </div>
    </div>
  </section>;
}