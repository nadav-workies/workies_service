import { EV_IMAGES, CLASS_AMENITIES, MEETING_AMENITIES, SHARED_AMENITIES } from "@/lib/eventorContent";
import AmenityChips from "@/components/landing/eventor/AmenityChips";
import Reveal from "@/components/landing/eventor/Reveal";
import MeetingGallery from "@/components/landing/eventor/MeetingGallery";
import { CalendarCheck } from "lucide-react";
import { scrollToLeadForm } from "@/lib/eventorLeadScroll";
import EventorSoftCta from "@/components/landing/eventor/EventorSoftCta";

export default function EventorSpaces({ settings }) {
  return <section className="ev-spaces" aria-labelledby="ev-spaces-title">
    <div className="ev-wrap">
      <div className="ev-stack-sm">
        <h2 id="ev-spaces-title" className="ev-h2">עוד חללים, לכל מטרה</h2>
        <p className="ev-text">בכל אחד מהחללים יש מטבחון מאובזר ומפנק.</p>
      </div>
      <div className="ev-spaces-grid">
        <Reveal as="article" className="ev-card">
          <img className="ev-img-class" src={EV_IMAGES.classroom} alt="כיתת לימוד עם שולחנות עגולים, מקרן ומסך" loading="lazy" />
          <div className="ev-card-body">
            <strong>2 כיתות לימוד מאובזרות</strong>
            <p>לקורסים, להכשרות, להשתלמויות ולסדנאות. מוכנות לעבודה מהרגע שנכנסים.</p>
            <div className="ev-cells">
              <span className="ev-cell"><strong>כיתת לימוד</strong><span>עד {settings.capacity_classroom} משתתפים</span></span>
              <span className="ev-cell"><strong>כיתת ממ״ד</strong><span>עד {settings.capacity_mamad} משתתפים</span></span>
            </div>
            <AmenityChips items={CLASS_AMENITIES} dark />
          </div>
        </Reveal>
        <Reveal as="article" className="ev-card">
          <MeetingGallery />
          <div className="ev-card-body">
            <strong>חדרי ישיבות בגדלים שונים</strong>
            <p>מפגישה אישית ועד ישיבת הנהלה מלאה. בצמוד לחדרים יש טרקלין עם פינות ישיבה, מכונות אספרסו ומקררים.</p>
            <span className="ev-cap">עד {settings.capacity_meeting} משתתפים</span>
            <AmenityChips items={MEETING_AMENITIES} dark />
            <div className="ev-card-ctas">
              <a href="#lead-form" onClick={scrollToLeadForm} className="ev-btn ev-btn-primary">לבדיקת זמינות והצעת מחיר</a>
              {settings.booking_url && <a href={settings.booking_url} target="_blank" rel="noopener" className="ev-btn ev-btn-secondary"><CalendarCheck className="w-5 h-5" aria-hidden="true" />שריינו חדר ביומן</a>}
            </div>
          </div>
        </Reveal>
      </div>
      <Reveal className="ev-shared">
        <span className="ev-sub-title">בכל המתחמים:</span>
        <AmenityChips items={SHARED_AMENITIES} dark label="בכל המתחמים" />
      </Reveal>
      <EventorSoftCta>קבלו הצעת מחיר לכיתה או לחדר ישיבות</EventorSoftCta>
    </div>
  </section>;
}