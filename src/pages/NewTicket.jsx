import { useState } from "react";
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
import { generateTicketNumber, getSlaHours, getSlaTarget } from "@/lib/slaUtils";

const AREAS = [
  "משרד / חדר לקוח", "חלל משותף", "חדר ישיבות", "מטבחון",
  "שירותים", "מיזוג", "חשמל", "אינטרנט / תקשורת", "ניקיון", "תחזוקה כללית", "אחר"
];

const URGENCIES = ["רגילה", "בינונית", "גבוהה", "קריטית"];

export default function NewTicket() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    client_name: "",
    room_number: "",
    phone_number: "",
    issue_description: "",
    fault_area: "",
    urgency: "רגילה",
    notes: "",
  });

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: async (data) => {
      const now = new Date().toISOString();
      const ticketNumber = generateTicketNumber();
      const slaHours = getSlaHours(data.urgency);
      const slaTarget = getSlaTarget(now, data.urgency);

      return base44.entities.ServiceTicket.create({
        ...data,
        ticket_number: ticketNumber,
        sla_hours: slaHours,
        sla_target: slaTarget,
        sla_breached: false,
        client_notified: false,
        status: "פתוחה",
        update_history: [{
          date: now,
          action: "קריאה נפתחה",
          user: "מערכת",
          note: `נפתחה קריאת שירות ${ticketNumber}`
        }]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      navigate("/tickets");
    },
  });

  const isValid = form.client_name && form.room_number && form.phone_number && form.issue_description && form.fault_area;

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowRight className="w-4 h-4" />
        חזרה
      </button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">פתיחת קריאת שירות חדשה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>שם הלקוח *</Label>
              <Input value={form.client_name} onChange={e => update("client_name", e.target.value)} placeholder="שם מלא" />
            </div>
            <div className="space-y-1.5">
              <Label>מספר חדר / משרד *</Label>
              <Input value={form.room_number} onChange={e => update("room_number", e.target.value)} placeholder="לדוגמה: 302" />
            </div>
            <div className="space-y-1.5">
              <Label>מספר טלפון *</Label>
              <Input value={form.phone_number} onChange={e => update("phone_number", e.target.value)} placeholder="050-0000000" type="tel" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>אזור התקלה *</Label>
              <Select value={form.fault_area} onValueChange={v => update("fault_area", v)}>
                <SelectTrigger><SelectValue placeholder="בחר אזור" /></SelectTrigger>
                <SelectContent>
                  {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>מהות התקלה *</Label>
            <Input value={form.issue_description} onChange={e => update("issue_description", e.target.value)} placeholder="תיאור קצר של התקלה" />
          </div>

          <div className="space-y-1.5">
            <Label>דחיפות</Label>
            <div className="flex gap-2">
              {URGENCIES.map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => update("urgency", u)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.urgency === u
                      ? u === 'קריטית' ? 'bg-red-500 text-white border-red-500'
                        : u === 'גבוהה' ? 'bg-orange-500 text-white border-orange-500'
                        : u === 'בינונית' ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-blue-500 text-white border-blue-500'
                      : 'bg-card border-border hover:border-foreground/30'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              SLA: עד {getSlaHours(form.urgency)} שעות
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>הערות</Label>
            <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="הערות נוספות (אופציונלי)" rows={3} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => mutation.mutate(form)}
              disabled={!isValid || mutation.isPending}
              className="gap-2"
            >
              {mutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> פותח קריאה...</>
              ) : (
                <><Send className="w-4 h-4" /> פתח קריאת שירות</>
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>ביטול</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}