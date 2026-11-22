import { Minus, Plus } from "lucide-react";

// Compact quantity control. 0 shows an "add" button.
export default function QtyStepper({ value = 0, onChange, step = 1, min = 0, max, addLabel = "הוספה", label }) {
  const set = (v) => {
    let n = Math.max(0, Math.floor(Number(v) || 0));
    if (max && n > max) n = max;
    onChange(n > 0 && min && n < min ? min : n);
  };
  if (!value) {
    return (
      <button type="button" onClick={() => set(min || step)}
        className="h-9 px-4 rounded-full border-2 border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors">
        {addLabel}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1 rounded-full bg-primary/10 p-1" role="group" aria-label={label}>
      <button type="button" aria-label="הפחתה" onClick={() => set(value - step < (min || 1) ? 0 : value - step)}
        className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-primary shadow-sm"><Minus className="w-3.5 h-3.5" /></button>
      <input type="number" inputMode="numeric" value={value} onChange={(e) => set(e.target.value)} aria-label={label || "כמות"}
        className="w-12 bg-transparent text-center text-sm font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
      <button type="button" aria-label="הוספה" onClick={() => set(value + step)}
        className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm"><Plus className="w-3.5 h-3.5" /></button>
    </div>
  );
}
