import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Loader2, Send } from "lucide-react";
import { generateTicketNumber, getSlaDeadline, getSlaWarningAt, PRIORITY_SLA_MINUTES } from "@/lib/slaUtils";
import { QUICK_TICKET_LIST } from "@/lib/quickTickets";
import QuickTicketSelector from "@/components/tickets/QuickTicketSelector";

const AREAS = ["משרד / חדר לקוח","חלל משותף","חדר ישיבות","מטבחון","שירותים","מיזוג","חשמל","אינטרנט / תקשורת","ניקיון","תחזוקה כללית","אחר"];
const PRIORITIES = ["רגילה","בינונית","גבוהה","קריטית"];

const PRIORITY_BUTTON_COLORS = {
  'קריטית': 'bg-red-500 text-white border-red-500',
  'גבוהה': 'bg-orange-500 text-white border-orange-500',
  'בינונית': 'bg-amber-500 text-white border-amber-500',
  'רגילה': 'bg-blue-500 text-white border-blue-500',
};

export default function NewTicket() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedQuickId, setSelectedQuickId] = useState(null);
  const [form, setForm] = useState({
    customer_name: "",
    room_number: "",
    phone: "",
    issue_description: "",
    area: "",
    priority: "רגילה",
    ticket_type: "",
    quick_ticket_id: null,
    sla_minutes: null,
    sla_label: "",
    notes: "",
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleQuickSelect = (qt) => {
    setSelectedQuickId(qt.id);
    setForm(f => ({
      ...f,
      ticket_type: qt.ticket_type,
      quick_ticket_id: qt.id,
      area: qt.area,
      priority: qt.priority,
      sla_minutes: qt.sla_minutes,
      sla_label: qt.sla_label,
      issue_description: f.issue_description || qt.examples,
    }));
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      const now = new Date().toISOString();
      const ticketNumber = generateTicketNumber();
      const slaMin = data.sla_minutes || PRIORITY_SLA_MINUTES[data.priority];
      const slaDeadline = getSlaDeadline(now, slaMin);
      const slaWarningAt = getSlaWarningAt(now, slaMin);

      const ticket = await base44.entities.ServiceTicket.create({
        ...data,
        ticket_number: ticketNumber,
        sla_deadline: slaDeadline,
        sla_warning_at: slaWarningAt,
        sla_breached: false,
        customer_response_sent: false,
        manager_alert_sent: false,
        sla_reminder_sent: false,
        sla_breach_alert_sent: false,
        status: "פתוחה",
        created_by: user?.email || "",
        created_by_id: user?.id || "",
        created_by_name: user?.full_name || "",
        update_history: [{ date: now, action: "קריאה נפתחה", user: user?.full_name || "מערכת", note: "" }]
      });

      // Send alert for urgent/critical
      if (['גבוהה', 'קריטית'].includes(data.priority)) {
        base44.functions.invoke('notifyManagers', { ticket, type: 'urgent' }).catch(() => {});
      }

      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      navigate("/tickets");
    },
  });

  const isValid = form.customer_name && form.room_number && form.phone && form.issue_description && form.area;

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ArrowRight className="w-4 h-4" />
        חזרה
      </button>

      <div className="space-y-4">
        {/* Quick tickets */}
        <Card>
          <CardContent className="pt-5">
            <QuickTicketSelector onSelect={handleQuickSelect} selectedId={selectedQuickId} />
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">פרטי הקריאה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>שם הלקוח *</Label>
                <Input value={form.customer_name} onChange={e => update("customer_name", e.target.value)} placeholder="שם מלא" />
              </div>
              <div className="space-y-1.5">
                <Label>מספר חדר *</Label>
                <Input value={form.room_number} onChange={e => update("room_number", e.target.value)} placeholder="302" />
              </div>
              <div className="space-y-1.5">
                <Label>טלפון *</Label>
                <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="050-0000000" type="tel" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label>אזור התקלה *</Label>
                <Select value={form.area} onValueChange={v => update("area", v)}>
                  <SelectTrigger><SelectValue placeholder="בחר אזור" /></SelectTrigger>
                  <SelectContent>{AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>מהות התקלה *</Label>
              <Input value={form.issue_description} onChange={e => update("issue_description", e.target.value)} placeholder="תיאור קצר של התקלה" />
            </div>

            <div className="space-y-1.5">
              <Label>דחיפות</Label>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map(p => (
                  <button key={p} type="button" onClick={() => { update("priority", p); if (!selectedQuickId) update("sla_minutes", null); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${form.priority === p ? PRIORITY_BUTTON_COLORS[p] : 'bg-card border-border hover:border-foreground/30'}`}>
                    {p}
                  </button>
                ))}
              </div>
              {form.sla_label ? (
                <p className="text-xs text-muted-foreground">SLA: {form.sla_label}</p>
              ) : (
                <p className="text-xs text-muted-foreground">SLA: {form.priority === 'קריטית' ? '2 שעות' : form.priority === 'גבוהה' ? '8 שעות' : form.priority === 'בינונית' ? '24 שעות' : '48 שעות'}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>הערות</Label>
              <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="הערות נוספות" rows={2} />
            </div>

            <div className="flex gap-3 pt-1">
              <Button onClick={() => mutation.mutate(form)} disabled={!isValid || mutation.isPending} className="gap-2">
                {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />פותח...</> : <><Send className="w-4 h-4" />פתח קריאה</>}
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)}>ביטול</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}