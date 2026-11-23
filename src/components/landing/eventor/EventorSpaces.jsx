import { EV_IMAGES, CLASS_AMENITIES, MEETING_AMENITIES } from "@/lib/eventorContent";
import AmenityChips from "@/components/landing/eventor/AmenityChips";

export default function EventorSpaces({ settings }) {
  return <section className="ev-spaces" aria-labelledby="ev-spaces-title">
    <div className="ev-wrap">
      <div className="ev-stack-sm">
        <h2 id="ev-spaces-title" className="ev-h2">עוד חללים, לכל מטרה</h2>
        <p className="ev-text">בכל אחד מהחללים יש מטבחון מאובזר ומפנק.</p>
      </div>
      <div className="ev-spaces-grid">
        <article className="ev-card">
          <img src={EV_IMAGES.classroom} alt="כיתת לימוד עם שולחנות עגולים, מקרן ומסך" loading="lazy" />
          <div className="ev-card-body">
            <strong>2 כיתות לימוד מאובזרות</strong>
            <p>לקורסים, להכשרות, להשתלמויות ולסדנאות. מוכנות לעבודה מהרגע שנכנסים.</p>
            <div className="ev-cells">
              <span className="ev-cell"><strong>כיתת לימוד</strong><span>עד {settings.capacity_classroom} משתתפים</span></span>
              <span className="ev-cell"><strong>כיתת ממ״ד</strong><span>עד {settings.capacity_mamad} משתתפים</span></span>
            </div>
            <AmenityChips items={CLASS_AMENITIES} dark />
          </div>
        </article>
        <article className="ev-card">
          <img src={EV_IMAGES.meeting} alt="חדר ישיבות עם שולחן ארוך ומסך גדול" loading="lazy" style={{ objectPosition: "center 60%" }} />
          <div className="ev-card-body">
            <strong>חדרי ישיבות בגדלים שונים</strong>
            <p>מפגישה אישית ועד ישיבת הנהלה מלאה. סביבה מקצועית שמשדרת רצינות.</p>
            <span className="ev-cap">עד {settings.capacity_meeting} משתתפים</span>
            <AmenityChips items={MEETING_AMENITIES} dark />
          </div>
        </article>
      </div>
    </div>
  </section>;
}