import { QUICK_TICKET_LIST, PRIORITY_COLORS_MAP } from "@/lib/quickTickets";
import { PRIORITY_COLORS } from "@/lib/slaUtils";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

export default function QuickTicketSelector({ onSelect, selectedId }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">פתיחה מהירה</h3>
        <span className="text-xs text-muted-foreground">בחר סוג קריאה נפוץ</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {QUICK_TICKET_LIST.map((qt) => {
          const isSelected = selectedId === qt.id;
          const colorCls = PRIORITY_COLORS_MAP[qt.priority] || PRIORITY_COLORS_MAP['רגילה'];
          return (
            <button
              key={qt.id}
              type="button"
              onClick={() => onSelect(qt)}
              className={cn(
                "text-right p-3 rounded-lg border-2 transition-all text-sm",
                isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : colorCls
              )}
            >
              <p className="font-semibold leading-tight">{qt.ticket_type}</p>
              <p className="text-[11px] mt-1 text-muted-foreground">{qt.sla_label}</p>
              <p className={cn("text-[10px] mt-0.5 font-medium", PRIORITY_COLORS[qt.priority]?.replace('bg-', 'text-').replace('text-', 'text-').split(' ')[1])}>
                {qt.priority}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}