import { GALLERY } from "@/lib/eventorContent";

export default function EventorGallery() {
  return <section aria-label="גלריה" className="ev-gallery">
    <div className="ev-wrap ev-stack-sm">
      <h2 className="ev-h2">ככה זה נראה מבפנים</h2>
      <p className="ev-text">החלל מתחלק לאזורים, כך שאפשר להעביר הרצאה, לארח ארוחה ולהפסיק לנטוורקינג באותו מקום.</p>
    </div>
    <div className="ev-gallery-row">
      {GALLERY.map(g => <figure key={g.caption}>
        <img src={g.src} alt={g.alt} loading="lazy" />
        <figcaption>{g.caption}</figcaption>
      </figure>)}
    </div>
  </section>;
}