import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";

const PRIORITIES = ["רגילה", "בינונית", "גבוהה", "קריטית"];
const PRIORITY_BUTTON_COLORS = {
  'קריטית': 'bg-red-500 text-white border-red-500',
  'גבוהה': 'bg-orange-500 text-white border-orange-500',
  'בינונית': 'bg-amber-500 text-white border-amber-500',
  'רגילה': 'bg-blue-500 text-white border-blue-500',
};

export default function ExtraDetails({ form, update, showCustomer, showPriority, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  if (!showCustomer && !showPriority) return null;
  return (
    <div className="rounded-xl border">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium">
        <span>פרטים נוספים <span className="text-xs text-muted-foreground font-normal">({form.customer_name || "Workies"} · {form.priority})</span></span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-3">
          {showCustomer && (
            <div className="grid grid-cols-2 gap-2">
              <Input value={form.customer_name} onChange={e => update("customer_name", e.target.value)} placeholder="שם הלקוח" />
              <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="טלפון" type="tel" dir="ltr" />
            </div>
          )}
          {showPriority && (
            <div className="flex gap-1.5">
              {PRIORITIES.map(p => (
                <button key={p} type="button" onClick={() => update("priority", p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.priority === p ? PRIORITY_BUTTON_COLORS[p] : 'bg-card border-border'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}