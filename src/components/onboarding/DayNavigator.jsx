import { Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function DayNavigator({ dayGroups, activeDay, onSelectDay }) {
  return (
    <div className="overflow-x-auto pb-1 -mx-1 px-1">
      <div className="flex gap-2 min-w-min">
        {dayGroups.map((g) => {
          const isActive = g.day === activeDay;
          const isComplete = g.completed === g.total && g.total > 0;
          const hasOverdue = g.overdueTasks > 0;
          return (
            <button
              key={g.day}
              onClick={() => onSelectDay(g.day)}
              className={`shrink-0 w-24 rounded-xl p-2.5 text-center transition-all border-2 ${
                isActive ? "border-primary bg-primary/5" : "border-transparent bg-card hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-medium">יום {g.day}</span>
              </div>
              {g.date && (
                <p className="text-[10px] text-muted-foreground mb-1">
                  {new Date(g.date).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}
                </p>
              )}
              <p className={`text-xs font-bold ${isComplete ? "text-green-600" : "text-foreground"}`}>
                {g.completed}/{g.total}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {isComplete ? (
                  <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                    <CheckCircle className="w-2.5 h-2.5" /> הושלם
                  </span>
                ) : g.completed > 0 ? (
                  <span className="text-[10px] text-orange-600 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" /> בתהליך
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">טרם התחיל</span>
                )}
                {hasOverdue && (
                  <AlertCircle className="w-3 h-3 text-red-500" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}