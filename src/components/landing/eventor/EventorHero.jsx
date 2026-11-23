import { EV_IMAGES } from "@/lib/eventorContent";

export default function EventorHero({ settings }) {
  const stats = [
    [`עד ${settings.capacity_eventor}`, "משתתפים באיוונטור"],
    [`עד ${settings.capacity_classroom}`, "משתתפים בכיתת לימוד"],
    [`עד ${settings.capacity_meeting}`, "משתתפים בחדר ישיבות"],
    ["כשר", "הסעדה בכשרות מלאה"],
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
      </div>
    </header>
    <ul aria-label="המתחם במספרים" className="ev-wrap ev-stats">
      {stats.map(([n, label]) => <li key={label} className="ev-stat"><b>{n}</b><span>{label}</span></li>)}
    </ul>
  </>;
}