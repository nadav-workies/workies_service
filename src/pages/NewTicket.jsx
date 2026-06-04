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
import { ArrowRight, Loader2, Send, Search } from "lucide-react";
import AttachmentUploader from "@/components/tickets/AttachmentUploader";
import { generateTicketNumber, calculateSlaDeadlineMs, calculateSlaWarningAtMs, PRIORITY_SLA_MINUTES, isManagerOrAdmin } from "@/lib/slaUtils";
import { QUICK_TICKET_LIST } from "@/lib/quickTickets";
import { WORKIES_ROOMS, WORKIES_PUBLIC_AREAS } from "@/lib/workiesRooms";
import QuickTicketSelector from "@/components/tickets/QuickTicketSelector";

const PRIORITIES = ["רגילה","בינונית","גבוהה","קריטית"];
const PRIORITY_BUTTON_COLORS = {
  'קריטית': 'bg-red-500 text-white border-red-500',
  'גבוהה': 'bg-orange-500 text-white border-orange-500',
  'בינונית': 'bg-amber-500 text-white border-amber-500',
  'רגילה': 'bg-blue-500 text-white border-blue-500',
};

function RoomSelector({ value, onChange }) {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("room"); // "room" | "public"

  const filteredRooms = WORKIES_ROOMS.filter(r =>
    r.room_number.includes(search) || r.room_label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("room")}
          className={`text-xs px-3 py-1 rounded-full border transition-all ${mode === "room" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>
          חדר / משרד
        </button>
        <button type="button" onClick={() => setMode("public")}
          className={`text-xs px-3 py-1 rounded-full border transition-all ${mode === "public" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>
          אזור ציבורי
        </button>
      </div>

      {mode === "room" && (
        <div className="space-y-1.5">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="חיפוש חדר..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9 text-sm h-9" />
          </div>
          <div className="max-h-40 overflow-y-auto border rounded-lg p-1 bg-card">
            {filteredRooms.slice(0, 30).map(room => (
              <button key={room.room_number} type="button"
                onClick={() => onChange({ room_number: room.room_number, room_label: room.room_label, room_area: room.room_area, public_area_key: null, public_area_label: null })}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-right transition-colors text-sm ${value?.room_number === room.room_number ? "bg-primary/10 font-medium" : "hover:bg-muted"}`}>
                <span>{room.room_label}</span>
                <span className="text-xs text-muted-foreground font-mono">{room.room_number}</span>
              </button>
            ))}
          </div>
          {value?.room_number && <p className="text-xs text-primary font-medium">✓ נבחר: {value.room_label} (חדר {value.room_number})</p>}
        </div>
      )}

      {mode === "public" && (
        <div className="grid grid-cols-2 gap-1.5">
          {WORKIES_PUBLIC_AREAS.map(area => (
            <button key={area.area_key} type="button"
              onClick={() => onChange({ room_number: null, room_label: null, room_area: area.room_area, public_area_key: area.area_key, public_area_label: area.area_label })}
              className={`px-3 py-2 rounded-lg border text-sm text-right transition-all ${value?.public_area_key === area.area_key ? "border-primary bg-primary/10 font-medium" : "border-border hover:border-primary"}`}>
              {area.area_label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewTicket() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedQuickId, setSelectedQuickId] = useState(null);
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    issue_description: "",
    area: "",
    priority: "רגילה",
    ticket_type: "",
    quick_ticket_id: null,
    sla_minutes: null,
    sla_label: "",
    notes: "",
    customer_attachments: [],
    room_number: null,
    room_label: null,
    room_area: null,
    public_area_key: null,
    public_area_label: null,
  });

  useEffect(() => {
    // Pre-fill from URL params (e.g. when coming from service map)
    const urlParams = new URLSearchParams(window.location.search);
    const urlRoom = urlParams.get('room_number');
    if (urlRoom) {
      setForm(f => ({
        ...f,
        room_number: urlRoom,
        room_label: urlParams.get('room_label') || urlRoom,
        room_area: urlParams.get('room_area') || '',
        location_type: urlParams.get('location_type') || 'room',
      }));
    }

    base44.auth.me().then(u => {
      setUser(u);
      // Auto-fill room from user profile (only if not already set via URL)
      if (!urlRoom && u?.default_location_type === "room" && u?.default_room_number) {
        setForm(f => ({
          ...f,
          room_number: u.default_room_number,
          room_label: u.default_room_label,
          room_area: u.default_room_area,
        }));
      }
    }).catch(() => {});
  }, []);

  const isMgr = isManagerOrAdmin(user);
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

  const handleLocationChange = (loc) => {
    setForm(f => ({ ...f, ...loc }));
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      const openedAtDate = new Date();
      const openedAtMs = openedAtDate.getTime();
      const ticketNumber = generateTicketNumber();
      const slaMin = Number(data.sla_minutes || PRIORITY_SLA_MINUTES[data.priority] || 0) || null;

      const slaDeadlineMs = slaMin ? calculateSlaDeadlineMs(openedAtMs, slaMin) : null;
      const slaWarningAtMs = slaMin ? calculateSlaWarningAtMs(openedAtMs, slaMin) : null;

      // בדיקת תקינות: deadline חייב להיות אחרי פתיחה
      if (slaDeadlineMs && slaDeadlineMs <= openedAtMs) {
        throw new Error("SLA deadline must be after opened_at");
      }

      // For regular users, use their own name if no customer_name given
      const customerName = data.customer_name || user?.full_name || "";

      const ticket = await base44.entities.ServiceTicket.create({
        ...data,
        customer_name: customerName,
        ticket_number: ticketNumber,
        opened_at: openedAtDate.toISOString(),
        opened_at_ms: openedAtMs,
        sla_minutes: slaMin,
        sla_deadline: slaDeadlineMs ? new Date(slaDeadlineMs).toISOString() : null,
        sla_deadline_ms: slaDeadlineMs,
        sla_warning_at: slaWarningAtMs ? new Date(slaWarningAtMs).toISOString() : null,
        sla_warning_at_ms: slaWarningAtMs,
        sla_breached: false,
        customer_response_sent: false,
        manager_alert_sent: false,
        sla_reminder_sent: false,
        sla_breach_alert_sent: false,
        status: "פתוחה",
        source_system: "Base44-ServiceTickets",
        aio_ready: true,
        created_by: user?.email || "",
        created_by_id: user?.id || "",
        created_by_name: user?.full_name || "",
        update_history: [{ date: openedAtDate.toISOString(), action: "קריאה נפתחה", user: user?.full_name || "מערכת", note: "" }]
      });

      // Send confirmation to user + urgent manager alert (handled in ticketNotifications)
      base44.functions.invoke('ticketNotifications', { action: 'ticket_created', ticket }).catch(() => {});
      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      navigate("/");
    },
  });

  const locationDisplay = form.room_label
    ? `חדר ${form.room_label} (${form.room_number})`
    : form.public_area_label
    ? form.public_area_label
    : null;

  const isValid = form.issue_description && form.area && (form.room_number || form.public_area_key || isMgr);

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ArrowRight className="w-4 h-4" />חזרה
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

            {/* Location */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>מיקום *</Label>
                {locationDisplay && <span className="text-xs text-primary font-medium">✓ {locationDisplay}</span>}
              </div>
              {/* If user has a default room, show it with option to change */}
              {!isMgr && user?.default_location_type === "room" && user?.default_room_number && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 rounded-lg bg-muted text-sm">
                    חדר {user.default_room_label} ({user.default_room_number})
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs h-auto py-1" onClick={() => setForm(f => ({ ...f, room_number: null, room_label: null, room_area: null }))}>
                    שנה
                  </Button>
                </div>
              )}
              {/* Show selector if: manager, or user without default room, or user chose to change */}
              {(isMgr || !user?.default_location_type || user?.default_location_type === "none" || user?.default_location_type !== "room" || !form.room_number) && (
                <RoomSelector value={form} onChange={handleLocationChange} />
              )}
            </div>

            {/* Manager fields */}
            {isMgr && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>שם הלקוח</Label>
                  <Input value={form.customer_name} onChange={e => update("customer_name", e.target.value)} placeholder="שם מלא" />
                </div>
                <div className="space-y-1.5">
                  <Label>טלפון</Label>
                  <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="050-0000000" type="tel" dir="ltr" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>מהות התקלה *</Label>
              <Input value={form.issue_description} onChange={e => update("issue_description", e.target.value)} placeholder="תיאור קצר של התקלה" />
            </div>

            {/* Area - only if no quick ticket selected */}
            {!selectedQuickId && (
              <div className="space-y-1.5">
                <Label>אזור התקלה *</Label>
                <Select value={form.area} onValueChange={v => update("area", v)}>
                  <SelectTrigger><SelectValue placeholder="בחר אזור" /></SelectTrigger>
                  <SelectContent>
                    {["משרד / חדר לקוח","חלל משותף","חדר ישיבות","מטבחון","שירותים","מיזוג","חשמל","אינטרנט / תקשורת","ניקיון","תחזוקה כללית","אחר"].map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Priority — manager or manual (no quick ticket) */}
            {(isMgr || !selectedQuickId) && (
              <div className="space-y-1.5">
                <Label>דחיפות</Label>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map(p => (
                    <button key={p} type="button"
                      onClick={() => { update("priority", p); if (!selectedQuickId) update("sla_minutes", null); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${form.priority === p ? PRIORITY_BUTTON_COLORS[p] : 'bg-card border-border hover:border-foreground/30'}`}>
                      {p}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {form.sla_label || `SLA: ${form.priority === 'קריטית' ? '2 שעות' : form.priority === 'גבוהה' ? '8 שעות' : form.priority === 'בינונית' ? '24 שעות' : '48 שעות'}`}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>הערות</Label>
              <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="הערות נוספות" rows={2} />
            </div>

            <div className="space-y-1.5">
              <Label>צירוף תמונה של התקלה</Label>
              <AttachmentUploader
                attachments={form.customer_attachments}
                onChange={v => update("customer_attachments", v)}
                label="צרף תמונה / קובץ"
                helpText="אם אפשר, צרפו תמונה של התקלה. זה יעזור לנו לטפל מהר ומדויק יותר. לא חובה."
              />
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