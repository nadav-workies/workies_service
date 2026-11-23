import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import useShowcaseStats from "@/components/landing/eventor/useShowcaseStats";

const LOCATIONS = { footer_cta: "כפתורי סוף העמוד", sticky_bar: "פס צף / כפתור קבוע", hero: "פתיח" };
const TYPES = { whatsapp_click: "וואטסאפ", phone_click: "טלפון", waze_click: "ווייז" };

export default function ShowcaseStatsPanel({ campaign }) {
  const { data, isPending } = useShowcaseStats(campaign);
  const { data: byLocation } = useQuery({
    queryKey: ["showcase-locations", campaign],
    queryFn: async () => (await base44.entities.LandingPageEvent.aggregate({ query: { landing_page_id: campaign, event_type: { $ne: "view" } }, groupBy: ["button_location", "event_type"] })).rows,
  });
  if (isPending) return <p role="status" className="py-6 text-center">טוענים נתונים…</p>;
  const tiles = [["פניות (וואטסאפ + טלפון)", data.total, true], ["צפיות", data.view], ["קליקים לוואטסאפ", data.whatsapp], ["קליקים לטלפון", data.phone], ["ניווט בווייז", data.waze]];
  return <div className="space-y-4">
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {tiles.map(([label, value, main]) => <div key={label} className={`rounded-xl border p-3 ${main ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}>
        <p className="text-2xl font-bold tabular-nums">{value}</p><p className={`text-xs mt-0.5 ${main ? "" : "text-muted-foreground"}`}>{label}</p>
      </div>)}
    </div>
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <h2 className="font-bold text-sm">קליקים לפי מיקום הכפתור</h2>
      {byLocation?.length ? <ul className="divide-y text-sm">
        {byLocation.map(r => <li key={`${r.button_location}-${r.event_type}`} className="flex justify-between py-2"><span>{LOCATIONS[r.button_location] || r.button_location || "לא ידוע"} · {TYPES[r.event_type] || r.event_type}</span><b className="tabular-nums">{r.count}</b></li>)}
      </ul> : <p className="text-sm text-muted-foreground">עדיין אין קליקים.</p>}
      <p className="text-xs text-muted-foreground">קליק על וואטסאפ או טלפון אינו ליד מאומת, ולכן העמוד לא נספר בסה״כ הלידים.</p>
    </div>
  </div>;
}