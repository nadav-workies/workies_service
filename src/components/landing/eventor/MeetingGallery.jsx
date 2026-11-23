import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MEETING_GALLERY } from "@/lib/eventorContent";

// Swipeable photo gallery of the meeting rooms (scroll-snap, RTL: next slide is to the left).
export default function MeetingGallery() {
  const track = useRef(null);
  const [index, setIndex] = useState(0);
  const total = MEETING_GALLERY.length;
  const onScroll = () => {
    const el = track.current;
    setIndex(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
  };
  const go = n => {
    const el = track.current;
    el.scrollTo({ left: -n * el.clientWidth, behavior: "smooth" });
  };
  return <div className="ev-mg" role="region" aria-roledescription="קרוסלה" aria-label="גלריית חדרי הישיבות">
    <ul ref={track} className="ev-mg-track" onScroll={onScroll}>
      {MEETING_GALLERY.map((g, n) => <li key={g.src} className="ev-mg-slide" aria-label={`${n + 1} מתוך ${total}`}>
        <img src={g.src} alt={g.alt} loading={n ? "lazy" : undefined} />
        <span className="ev-mg-cap">{g.room}</span>
      </li>)}
    </ul>
    <span className="ev-mg-count" aria-hidden="true">{index + 1}/{total}</span>
    <button type="button" className="ev-mg-nav ev-mg-prev" onClick={() => go(index - 1)} disabled={index === 0} aria-label="התמונה הקודמת"><ChevronRight size={22} aria-hidden="true" /></button>
    <button type="button" className="ev-mg-nav ev-mg-next" onClick={() => go(index + 1)} disabled={index === total - 1} aria-label="התמונה הבאה"><ChevronLeft size={22} aria-hidden="true" /></button>
    <div className="ev-mg-dots">
      {MEETING_GALLERY.map((g, n) => <button key={g.src} type="button" onClick={() => go(n)} aria-label={`תמונה ${n + 1}`} aria-current={n === index} />)}
    </div>
  </div>;
}