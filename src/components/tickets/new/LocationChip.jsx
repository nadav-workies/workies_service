import { useState } from "react";
import { MapPin, Pencil, Check } from "lucide-react";
import RoomSelector from "@/components/tickets/new/RoomSelector";

export default function LocationChip({ form, onChange, forcePublicMode, autoLabel }) {
  const hasLocation = !!(form.room_number || form.public_area_key);
  const [open, setOpen] = useState(!hasLocation || forcePublicMode);
  const display = form.room_number
    ? `משרד ${form.room_number}${form.room_label ? ` · ${form.room_label}` : ""}`
    : form.public_area_label || "לא נבחר מיקום";

  const handleChange = (loc) => { onChange(loc); if (!forcePublicMode) setOpen(false); };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground">{autoLabel}</p>
          <p className="font-bold text-sm truncate">{display}</p>
        </div>
        <button type="button" onClick={() => setOpen(o => !o)}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary px-2.5 py-1.5 rounded-lg hover:bg-primary/10">
          {open ? <><Check className="w-3.5 h-3.5" />סגירה</> : <><Pencil className="w-3.5 h-3.5" />שינוי</>}
        </button>
      </div>
      {open && <RoomSelector value={form} onChange={handleChange} forcePublicMode={forcePublicMode} />}
    </div>
  );
}