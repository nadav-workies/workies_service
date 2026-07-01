import { useState, useRef, useEffect } from "react";
import { QUICK_TICKET_LIST, PRIORITY_COLORS_MAP, QUICK_TICKET_HELP } from "@/lib/quickTickets";
import { PRIORITY_COLORS } from "@/lib/slaUtils";
import { cn } from "@/lib/utils";
import { Zap, Printer } from "lucide-react";

function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
        className="w-[18px] h-[18px] rounded-full border border-slate-300 bg-slate-100 text-slate-500 text-[11px] font-bold inline-flex items-center justify-center hover:bg-slate-200 transition-colors flex-shrink-0"
        aria-label="מידע"
      >
        i
      </button>
      {open && (
        <span className="absolute top-full right-0 mt-1.5 z-50 w-60 bg-slate-800 text-white text-[12px] leading-relaxed rounded-lg px-3 py-2 shadow-lg">
          {text}
          <span className="absolute -top-1.5 right-2 w-3 h-3 bg-slate-800 rotate-45" />
        </span>
      )}
    </span>
  );
}

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

          if (qt.is_printing_package_request) {
            return (
              <button
                key={qt.id}
                type="button"
                onClick={() => onSelect(qt)}
                className={cn(
                  "text-right p-3 rounded-lg border-2 transition-all text-sm border-primary bg-primary/5 hover:bg-primary/10",
                  isSelected && "ring-2 ring-primary/20"
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <Printer className="w-4 h-4 text-primary flex-shrink-0" />
                  <p className="font-semibold leading-tight">{qt.ticket_type}</p>
                </div>
                <p className="text-[11px] mt-1 text-primary font-medium">{qt.sla_label}</p>
                <p className="text-[10px] mt-0.5 text-muted-foreground">טיפול שירות / גבייה</p>
              </button>
            );
          }

          const colorCls = PRIORITY_COLORS_MAP[qt.priority] || PRIORITY_COLORS_MAP['רגילה'];
          const helpText = QUICK_TICKET_HELP[qt.ticket_type];
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
              <div className="flex items-start justify-between gap-1">
                <p className="font-semibold leading-tight">{qt.ticket_type}</p>
                {helpText && <InfoTooltip text={helpText} />}
              </div>
              <p className="text-[11px] mt-1 text-muted-foreground">{qt.sla_label}</p>
              <p className={cn("text-[10px] mt-0.5 font-medium", PRIORITY_COLORS[qt.priority]?.replace('bg-', 'text-').split(' ')[1])}>
                {qt.priority}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}