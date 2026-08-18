import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Sparkles, Wrench, ChevronRight, ChevronLeft, Trash2, Pencil, CheckCircle2, XCircle, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { canManageMaintenancePlan } from "@/lib/permissions";
import { isAdmin } from "@/lib/permissions";
import {
  MAINTENANCE_CATEGORIES, MAINTENANCE_STATUSES, getCategory, getStatus, getPriority,
  getWeekStart, addDays, WEEKDAYS, formatHebrewDate, DEFAULT_WORKER
} from "@/lib/maintenanceConfig";
import MaintenanceTaskForm from "@/components/maintenance/MaintenanceTaskForm";
import ExtractTasksDialog from "@/components/maintenance/ExtractTasksDialog";

export default function MaintenancePlan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
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

  // Prefill from query param ?from_ticket=ID
  const urlParams = new URLSearchParams(window.location.search);
  const ticketIdParam = urlParams.get("from_ticket");
  const dateParam = urlParams.get("date");

  useEffect(() => {
    if (dateParam) setWeekStart(getWeekStart(dateParam));
  }, [dateParam]);

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
    if (ticketData && !fromTicket) {
      setFromTicket(ticketData);
      setFormOpen(true);
    }
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
      ...form,
      duration_minutes: Number(form.duration_minutes) || 60,
      source_ticket_id: editing?.source_ticket_id || fromTicket?.id || "",
      source_ticket_title: editing?.source_ticket_title || fromTicket?.ticket_number || "",
    };
    if (editing?.id) {
      await updateMutation.mutateAsync({ id: editing.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setFormOpen(false);
    setEditing(null);
    setFromTicket(null);
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

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const byDay = (date) => filtered.filter(t => t.planned_date === date).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  const workers = Array.from(new Set(tasks.map(t => t.assigned_maintenance_worker || DEFAULT_WORKER)));

  if (!user) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const admin = isAdmin(user);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold flex items-center gap-2"><Wrench className="w-5 h-5" /> תוכנית תחזוקה</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setExtractOpen(true)}>
            <Sparkles className="w-3.5 h-3.5" /> חילוץ משימות מקובץ
          </Button>
          <Button size="sm" className="gap-1" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="w-3.5 h-3.5" /> הוסף משימת תחזוקה
          </Button>
        </div>
      </div>

      {/* Filters + week nav */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-xs font-medium px-2">{formatHebrewDate(weekStart)} – {formatHebrewDate(addDays(weekStart, 6))}</span>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={() => setWeekStart(getWeekStart(new Date()))}>היום</Button>
        </div>
        <Select value={filterWorker} onValueChange={setFilterWorker}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="איש תחזוקה" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל העובדים</SelectItem>
            {workers.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="קטגוריה" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקטגוריות</SelectItem>
            {MAINTENANCE_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="סטטוס" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            {MAINTENANCE_STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Week board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {weekDays.map((date, idx) => {
            const dayTasks = byDay(date);
            return (
              <div key={date} className="border rounded-lg bg-card min-h-[120px]">
                <div className="px-2 py-1.5 border-b flex items-center justify-between sticky top-0 bg-card rounded-t-lg">
                  <span className="text-xs font-semibold">{WEEKDAYS.find(w => w.key === new Date(date + "T00:00:00").getDay())?.label}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(date + "T00:00:00").toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}</span>
                </div>
                <div className="p-1.5 space-y-1.5">
                  {dayTasks.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">אין משימות</p>}
                  {dayTasks.map(t => <TaskCard key={t.id} task={t} onEdit={() => { setEditing(t); setFormOpen(true); }} onDelete={() => deleteMutation.mutate(t.id)} onStatus={(s) => setStatus(t, s)} admin={admin} />)}
                </div>
              </div>
            );
          })}
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
    <div className="border rounded-lg p-2 space-y-1.5 bg-background">
      <div className="flex items-start gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${st.dot} mt-1.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-tight">{task.title}</p>
          <p className="text-[10px] text-muted-foreground">{task.start_time || ""} · {task.assigned_maintenance_worker || DEFAULT_WORKER}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        <span className={`text-[9px] px-1.5 py-0.5 rounded ${cat.color}`}>{cat.label}</span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded ${st.color}`}>{st.label}</span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded bg-muted ${pr.color}`}>{pr.label}</span>
        {task.source_ticket_id && <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-0.5"><Ticket className="w-2.5 h-2.5" />{task.source_ticket_title || "קריאה"}</span>}
      </div>
      {task.location && <p className="text-[10px] text-muted-foreground">📍 {task.location}</p>}
      <div className="flex items-center gap-1 pt-1 border-t">
        {task.status !== "done" && <button onClick={() => onStatus("done")} title="בוצע" className="text-green-600 hover:bg-green-50 p-1 rounded"><CheckCircle2 className="w-3.5 h-3.5" /></button>}
        {task.status !== "not_done" && <button onClick={() => onStatus("not_done")} title="לא בוצע" className="text-red-600 hover:bg-red-50 p-1 rounded"><XCircle className="w-3.5 h-3.5" /></button>}
        {task.status !== "checked" && <button onClick={() => onStatus("checked")} title="בוקר" className="text-emerald-700 hover:bg-emerald-50 p-1 rounded"><CheckCircle2 className="w-3.5 h-3.5" /></button>}
        <button onClick={onEdit} title="ערוך" className="text-muted-foreground hover:bg-muted p-1 rounded"><Pencil className="w-3.5 h-3.5" /></button>
        {admin && <button onClick={onDelete} title="מחק" className="text-muted-foreground hover:text-red-600 p-1 rounded mr-auto"><Trash2 className="w-3.5 h-3.5" /></button>}
      </div>
    </div>
  );
}