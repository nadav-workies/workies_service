import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { WORKIES_ROOMS, WORKIES_PUBLIC_AREAS } from "@/lib/workiesRooms";

export default function RoomSelector({ value, onChange, forcePublicMode }) {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState(forcePublicMode || value?.public_area_key ? "public" : "room");

  useEffect(() => { if (forcePublicMode) setMode("public"); }, [forcePublicMode]);

  const filteredRooms = WORKIES_ROOMS.filter(r =>
    r.room_number.includes(search) || r.room_label.toLowerCase().includes(search.toLowerCase())
  );
  const tab = (m, label) => (
    <button type="button" onClick={() => setMode(m)}
      className={`flex-1 text-xs py-1.5 rounded-md transition-all ${mode === m ? "bg-card shadow-sm font-semibold" : "text-muted-foreground"}`}>
      {label}
    </button>
  );

  return (
    <div className="space-y-2">
      {!forcePublicMode && <div className="flex gap-1 p-1 rounded-lg bg-muted">{tab("room", "חדר / משרד")}{tab("public", "אזור ציבורי")}</div>}

      {mode === "room" && !forcePublicMode && (
        <div className="space-y-1.5">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="מספר או שם חדר..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9 text-sm h-9" autoFocus />
          </div>
          <div className="grid grid-cols-4 gap-1.5 max-h-44 overflow-y-auto">
            {filteredRooms.slice(0, 40).map(room => (
              <button key={room.room_number} type="button"
                onClick={() => onChange({ room_number: room.room_number, room_label: room.room_label, room_area: room.room_area, public_area_key: null, public_area_label: null, location_type: 'room' })}
                className={`py-2 rounded-lg border text-sm font-semibold transition-all ${value?.room_number === room.room_number ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}>
                {room.room_number}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "public" && (
        <div className="grid grid-cols-2 gap-1.5">
          {WORKIES_PUBLIC_AREAS.map(area => (
            <button key={area.area_key} type="button"
              onClick={() => onChange({ room_number: null, room_label: null, room_area: area.room_area, public_area_key: area.area_key, public_area_label: area.area_label, location_type: 'public_area' })}
              className={`px-3 py-2 rounded-lg border text-sm text-right transition-all ${value?.public_area_key === area.area_key ? "border-primary bg-primary/10 font-medium" : "border-border bg-card hover:border-primary"}`}>
              {area.area_label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}