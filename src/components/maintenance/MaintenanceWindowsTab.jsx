import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, CalendarDays, List, ChevronRight, ChevronLeft, CopyCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWeekStart, addDays, WEEKDAYS, formatHebrewDate } from "@/lib/maintenanceConfig";
import { weekDates, windowsForDate, latestDefinedWeekBefore, buildCarryForwardWindows } from "@/lib/maintenanceWindows";
import MaintenanceWindowForm from "@/components/maintenance/MaintenanceWindowForm";

export default function MaintenanceWindowsTab({ windows, workers, admin, weekStart, setWeekStart, monthStr, shiftMonth, tasksByDate }) {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState("week"); // week | month
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formDate, setFormDate] = useState("");
  const carriedRef = useRef({});

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["maintenance-windows"] });
  const createMutation = useMutation({ mutationFn: (d) => base44.entities.MaintenanceWindow.create(d), onSuccess: invalidate });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => base44.entities.MaintenanceWindow.update(id, data), onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.MaintenanceWindow.delete(id), onSuccess: invalidate });
  const carryMutation = useMutation({ mutationFn: (arr) => base44.entities.MaintenanceWindow.bulkCreate(arr), onSuccess: invalidate });

  const wkDates = weekDates(weekStart);
  const weekHasWindows = wkDates.some(d => windowsForDate(windows, d).length > 0);
  const sourceWeek = latestDefinedWeekBefore(windows, weekStart);

  // Weekly carry-forward: if the manager didn't define this week, keep the last defined week
  useEffect(() => {
    if (!admin || weekHasWindows || !sourceWeek || carriedRef.current[weekStart]) return;
    const copies = buildCarryForwardWindows(windows, sourceWeek, weekStart);
    if (copies.length === 0) return;
    carriedRef.current[weekStart] = true;
    carryMutation.mutate(copies);
  }, [admin, weekHasWindows, sourceWeek, weekStart, windows]);

  const monthDates = (() => {
    const [y, m] = monthStr.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    return Array.from({ length: days }, (_, i) => `${monthStr}-${String(i + 1).padStart(2, "0")}`);
  })();

  const openForm = (date, win) => { setFormDate(date); setEditing(win || null); setFormOpen(true); };

  const save = async (form) => {
    const payload = { ...form, week_start_date: getWeekStart(form.date) };
    if (editing?.id) await updateMutation.mutateAsync({ id: editing.id, data: payload });
    else await createMutation.mutateAsync(payload);
    setFormOpen(false); setEditing(null);
  };

  const dates = scope === "week" ? wkDates : monthDates;
  const monthLabel = new Date(monthStr + "-01T00:00:00").toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
          <button onClick={() => setScope("week")} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium ${scope === "week" ? "bg-card shadow-sm" : "text-muted-foreground"}`}><List className="w-4 h-4" /> שבועי</button>
          <button onClick={() => setScope("month")} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium ${scope === "month" ? "bg-card shadow-sm" : "text-muted-foreground"}`}><CalendarDays className="w-4 h-4" /> חודשי</button>
        </div>
        <div className="flex items-center gap-1">
          {scope === "week" ? (
            <>
              <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronRight className="w-4 h-4" /></Button>
              <span className="text-sm font-medium px-2">{formatHebrewDate(weekStart)} – {formatHebrewDate(addDays(weekStart, 6))}</span>
              <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronLeft className="w-4 h-4" /></Button>
            </>
          ) : (
            <>
              <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => shiftMonth(-1)}><ChevronRight className="w-4 h-4" /></Button>
              <span className="text-sm font-medium px-3">{monthLabel}</span>
              <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => shiftMonth(1)}><ChevronLeft className="w-4 h-4" /></Button>
            </>
          )}
          {admin && (
            <Button size="sm" className="gap-1 h-9" onClick={() => openForm(scope === "week" ? weekStart : monthDates[0])}>
              <Plus className="w-4 h-4" /> חלון שיבוץ
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> זמין לשיבוץ</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> לא זמין</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted border" /> לא הוגדר</span>
        {!weekHasWindows && sourceWeek && scope === "week" && (
          <span className="flex items-center gap-1 text-amber-700"><CopyCheck className="w-3.5 h-3.5" /> נשמרת ההגדרה מהשבוע הקודם</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {dates.map(date => {
          const dayWindows = windowsForDate(windows, date);
          const taskCount = (tasksByDate[date] || []).length;
          return (
            <div key={date} className="border rounded-xl bg-card">
              <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{WEEKDAYS.find(w => w.key === new Date(date + "T00:00:00").getDay())?.label}</p>
                  <p className="text-xs text-muted-foreground">{new Date(date + "T00:00:00").toLocaleDateString("he-IL", { day: "numeric", month: "long" })} · {taskCount} משימות</p>
                </div>
                {admin && <button onClick={() => openForm(date)} className="text-muted-foreground hover:bg-muted p-1.5 rounded-md" title="הוסף חלון"><Plus className="w-4 h-4" /></button>}
              </div>
              <div className="p-2 space-y-1.5">
                {dayWindows.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">לא הוגדרו חלונות</p>
                ) : dayWindows.map(w => {
                  const open = (w.availability || "available") === "available";
                  return (
                    <button
                      key={w.id}
                      onClick={() => admin && openForm(date, w)}
                      className={`w-full text-right border rounded-lg px-2.5 py-2 ${open ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"} ${admin ? "hover:brightness-95" : "cursor-default"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-medium ${open ? "text-green-800" : "text-red-800"}`}>{w.start_time}–{w.end_time}</span>
                        <span className={`text-[11px] px-1.5 py-0.5 rounded ${open ? "bg-green-200 text-green-900" : "bg-red-200 text-red-900"}`}>{open ? "זמין" : "לא זמין"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {w.available_workers?.length ? w.available_workers.join(" · ") : "כל העובדים"}
                      </p>
                      {w.note && <p className="text-xs text-muted-foreground">{w.note}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <MaintenanceWindowForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={save}
        onDelete={(id) => { deleteMutation.mutate(id); setFormOpen(false); setEditing(null); }}
        initial={editing}
        defaultDate={formDate}
        workers={workers}
      />
    </div>
  );
}