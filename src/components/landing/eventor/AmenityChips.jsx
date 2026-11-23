import { Trees, Projector, Volume2, Video, Wifi, Snowflake, Presentation, Coffee, SquareParking, Accessibility, Monitor, Sofa, Bath, Armchair, CookingPot } from "lucide-react";

const ICONS = {
  "לאונג' ופינות ישיבה": Sofa, "שירותים בתוך המתחם": Bath, "חצר לקבלת פנים": Trees, "מקרן ושיחות וידאו": Projector,
  "מקרן ומסך": Projector, "לוח מחיק ולוח נייר": Presentation, "טרקלין צמוד": Armchair, "מסך גדול": Monitor,
  "שיחות וידאו": Video, "מערכת שמע": Volume2, "נגישות מלאה": Accessibility, "בר קפה": Coffee,
  "מטבחון לכיבוד": CookingPot, "חניה חינם": SquareParking, "Wi‑Fi": Wifi, "מיזוג": Snowflake,
};

// Even 2-column grid (3 on wide screens for the shared list) so the list reads as a tidy set, not a pile of pills.
export default function AmenityChips({ items, dark = false, label = "אבזור" }) {
  return <ul aria-label={label} className={dark ? "ev-chips ev-chips-dark" : "ev-chips"}>
    {items.map(item => {
      const Icon = ICONS[item];
      return <li key={item} className="ev-chip">{Icon && <span className="ev-chip-icon" aria-hidden="true"><Icon strokeWidth={2} /></span>}<span>{item}</span></li>;
    })}
  </ul>;
}