import { SCHEDULE } from "@/components/landing/hr/hrContent";

export default function HRSchedule() {
  return <section className="hr-schedule" aria-labelledby="hr-schedule-title">
    <div className="hr-wrap">
      <h2 id="hr-schedule-title" className="hr-eyebrow-dark">מה בתוכנית?</h2>
      <ol className="hr-list">
        {SCHEDULE.map(([time, title, text]) => <li key={time}>
          <span className="hr-time">{time}</span>
          <div><b>{title}</b><p>{text}</p></div>
        </li>)}
      </ol>
    </div>
  </section>;
}