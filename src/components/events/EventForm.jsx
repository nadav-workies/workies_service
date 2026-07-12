import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Power, Archive, MapPin, Plus, Pencil } from "lucide-react";

const EMPTY_FORM = {
  event_name: "",
  event_description: "",
  event_date: "",
  arrival_time: "",
  event_start_time: "",
  capacity: 80,
};

export default function EventForm({ events, activeEvent, isLoading, user, onActivate, activating }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async ({ isActivate }) => {
      if (!form.event_name || !form.event_date || !form.arrival_time) {
        throw new Error("יש למלא שם אירוע, תאריך ושעת הגעה");
      }
      const payload = {
        ...form,
        capacity: Number(form.capacity) || 80,
        created_by: user?.email || user?.full_name || "מנהל",
      };

      if (editingId) {
        await base44.entities.WorkiesEvent.update(editingId, payload);
        if (isActivate) await onActivate(editingId);
      } else {
        const created = await base44.entities.WorkiesEvent.create({
          ...payload,
          status: isActivate ? 'active' : 'draft',
          is_active: isActivate,
        });
        if (isActivate) await onActivate(created.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workies-events'] });
      setForm(EMPTY_FORM);
      setEditingId(null);
      setError("");
    },
    onError: (err) => setError(err.message),
  });

  const archiveMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.WorkiesEvent.update(id, {
        is_active: false,
        status: 'archived',
        archived_at: new Date().toISOString(),
        archived_by: user?.email || user?.full_name || "מנהל",
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workies-events'] }),
  });

  const startEdit = (ev) => {
    setEditingId(ev.id);
    setForm({
      event_name: ev.event_name || "",
      event_description: ev.event_description || "",
      event_date: ev.event_date || "",
      arrival_time: ev.arrival_time || "",
      event_start_time: ev.event_start_time || "",
      capacity: ev.capacity || 80,
    });
    setError("");
  };

  const cancelEdit = () => { setForm(EMPTY_FORM); setEditingId(null); setError(""); };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-5">
      {/* Active event banner */}
      {activeEvent && (
        <Card className="border-green-300 bg-green-50/40">
          <CardContent className="py-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-green-700 font-medium">✅ אירוע פעיל כעת</p>
              <p className="font-bold">{activeEvent.event_name}</p>
              <p className="text-xs text-muted-foreground">{activeEvent.event_date} · שעת הגעה: {activeEvent.arrival_time}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => startEdit(activeEvent)}>
                <Pencil className="w-3.5 h-3.5" />ערוך
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-orange-600" onClick={() => archiveMutation.mutate(activeEvent.id)} disabled={archiveMutation.isPending}>
                <Archive className="w-3.5 h-3.5" />ארכב
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{editingId ? "עריכת אירוע" : "יצירת אירוע חדש"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>שם אירוע *</Label>
            <Input value={form.event_name} onChange={e => setForm(f => ({ ...f, event_name: e.target.value }))} placeholder="לדוגמה: מסיבת קיץ" />
          </div>
          <div>
            <Label>תיאור / תוכן האירוע</Label>
            <Textarea value={form.event_description} onChange={e => setForm(f => ({ ...f, event_description: e.target.value }))} rows={3} placeholder="פרטים על האירוע..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>תאריך *</Label>
              <Input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
            </div>
            <div>
              <Label>שעת הגעה *</Label>
              <Input type="time" value={form.arrival_time} onChange={e => setForm(f => ({ ...f, arrival_time: e.target.value }))} />
            </div>
            <div>
              <Label>שעת התחלה</Label>
              <Input type="time" value={form.event_start_time} onChange={e => setForm(f => ({ ...f, event_start_time: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>קיבולת</Label>
              <Input type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">מיקום קבוע</p>
                <p className="text-sm font-medium">Workies באר שבע, אליהו נאווי 24</p>
              </div>
            </div>
          </div>

          {/* Location info */}
          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            מיקום האירוע קבוע: Workies באר שבע, אליהו נאווי 24, באר שבע
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => saveMutation.mutate({ isActivate: false })} disabled={saveMutation.isPending} variant="outline" className="gap-2">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              שמור טיוטה
            </Button>
            <Button onClick={() => saveMutation.mutate({ isActivate: true })} disabled={saveMutation.isPending || activating} className="gap-2">
              {saveMutation.isPending || activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
              הפעל אירוע
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={cancelEdit}>ביטול עריכה</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* All events list */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">כל האירועים ({events.length})</CardTitle></CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">אין אירועים עדיין</p>
          ) : (
            <div className="space-y-2">
              {events.map(ev => (
                <div key={ev.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{ev.event_name}</span>
                      <StatusBadge status={ev.status} isActive={ev.is_active} />
                    </div>
                    <p className="text-xs text-muted-foreground">{ev.event_date} · {ev.arrival_time} · קיבולת: {ev.capacity}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {ev.status !== 'active' && ev.status !== 'archived' && (
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => onActivate(ev.id)} disabled={activating}>
                        <Power className="w-3 h-3" />הפעל
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => startEdit(ev)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    {ev.is_active && (
                      <Button size="sm" variant="ghost" className="text-xs h-7 text-orange-600" onClick={() => archiveMutation.mutate(ev.id)} disabled={archiveMutation.isPending}>
                        <Archive className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status, isActive }) {
  const map = {
    draft: { label: 'טיוטה', cls: 'bg-gray-100 text-gray-600' },
    active: { label: 'פעיל', cls: 'bg-green-100 text-green-700' },
    archived: { label: 'ארכיון', cls: 'bg-orange-100 text-orange-700' },
    ended: { label: 'הסתיים', cls: 'bg-blue-100 text-blue-700' },
  };
  const s = map[status] || map.draft;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
}