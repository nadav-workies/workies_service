import ContentCard from "./ContentCard";
import { addDays, effectiveDate, FULL_DAY_ORDER, FULL_DAY_LABELS, hebDate, toLocalDateStr } from "@/lib/contentBoardConfig";

export default function WeekBoard({ weekStart, items, onOpen }) {
  const today = toLocalDateStr(new Date());
  const days = FULL_DAY_ORDER.map((day, i) => {
    const dateStr = addDays(weekStart, i);
    return {
      day,
      dateStr,
      items: items.filter((it) => effectiveDate(it) === dateStr),
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {days.map(({ day, dateStr, items: dayItems }) => (
        <div key={day} className={`rounded-lg border p-2 space-y-1.5 ${dateStr === today ? "border-primary/50 bg-primary/5" : "bg-muted/20"}`}>
          <p className="text-xs font-bold flex items-center justify-between">
            <span>{FULL_DAY_LABELS[day]}</span>
            <span className="text-muted-foreground font-normal">{hebDate(dateStr)}</span>
          </p>
          {dayItems.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">—</p>
          ) : (
            dayItems.map((it) => <ContentCard key={it.id} item={it} onClick={() => onOpen(it)} />)
          )}
        </div>
      ))}
    </div>
  );
}