import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, UserCheck, UserX, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openWindowsForDate, normalizeSchedule } from "@/lib/maintenanceWindows";
import WorkerScheduleDialog from "@/components/maintenance/WorkerScheduleDialog";
import { WEEKDAYS } from "@/lib/maintenanceConfig";

export default function MaintenanceWorkersTab({ windows, weekDates, admin }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [scheduleWorker, setScheduleWorker] = useState(null);

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ["maintenance-workers"],
    queryFn: () => base44.entities.MaintenanceWorker.list("name", 100),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["maintenance-workers"] });
  const createMutation = useMutation({ mutationFn: (d) => base44.entities.MaintenanceWorker.create(d), onSuccess: invalidate });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => base44.entities.MaintenanceWorker.update(id, data), onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.MaintenanceWorker.delete(id), onSuccess: invalidate });

  const windowCountFor = (name) =>
    weekDates.reduce((sum, d) => sum + openWindowsForDate(windows, d).filter(w => !w.available_workers?.length || w.available_workers.includes(name)).length, 0);

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">עובדים זמינים לשיבוץ. שיבוץ משימה מתאפשר רק לעובד פעיל שמסומן כזמין בחלון שיבוץ ירוק.</p>

      {admin && (
        <div className="flex gap-2">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="שם עובד חדש" className="max-w-xs" />
          <Button className="gap-1" disabled={!newName.trim() || createMutation.isPending} onClick={() => { createMutation.mutate({ name: newName.trim(), is_active: true }); setNewName(""); }}>
            <Plus className="w-4 h-4" /> הוסף עובד
          </Button>
        </div>
      )}

      {workers.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl text-sm text-muted-foreground">אין עובדים מוגדרים — הוסף עובד כדי לשבץ משימות.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {workers.map(w => {
            const active = w.is_active !== false;
            const count = windowCountFor(w.name);
            return (
              <div key={w.id} className={`border rounded-xl p-3 bg-card ${active ? "" : "opacity-60"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{w.name}</p>
                    <p className="text-xs text-muted-foreground">{count > 0 ? `${count} חלונות זמינים בשבוע הנבחר` : "אין חלונות זמינים בשבוע הנבחר"}</p>
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {normalizeSchedule(w.work_schedule).map(row => (
                        <span
                          key={row.day_of_week}
                          className={`text-[11px] px-1.5 py-0.5 rounded border ${row.is_working ? "bg-green-50 border-green-300 text-green-800" : "bg-muted text-muted-foreground border-transparent"}`}
                          title={row.is_working ? `${row.start_time}–${row.end_time}` : "לא עובד"}
                        >
                          {WEEKDAYS[row.day_of_week].label.slice(0, 1)} {row.is_working ? `${row.start_time}-${row.end_time}` : "—"}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                    {active ? "זמין לעבודה" : "לא זמין"}
                  </span>
                </div>
                {admin && (
                  <div className="flex items-center gap-2 pt-2 mt-2 border-t">
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setScheduleWorker(w)}>
                      <CalendarRange className="w-3.5 h-3.5" /> יומן עבודה
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => updateMutation.mutate({ id: w.id, data: { is_active: !active } })}>
                      {active ? "סמן כלא זמין" : "סמן כזמין"}
                    </Button>
                    <button onClick={() => { if (window.confirm(`למחוק את ${w.name}?`)) deleteMutation.mutate(w.id); }} className="text-muted-foreground hover:text-red-600 p-1.5 rounded-md mr-auto" title="מחק עובד">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <WorkerScheduleDialog
        open={!!scheduleWorker}
        worker={scheduleWorker}
        saving={updateMutation.isPending}
        onClose={() => setScheduleWorker(null)}
        onSave={(rows) => updateMutation.mutate({ id: scheduleWorker.id, data: { work_schedule: rows } }, { onSuccess: () => setScheduleWorker(null) })}
      />
    </div>
  );
}