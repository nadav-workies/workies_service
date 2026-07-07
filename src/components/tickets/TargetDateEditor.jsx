import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Shield, Pencil, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

export default function TargetDateEditor({ ticket, user, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);

  const openDialog = () => {
    const existing = ticket.treatment_deadline ? new Date(ticket.treatment_deadline) : new Date();
    setDate(format(existing, "yyyy-MM-dd"));
    setTime(format(existing, "HH:mm"));
    setOpen(true);
  };

  const handleSave = async () => {
    if (!date || !time) return;
    const deadlineDate = new Date(`${date}T${time}:00`);
    if (!Number.isFinite(deadlineDate.getTime())) return;

    setSaving(true);
    try {
      const now = new Date();
      const updates = {
        treatment_deadline: deadlineDate.toISOString(),
        treatment_deadline_ms: deadlineDate.getTime(),
        sla_deadline: deadlineDate.toISOString(),
        sla_deadline_ms: deadlineDate.getTime(),
        treatment_deadline_locked: true,
        treatment_deadline_set_at: now.toISOString(),
        treatment_deadline_set_by: user?.email || user?.full_name || "מערכת",
      };
      const historyEntry = {
        date: now.toISOString(),
        action: "עדכון תאריך יעד",
        user: user?.full_name || "משתמש",
        note: `תאריך יעד חדש: ${deadlineDate.toLocaleString("he-IL")}`,
      };
      const newHistory = [...(ticket.update_history || []), historyEntry].filter(Boolean);
      await base44.entities.ServiceTicket.update(ticket.id, { ...updates, update_history: newHistory });

      // Notify customer
      base44.functions.invoke('ticketNotifications', {
        action: 'deadline_updated',
        ticket: { ...ticket, ...updates },
      }).catch(() => {});

      onUpdated();
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const hasDeadline = !!ticket.treatment_deadline;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />תאריך יעד
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {hasDeadline ? (
          <p className="text-sm font-medium">
            {format(new Date(ticket.treatment_deadline), "dd/MM/yyyy HH:mm")}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">לא נקבע תאריך יעד</p>
        )}
        {user?.role === 'admin' && (
          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={openDialog}>
            <Pencil className="w-3.5 h-3.5" />{hasDeadline ? "עדכן תאריך יעד" : "קבע תאריך יעד"}
          </Button>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>עדכון תאריך יעד</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              הלקוח יקבל הודעת אימייל על תאריך היעד החדש.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>תאריך *</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>שעה *</Label>
                <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
            <Button onClick={handleSave} disabled={!date || !time || saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "שמור ועדכן לקוח"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}