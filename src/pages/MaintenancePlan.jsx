import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Sparkles, Wrench, ChevronRight, ChevronLeft, Trash2, Pencil, CheckCircle2, XCircle, Ticket, CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { canManageMaintenancePlan, isAdmin } from "@/lib/permissions";
import {
  MAINTENANCE_CATEGORIES, MAINTENANCE_STATUSES, getCategory, getStatus, getPriority,
  getWeekStart, addDays, WEEKDAYS, formatHebrewDate, DEFAULT_WORKER
} from "@/lib/maintenanceConfig";
import MaintenanceTaskForm from "@/components/maintenance/MaintenanceTaskForm";
import ExtractTasksDialog from "@/components/maintenance/ExtractTasksDialog";
import MaintenanceMonthCalendar from "@/components/maintenance/MaintenanceMonthCalendar";

export default function MaintenancePlan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [view, setView] = useState("week"); // "week" | "month"
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [monthStr, setMonthStr] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDay, setSelectedDay] = useState(null);
  const [filterWorker, setFilterWorker] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [extractOpen, setExtractOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [fromTicket, setFromTicket] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (!u || !canManageMaintenancePlan(u)) navigate("/");
    }).catch(() => navigate("/"));
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const ticketIdParam = urlParams.get("from_ticket");
  const dateParam = urlParams.get("date");

  useEffect(() => { if (dateParam) setWeekStart(getWeekStart(dateParam)); }, [dateParam]);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["maintenance-tasks"],
    queryFn: () => base44.entities.MaintenanceTask.list("-planned_date", 500),
  });

  const { data: ticketData } = useQuery({
    queryKey: ["ticket", ticketIdParam],
    queryFn: () => base44.entities.ServiceTicket.filter({ id: ticketIdParam }),
    select: d => d[0],
    enabled: !!ticketIdParam && !!user,
  });

  useEffect(() => {
    if (ticketData && !fromTicket) { setFromTicket(ticketData); setFormOpen(true); }
  }, [ticketData]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MaintenanceTask.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maintenance-tasks"] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaintenanceTask.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maintenance-tasks"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MaintenanceTask.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maintenance-tasks"] }),
  });
  const bulkCreateMutation = useMutation({
    mutationFn: (arr) => base44.entities.MaintenanceTask.bulkCreate(arr),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maintenance-tasks"] }),
  });

  const handleSave = async (form) => {
    const payload = {
      ...form, duration_minutes: Number(form.duration_minutes) || 60,
      source_ticket_id: editing?.source_ticket_id || fromTicket?.id || "",
      source_ticket_title: editing?.source_ticket_title || fromTicket?.ticket_number || "",
    };
    if (editing?.id) await updateMutation.mutateAsync({ id: editing.id, data: payload });
    else await createMutation.mutateAsync(payload);
    setFormOpen(false); setEditing(null); setFromTicket(null);
    if (ticketIdParam) navigate("/maintenance-plan", { replace: true });
  };

  const handleImport = async (drafts) => {
    const cleaned = drafts.map(d => ({ ...d, status: "planned", assigned_maintenance_worker: d.assigned_maintenance_worker || DEFAULT_WORKER }));
    if (cleaned.length) await bulkCreateMutation.mutateAsync(cleaned);
  };

  const setStatus = async (task, status) => {
    const updates = { status };
    if (status === "not_done" && !task.execution_note) {
      const note = window.prompt("סיבת אי ביצוע:");
      if (note === null) return;
      updates.execution_note = note;
    }
    if (status === "checked") {
      updates.checked_by = user?.full_name || user?.email || "מנהל";
      updates.checked_at = new Date().toISOString();
    }
    updateMutation.mutate({ id: task.id, data: updates });
  };

  const filtered = tasks.filter(t => {
    if (filterWorker !== "all" && (t.assigned_maintenance_worker || DEFAULT_WORKER) !== filterWorker) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    return true;
  });

  const byDay = (date) => filtered.filter(t => t.planned_date === date).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  const workers = Array.from(new Set(tasks.map(t => t.assigned_maintenance_worker || DEFAULT_WORKER)));

  // Week view: only days with tasks
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const activeWeekDays = weekDays.map(d => ({ date: d, tasks: byDay(d) })).filter(d => d.tasks.length > 0);

  // Month view: days with tasks in selected month
  const monthTasks = filtered.filter(t => (t.planned_date || "").startsWith(monthStr));
  const activeMonthDays = Array.from(new Set(monthTasks.map(t => t.planned_date))).sort();

  const shiftMonth = (delta) => {
    const [y, m] = monthStr.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonthStr(d.toISOString().slice(0, 7));
  };

  if (!user) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  const admin = isAdmin(user);

  const monthLabel = new Date(monthStr + "-01T00:00:00").toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2"><Wrench className="w-5 h-5" /> תוכנית תחזוקה</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1 h-9" onClick={() => setExtractOpen(true)}>
            <Sparkles className="w-4 h-4" /> חילוץ משימות מקובץ
          </Button>
          <Button size="sm" className="gap-1 h-9" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4" /> הוסף משימה
          </Button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
        <button onClick={() => setView("week")} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === "week" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
          <List className="w-4 h-4" /> שבועי
        </button>
        <button onClick={() => setView("month")} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === "month" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
          <CalendarDays className="w-4 h-4" /> חודשי
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {view === "week" ? (
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronRight className="w-4 h-4" /></Button>
            <span className="text-sm font-medium px-2">{formatHebrewDate(weekStart)} – {formatHebrewDate(addDays(weekStart, 6))}</span>
            <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronLeft className="w-4 h-4" /></Button>
            <Button size="sm" variant="ghost" className="h-9" onClick={() => setWeekStart(getWeekStart(new Date()))}>היום</Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => shiftMonth(-1)}><ChevronRight className="w-4 h-4" /></Button>
            <span className="text-sm font-medium px-3">{monthLabel}</span>
            <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => shiftMonth(1)}><ChevronLeft className="w-4 h-4" /></Button>
            <Button size="sm" variant="ghost" className="h-9" onClick={() => setMonthStr(new Date().toISOString().slice(0, 7))}>היום</Button>
          </div>
        )}
        <Select value={filterWorker} onValueChange={setFilterWorker}>
          <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="איש תחזוקה" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל העובדים</SelectItem>
            {workers.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="קטגוריה" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקטגוריות</SelectItem>
            {MAINTENANCE_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="סטטוס" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            {MAINTENANCE_STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Wrench className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold mb-1">אין משימות תחזוקה</p>
          <p className="text-sm text-muted-foreground">הוסף משימה חדשה או חלץ משימות מקובץ.</p>
        </div>
      ) : view === "week" ? (
        activeWeekDays.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">אין ימים עם משימות בשבוע זה — נווט לשבוע אחר או הוסף משימה.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {activeWeekDays.map(({ date, tasks: dayTasks }) => (
              <div key={date} className="border rounded-lg bg-card">
                <div className="px-3 py-2 border-b bg-muted/30">
                  <p className="text-sm font-semibold">{WEEKDAYS.find(w => w.key === new Date(date + "T00:00:00").getDay())?.label}</p>
                  <p className="text-xs text-muted-foreground">{new Date(date + "T00:00:00").toLocaleDateString("he-IL", { day: "numeric", month: "long" })}</p>
                </div>
                <div className="p-2 space-y-2">
                  {dayTasks.map(t => <TaskCard key={t.id} task={t} onEdit={() => { setEditing(t); setFormOpen(true); }} onDelete={() => deleteMutation.mutate(t.id)} onStatus={(s) => setStatus(t, s)} admin={admin} />)}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          <MaintenanceMonthCalendar monthStr={monthStr} tasks={monthTasks} onSelectDay={(d) => setSelectedDay(d)} selectedDate={selectedDay} />
          {selectedDay && (
            <div className="border rounded-lg bg-card">
              <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{formatHebrewDate(selectedDay)}</p>
                  <p className="text-xs text-muted-foreground">{byDay(selectedDay).length} משימות</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setSelectedDay(null)}>סגור</Button>
              </div>
              <div className="p-2 space-y-2">
                {byDay(selectedDay).length === 0
                  ? <p className="text-sm text-muted-foreground text-center py-4">אין משימות ביום זה</p>
                  : byDay(selectedDay).map(t => <TaskCard key={t.id} task={t} onEdit={() => { setEditing(t); setFormOpen(true); }} onDelete={() => deleteMutation.mutate(t.id)} onStatus={(s) => setStatus(t, s)} admin={admin} />)}
              </div>
            </div>
          )}
          {!selectedDay && activeMonthDays.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">ימים עם משימות ב{monthLabel}:</p>
              <div className="flex flex-wrap gap-2">
                {activeMonthDays.map(d => (
                  <button key={d} onClick={() => setSelectedDay(d)} className="px-3 py-1.5 border rounded-lg bg-card text-sm hover:bg-muted/40 transition-colors">
                    {new Date(d + "T00:00:00").toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })} ({byDay(d).length})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <MaintenanceTaskForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); setFromTicket(null); if (ticketIdParam) navigate("/maintenance-plan", { replace: true }); }}
        onSave={handleSave}
        initial={editing || (fromTicket ? {
          title: fromTicket.issue_description ? `תחזוקה: ${fromTicket.issue_description}` : "משימת תחזוקה",
          description: fromTicket.issue_description || "",
          location: fromTicket.room_number ? `חדר ${fromTicket.room_number}` : "",
          source_ticket_id: fromTicket.id, source_ticket_title: fromTicket.ticket_number,
        } : null)}
        defaultDate={dateParam || addDays(weekStart, 0)}
      />
      <ExtractTasksDialog open={extractOpen} onClose={() => setExtractOpen(false)} onImport={handleImport} />
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onStatus, admin }) {
  const cat = getCategory(task.category);
  const st = getStatus(task.status);
  const pr = getPriority(task.priority);
  return (
    <div className="border rounded-lg p-3 space-y-2 bg-background">
      <div className="flex items-start gap-2">
        <span className={`w-2 h-2 rounded-full ${st.dot} mt-1.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight">{task.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{task.start_time || ""} · {task.assigned_maintenance_worker || DEFAULT_WORKER}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className={`text-xs px-2 py-0.5 rounded ${cat.color}`}>{cat.label}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${st.color}`}>{st.label}</span>
        <span className={`text-xs px-2 py-0.5 rounded bg-muted ${pr.color}`}>{pr.label}</span>
        {task.source_ticket_id && <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-1"><Ticket className="w-3 h-3" />{task.source_ticket_title || "קריאה"}</span>}
      </div>
      {task.location && <p className="text-xs text-muted-foreground">📍 {task.location}</p>}
      {task.execution_note && task.status === "not_done" && <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{task.execution_note}</p>}
      <div className="flex items-center gap-1 pt-1.5 border-t">
        {task.status !== "done" && <button onClick={() => onStatus("done")} title="בוצע" className="text-green-600 hover:bg-green-50 p-2 rounded-lg"><CheckCircle2 className="w-4 h-4" /></button>}
        {task.status !== "not_done" && <button onClick={() => onStatus("not_done")} title="לא בוצע" className="text-red-600 hover:bg-red-50 p-2 rounded-lg"><XCircle className="w-4 h-4" /></button>}
        {task.status !== "checked" && <button onClick={() => onStatus("checked")} title="בוקר" className="text-emerald-700 hover:bg-emerald-50 p-2 rounded-lg"><CheckCircle2 className="w-4 h-4" /></button>}
        <button onClick={onEdit} title="ערוך" className="text-muted-foreground hover:bg-muted p-2 rounded-lg"><Pencil className="w-4 h-4" /></button>
        {admin && <button onClick={onDelete} title="מחק" className="text-muted-foreground hover:text-red-600 p-2 rounded-lg mr-auto"><Trash2 className="w-4 h-4" /></button>}
      </div>
    </div>
  );
}