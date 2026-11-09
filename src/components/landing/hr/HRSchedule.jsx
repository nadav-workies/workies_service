import { SCHEDULE } from "@/components/landing/hr/hrContent";
import EditableImage from "@/components/landing/EditableImage";

export default function HRSchedule({ editor }) {
  const showGallery = editor.canEdit || editor.images.venue_1 || editor.images.venue_2;
  return <section className="hr-schedule" aria-labelledby="hr-schedule-title">
    <div className="hr-wrap">
      <h2 id="hr-schedule-title" className="hr-eyebrow-dark">מה בתוכנית?</h2>
      <ol className="hr-list">
        {SCHEDULE.map(([time, title, text]) => <li key={time}>
          <span className="hr-time">{time}</span>
          <div><b>{title}</b><p>{text}</p></div>
        </li>)}
      </ol>
      {showGallery && <div className="hr-gallery">
        <EditableImage editor={editor} slot="venue_1" alt="מתחם WORKIES באר שבע" placeholder="[תמונת אולם 1]" className="hr-gallery-main" />
        <EditableImage editor={editor} slot="venue_2" alt="מתחם WORKIES באר שבע" placeholder="[תמונת אולם 2]" />
      </div>}
    </div>
  </section>;
}