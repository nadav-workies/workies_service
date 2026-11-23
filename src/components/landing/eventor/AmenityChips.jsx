import { Trees, Projector, Volume2, Video, Wifi, Snowflake, Presentation, FileText, Coffee, SquareParking, Accessibility, Monitor } from "lucide-react";

const ICONS = {
  "חצר לקבלת פנים": Trees, "מקרן": Projector, "מערכת שמע": Volume2, "שיחת וידאו": Video, "Wi‑Fi": Wifi, "מיזוג": Snowflake,
  "לוח מחיק": Presentation, "לוח נייר": FileText, "קפה, תה ומים": Coffee, "שתייה חמה": Coffee, "חניה": SquareParking,
  "נגישות": Accessibility, "מסך גדול": Monitor,
};

export default function AmenityChips({ items, dark = false }) {
  return <ul aria-label="אבזור" className={dark ? "ev-chips ev-chips-dark" : "ev-chips"}>
    {items.map(item => {
      const Icon = ICONS[item];
      return <li key={item} className="ev-chip">{Icon && <Icon aria-hidden="true" strokeWidth={2} />}{item}</li>;
    })}
  </ul>;
}