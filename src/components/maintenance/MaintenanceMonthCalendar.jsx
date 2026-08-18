import { getCategory, getStatus, WEEKDAYS } from "@/lib/maintenanceConfig";

export default function MaintenanceMonthCalendar({ monthStr, tasks, onSelectDay, selectedDate }) {
  // monthStr: "YYYY-MM"
  const [year, month] = monthStr.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(year, month, 0).getDate();

  const byDate = (d) => tasks.filter(t => t.planned_date === d);

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthStr}-${String(d).padStart(2, "0")}`;
    cells.push({ dateStr, day: d, dayTasks: byDate(dateStr) });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="border rounded-lg bg-card overflow-hidden" dir="rtl">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAYS.map(w => (
          <div key={w.key} className="py-1.5 text-center text-[11px] sm:text-xs font-semibold text-muted-foreground">{w.label}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} className="min-h-[44px] sm:min-h-[64px] border-b border-l/rtl:border-r bg-muted/20" />;
          const isSelected = cell.dateStr === selectedDate;
          const hasTasks = cell.dayTasks.length > 0;
          const doneCount = cell.dayTasks.filter(t => t.status === "done" || t.status === "checked").length;
          return (
            <button
              key={i}
              onClick={() => onSelectDay(cell.dateStr)}
              className={`min-h-[44px] sm:min-h-[64px] border-b border-l/rtl:border-r p-1 text-right flex flex-col gap-0.5 transition-colors ${
                isSelected ? "bg-primary/15 ring-1 ring-primary" : hasTasks ? "bg-card hover:bg-muted/40" : "bg-card hover:bg-muted/20"
              }`}
            >
              <span className={`text-[11px] sm:text-xs font-medium ${hasTasks ? "text-foreground" : "text-muted-foreground"}`}>{cell.day}</span>
              {hasTasks && (
                <div className="flex flex-wrap gap-0.5 mt-auto">
                  {cell.dayTasks.slice(0, 4).map((t, idx) => {
                    const st = getStatus(t.status);
                    return <span key={idx} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${st.dot}`} />;
                  })}
                  {cell.dayTasks.length > 4 && <span className="text-[9px] text-muted-foreground">+{cell.dayTasks.length - 4}</span>}
                </div>
              )}
              {doneCount > 0 && (
                <span className="text-[9px] sm:text-[10px] text-green-600 font-medium">✓ {doneCount}/{cell.dayTasks.length}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}