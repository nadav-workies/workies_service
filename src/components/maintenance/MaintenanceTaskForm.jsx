import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAINTENANCE_CATEGORIES, MAINTENANCE_STATUSES, MAINTENANCE_PRIORITIES, DEFAULT_WORKER } from "@/lib/maintenanceConfig";
import { workerWindowsForDate, findMatchingWindow } from "@/lib/maintenanceWindows";

const EMPTY = {
  title: "", description: "", planned_date: "", start_time: "09:00", duration_minutes: 60,
  category: "general", status: "planned", priority: "medium",
  assigned_maintenance_worker: DEFAULT_WORKER, location: "", notes: "", recurring: "one_time",
};

export default function MaintenanceTaskForm({ open, onClose, onSave, initial, defaultDate, windows = [], workers = [] }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm({ ...EMPTY, planned_date: defaultDate || "", ...(initial || {}) });
  }, [open, initial, defaultDate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const worker = form.assigned_maintenance_worker || DEFAULT_WORKER;
  const dayWindows = workerWindowsForDate(windows, form.planned_date, worker);
  const matchingWindow = findMatchingWindow(windows, form.planned_date, form.start_time, worker);
  const scheduleOk = !!matchingWindow;

  const submit = () => {
    if (!form.title?.trim() || !form.planned_date || !scheduleOk) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial?.id ? "עריכת משימת תחזוקה" : "משימת תחזוקה חדשה"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>כותרת משימה *</Label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="לדוגמה: תיקון ברז בחדר 9" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>תאריך מתוכנן *</Label>
              <Input type="date" value={form.planned_date} onChange={e => set("planned_date", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>שעת התחלה</Label>
              <Input type="time" value={form.start_time} onChange={e => set("start_time", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>קטגוריה</Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MAINTENANCE_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>עדיפות</Label>
              <Select value={form.priority} onValueChange={v => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MAINTENANCE_PRIORITIES.map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>איש תחזוקה</Label>
              <Select value={worker} onValueChange={v => set("assigned_maintenance_worker", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(workers.length ? workers : [DEFAULT_WORKER]).map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>משך (דקות)</Label>
              <Input type="number" value={form.duration_minutes} onChange={e => set("duration_minutes", Number(e.target.value))} />
            </div>
          </div>
          {/* Scheduling windows for the chosen date + worker */}
          <div className={`rounded-lg border p-2.5 text-xs space-y-1.5 ${scheduleOk ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
            <p className="font-medium">חלונות שיבוץ זמינים ל{worker}</p>
            {dayWindows.length === 0 ? (
              <p className="text-red-700">אין חלון זמין בתאריך זה לעובד זה — יש להגדיר חלון שיבוץ ירוק (טאב חלונות שיבוץ) לפני שיבוץ.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {dayWindows.map(w => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => set("start_time", w.start_time)}
                    className={`px-2 py-1 rounded border ${matchingWindow?.id === w.id ? "bg-green-200 border-green-500 text-green-900" : "bg-card"}`}
                  >
                    {w.start_time}–{w.end_time}
                  </button>
                ))}
              </div>
            )}
            {dayWindows.length > 0 && !scheduleOk && <p className="text-red-700">שעת ההתחלה אינה בתוך חלון זמין — בחר חלון מהרשימה.</p>}
          </div>

          <div className="space-y-1">
            <Label>מיקום / חדר</Label>
            <Input value={form.location} onChange={e => set("location", e.target.value)} placeholder="לדוגמה: חדר 12 / אזור מזרחי" />
          </div>
          <div className="space-y-1">
            <Label>תיאור</Label>
            <Textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>סטטוס</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MAINTENANCE_STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>חזרתיות</Label>
              <Select value={form.recurring} onValueChange={v => set("recurring", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">חד־פעמית</SelectItem>
                  <SelectItem value="daily">יומית</SelectItem>
                  <SelectItem value="weekly">שבועית</SelectItem>
                  <SelectItem value="monthly">חודשית</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>הערות</Label>
            <Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={submit} disabled={!form.title?.trim() || !form.planned_date || !scheduleOk}>שמור משימה</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}