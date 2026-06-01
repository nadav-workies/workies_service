import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { WORKIES_ROOMS } from "@/lib/workiesRooms";
import { Building2, Users, Zap, Calendar, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCATION_TYPES = [
  { type: "room", label: "חדר / משרד", icon: Building2, desc: "יש לי משרד קבוע" },
  { type: "guest", label: "אורח", icon: Users, desc: "ביקור חד פעמי" },
  { type: "openspace", label: "Open Space", icon: Zap, desc: "עובד מהחלל המשותף" },
  { type: "event", label: "אירוע", icon: Calendar, desc: "משתתף באירוע" },
];

export default function RoomPickerModal({ open, onClose, onSaved }) {
  const [step, setStep] = useState("type"); // "type" | "room"
  const [selectedType, setSelectedType] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = WORKIES_ROOMS.filter(r =>
    r.room_number.includes(search) ||
    r.room_label.toLowerCase().includes(search.toLowerCase())
  );

  const handleTypeSelect = (type) => {
    if (type === "room") {
      setSelectedType("room");
      setStep("room");
    } else {
      handleSave({ type, room: null });
    }
  };

  const handleRoomSelect = (room) => {
    handleSave({ type: "room", room });
  };

  const handleSave = async ({ type, room }) => {
    setSaving(true);
    const updates = {
      default_location_type: type,
      default_room_number: room?.room_number || null,
      default_room_label: room?.room_label || null,
      default_room_area: room?.room_area || null,
    };
    await base44.auth.updateMe(updates);
    setSaving(false);
    onSaved(updates);
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent dir="rtl" className="max-w-md" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>שיוך מיקום</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          כדי שנוכל לפתוח קריאות שירות מהר יותר, בחר את החדר, המשרד או סוג השהייה שלך בוורקיז.
        </p>

        {step === "type" && (
          <div className="space-y-3 mt-2">
            {LOCATION_TYPES.map(lt => (
              <button
                key={lt.type}
                onClick={() => handleTypeSelect(lt.type)}
                disabled={saving}
                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-right"
              >
                <lt.icon className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-sm">{lt.label}</p>
                  <p className="text-xs text-muted-foreground">{lt.desc}</p>
                </div>
              </button>
            ))}
            <Button variant="ghost" className="w-full text-sm text-muted-foreground" onClick={handleSkip}>
              אבחר מאוחר יותר
            </Button>
          </div>
        )}

        {step === "room" && (
          <div className="space-y-3 mt-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש חדר..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-9"
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg p-1">
              {filtered.map(room => (
                <button
                  key={room.room_number}
                  onClick={() => handleRoomSelect(room)}
                  disabled={saving}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted text-right transition-colors"
                >
                  <div>
                    <span className="font-medium text-sm">{room.room_label}</span>
                    <span className="text-xs text-muted-foreground mr-2">({room.room_area})</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{room.room_number}</span>
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setStep("type")}>
              חזרה
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}