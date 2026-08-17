import { useState } from "react";
import ContentCard from "./ContentCard";
import { effectiveDate, toLocalDateStr, FULL_DAY_LABELS, FULL_DAY_ORDER, normalizeStatus, WORK_STATUS_DOT_COLORS } from "@/lib/contentBoardConfig";

export default function MonthCalendar({ monthStr, items, onOpen }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [y, m] = monthStr.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const today = toLocalDateStr(new Date());

  const cells = [
    ...Array(first.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const dateStr = `${monthStr}-${String(i + 1).padStart(2, "0")}`;
      return { dateStr, dayNum: i + 1, items: items.filter((it) => effectiveDate(it) === dateStr) };
    }),
  ];

  const selectedItems = selectedDay ? items.filter((it) => effectiveDate(it) === selectedDay) : [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {FULL_DAY_ORDER.map((d) => (
          <div key={d} className="text-center text-[9px] sm:text-xs font-bold text-muted-foreground py-1">
            {FULL_DAY_LABELS[d].slice(0, 3)}
          </div>
        ))}
        {cells.map((cell, i) =>
          cell === null ? (
            <div key={`e${i}`} />
          ) : (
            <button key={cell.dateStr}
              onClick={() => setSelectedDay(selectedDay === cell.dateStr ? null : cell.dateStr)}
              className={`min-h-14 sm:min-h-20 rounded border p-0.5 sm:p-1 text-right align-top overflow-hidden ${
                selectedDay === cell.dateStr ? "border-primary bg-primary/10"
                  : cell.dateStr === today ? "border-primary/50 bg-primary/5"
                  : "bg-card hover:bg-muted/40"
              }`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-xs font-semibold">{cell.dayNum}</span>
                {cell.items.length > 0 && (
                  <span className="text-[8px] sm:text-[10px] bg-primary text-primary-foreground rounded-full px-1">
                    {cell.items.length}
                  </span>
                )}
              </div>
              <div className="flex gap-0.5 mt-0.5 flex-wrap">
                {cell.items.slice(0, 5).map((it) => (
                  <span key={it.id} className={`w-1.5 h-1.5 rounded-full ${WORK_STATUS_DOT_COLORS[normalizeStatus(it.status)] || "bg-gray-400"}`} />
                ))}
              </div>
              <div className="hidden sm:block space-y-0.5 mt-0.5">
                {cell.items.slice(0, 2).map((it) => (
                  <p key={it.id} className="text-[9px] leading-tight truncate text-muted-foreground">
                    {it.title || it.topic}
                  </p>
                ))}
              </div>
            </button>
          )
        )}
      </div>

      {selectedDay && (
        <div className="space-y-1.5">
          <p className="text-sm font-bold">יחידות תוכן ל־{selectedDay.split("-").reverse().join(".")}</p>
          {selectedItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">אין יחידות תוכן ביום זה</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {selectedItems.map((it) => <ContentCard key={it.id} item={it} onClick={() => onOpen(it)} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}