import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell, Pencil } from "lucide-react";
import { isManagerOrAdmin } from "@/lib/slaUtils";

const RECIPIENT_LABELS = { user: "משתמש", managers: "מנהלים", admin: "אדמין" };

export default function NotificationSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: () => base44.entities.NotificationSetting.list(),
    enabled: !loading && user?.role === 'admin',
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NotificationSetting.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      setEditing(null);
    },
  });

  const handleToggle = (setting) => {
    updateMutation.mutate({ id: setting.id, data: { enabled: !setting.enabled } });
  };

  if (loading || isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (user?.role !== 'admin') return <div className="text-center py-20 text-muted-foreground">אין הרשאה לצפות בדף זה</div>;

  const userSettings = settings.filter(s => s.recipient_type === 'user');
  const managerSettings = settings.filter(s => s.recipient_type === 'managers');

  return (
    <div className="space-y-5 max-w-4xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bell className="w-5 h-5" />הגדרות התראות
        </h1>
        <p className="text-muted-foreground text-sm mt-1">הפעלה, כיבוי ועריכת נוסחי מיילים</p>
      </div>

      <SettingGroup title="התראות למשתמש" settings={userSettings} onEdit={setEditing} onToggle={handleToggle} />
      <SettingGroup title="התראות למנהלים" settings={managerSettings} onEdit={setEditing} onToggle={handleToggle} />

      {editing && (
        <EditModal
          setting={editing}
          onSave={(data) => updateMutation.mutate({ id: editing.id, data })}
          onClose={() => setEditing(null)}
          saving={updateMutation.isPending}
        />
      )}
    </div>
  );
}

function SettingGroup({ title, settings, onEdit, onToggle }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {settings.map(s => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Switch checked={s.enabled} onCheckedChange={() => onToggle(s)} />
                <div className="min-w-0">
                  <p className="font-medium text-sm">{s.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.subject_template}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={s.enabled ? "default" : "secondary"} className="text-xs">
                  {s.enabled ? "פעיל" : "כבוי"}
                </Badge>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(s)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EditModal({ setting, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    enabled: setting.enabled,
    subject_template: setting.subject_template || '',
    body_template: setting.body_template || '',
    reminder_minutes: setting.reminder_minutes || '',
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>עריכת התראה — {setting.label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={form.enabled} onCheckedChange={v => setForm(f => ({ ...f, enabled: v }))} />
            <Label>{form.enabled ? "פעיל" : "כבוי"}</Label>
          </div>
          <div className="space-y-1.5">
            <Label>נושא המייל</Label>
            <Input value={form.subject_template} onChange={e => setForm(f => ({ ...f, subject_template: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>גוף המייל</Label>
            <p className="text-xs text-muted-foreground">משתנים: {`{{ticket_number}} {{customer_name}} {{ticket_type}} {{status}} {{assigned_to}} {{resolution_summary}} {{sla_label}} {{room_label}} {{priority}} {{created_by_name}}`}</p>
            <Textarea value={form.body_template} onChange={e => setForm(f => ({ ...f, body_template: e.target.value }))} rows={6} className="text-sm font-mono" />
          </div>
          {setting.reminder_minutes !== undefined && (
            <div className="space-y-1.5">
              <Label>תדירות תזכורת (דקות)</Label>
              <Input type="number" value={form.reminder_minutes} onChange={e => setForm(f => ({ ...f, reminder_minutes: Number(e.target.value) }))} />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={() => onSave(form)} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin ml-1" />שומר...</> : "שמור"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}