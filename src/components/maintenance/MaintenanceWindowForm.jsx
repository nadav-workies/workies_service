import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY = { date: "", start_time: "09:00", end_time: "12:00", availability: "available", available_workers: [], note: "" };

export default function MaintenanceWindowForm({ open, onClose, onSave, onDelete, initial, defaultDate, workers }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm({ ...EMPTY, date: defaultDate || "", ...(initial || {}), available_workers: initial?.available_workers || [] });
  }, [open, initial, defaultDate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleWorker = (name) => setForm(f => ({
    ...f,
    available_workers: f.available_workers.includes(name)
      ? f.available_workers.filter(w => w !== name)
      : [...f.available_workers, name],
  }));

  const valid = form.date && form.start_time && form.end_time && form.start_time < form.end_time;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader><DialogTitle>{initial?.id ? "עריכת חלון שיבוץ" : "חלון שיבוץ חדש"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>תאריך *</Label>
            <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>משעה *</Label>
              <Input type="time" value={form.start_time} onChange={e => set("start_time", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>עד שעה *</Label>
              <Input type="time" value={form.end_time} onChange={e => set("end_time", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>זמינות</Label>
            <Select value={form.availability} onValueChange={v => set("availability", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">זמין לשיבוץ (ירוק)</SelectItem>
                <SelectItem value="unavailable">לא זמין (אדום)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>עובדים זמינים בחלון</Label>
            <div className="flex flex-wrap gap-2">
              {workers.map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => toggleWorker(w)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${form.available_workers.includes(w) ? "bg-green-50 border-green-400 text-green-800" : "bg-card text-muted-foreground"}`}
                >
                  {w}
                </button>
              ))}
            </div>
            {form.available_workers.length === 0 && <p className="text-xs text-muted-foreground">לא נבחרו עובדים — החלון ייחשב פתוח לכל העובדים.</p>}
          </div>
          <div className="space-y-1">
            <Label>הערה</Label>
            <Input value={form.note} onChange={e => set("note", e.target.value)} placeholder="לדוגמה: רק עבודות שקטות" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          {initial?.id && <Button variant="ghost" className="text-red-600 mr-auto" onClick={() => onDelete(initial.id)}>מחק חלון</Button>}
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={() => onSave(form)} disabled={!valid}>שמור חלון</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}