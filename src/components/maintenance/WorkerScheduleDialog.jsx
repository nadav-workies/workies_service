import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { WEEKDAYS } from "@/lib/maintenanceConfig";
import { normalizeSchedule } from "@/lib/maintenanceWindows";

export default function WorkerScheduleDialog({ open, onClose, worker, onSave, saving }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (open) setRows(normalizeSchedule(worker?.work_schedule));
  }, [open, worker]);

  const set = (i, k, v) => setRows(r => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader><DialogTitle>יומן עבודה שבועי — {worker?.name}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">סמן את ימי העבודה והגדר שעות. שיבוץ משימה יתאפשר רק בימים ובשעות אלו.</p>
          {rows.map((row, i) => (
            <div key={row.day_of_week} className={`flex items-center gap-2 border rounded-lg p-2 ${row.is_working ? "bg-green-50 border-green-300" : "bg-muted/40"}`}>
              <Checkbox checked={!!row.is_working} onCheckedChange={v => set(i, "is_working", !!v)} id={`day-${row.day_of_week}`} />
              <label htmlFor={`day-${row.day_of_week}`} className="w-20 text-sm font-medium">{WEEKDAYS[row.day_of_week].label}</label>
              <Input type="time" className="h-8" value={row.start_time} disabled={!row.is_working} onChange={e => set(i, "start_time", e.target.value)} />
              <span className="text-muted-foreground text-xs">עד</span>
              <Input type="time" className="h-8" value={row.end_time} disabled={!row.is_working} onChange={e => set(i, "end_time", e.target.value)} />
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button disabled={saving} onClick={() => onSave(rows)}>שמור יומן עבודה</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}