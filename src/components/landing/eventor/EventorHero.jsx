import { EV_IMAGES } from "@/lib/eventorContent";
import { scrollToLeadForm } from "@/lib/eventorLeadScroll";
import CountUp from "@/components/landing/eventor/CountUp";
import Reveal from "@/components/landing/eventor/Reveal";

export default function EventorHero({ settings }) {
  const stats = [
    [settings.capacity_eventor, "משתתפים באיוונטור"],
    [settings.capacity_classroom, "משתתפים בכיתת לימוד"],
    [settings.capacity_meeting, "משתתפים בחדר ישיבות"],
    [null, "הסעדה בכשרות מלאה"],
  ];
  return <>
    <header className="ev-hero">
      <img className="ev-hero-img" src={EV_IMAGES.hall} alt="אולם האיוונטור עם שולחנות עגולים, ספות ויצירת אמנות צהובה" fetchpriority="high" />
      <div className="ev-hero-shade" aria-hidden="true" />
      <div className="ev-wrap ev-hero-top">
        <img className="ev-logo" src={EV_IMAGES.logo} alt="Workies" />
        <span className="ev-brand" dir="ltr">EVENTOR BY WORKIES</span>
      </div>
      <div className="ev-wrap ev-hero-body">
        <span className="ev-tag">מתחם האירועים · באר שבע</span>
        <h1 className="ev-h1">יש לכם רעיון.<br />לנו יש את המקום<br />שבו הוא <span className="ev-y">קורה.</span></h1>
        <p className="ev-lead">אולם אירועים, כיתות לימוד וחדרי ישיבות. טכנולוגיה שעובדת בלי תקלות, אוכל טוב וצוות שדואג לכל פרט.</p>
        <a href="#lead-form" onClick={scrollToLeadForm} className="ev-btn ev-btn-primary ev-btn-hero">לבדיקת תאריך פנוי</a>
      </div>
    </header>
    <ul aria-label="המתחם במספרים" className="ev-wrap ev-stats">
      {stats.map(([n, label], i) => <Reveal as="li" key={label} delay={i * 0.08} className="ev-stat">
        <b>{n == null ? "כשר" : <><small>עד</small><CountUp value={n} /></>}</b>
        <span>{label}</span>
      </Reveal>)}
    </ul>
  </>;
}