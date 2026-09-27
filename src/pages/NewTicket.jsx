import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Loader2, Send, AlertTriangle, Clock, PenLine } from "lucide-react";
import AttachmentUploader from "@/components/tickets/AttachmentUploader";
import { generateTicketNumber, calculateSlaWarningAtMs, PRIORITY_SLA_MINUTES, isManagerOrAdmin } from "@/lib/slaUtils";
import { calculateSlaDeadlineWithinServiceHours, isWithinServiceHours } from "@/lib/slaAgent";
import { QUICK_TICKET_LIST } from "@/lib/quickTickets";
import { WORKIES_PUBLIC_AREAS } from "@/lib/workiesRooms";
import QuickTicketSelector from "@/components/tickets/QuickTicketSelector";
import PrintingPackageForm from "@/components/tickets/PrintingPackageForm";
import LocationChip from "@/components/tickets/new/LocationChip";
import CommonTopics from "@/components/tickets/new/CommonTopics";
import ExtraDetails from "@/components/tickets/new/ExtraDetails";

const AREAS = ["משרד / חדר לקוח","חלל משותף","חדר ישיבות","מטבחון","שירותים","מיזוג","חשמל","אינטרנט / תקשורת","ניקיון","תחזוקה כללית","אחר"];
const MANUAL = { id: "manual", ticket_type: "קריאה אחרת", sla_label: "", examples: "" };

const EMPTY_FORM = {
  customer_name: "", phone: "", issue_description: "", area: "", priority: "רגילה",
  ticket_type: "", quick_ticket_id: null, sla_minutes: null, sla_label: "", notes: "",
  customer_attachments: [], room_number: null, room_label: null, room_area: null,
  public_area_key: null, public_area_label: null, public_area_near_room: "", public_area_location: "",
};

export default function NewTicket() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState(null); // quick ticket object or MANUAL
  const [showPrintingForm, setShowPrintingForm] = useState(false);
  const [publicFaultType, setPublicFaultType] = useState("");
  const [offHoursMsg, setOffHoursMsg] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [defaultLoc, setDefaultLoc] = useState({});

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlRoom = urlParams.get('room_number');
    const urlPublicAreaKey = urlParams.get('public_area_key');
    let loc = null;
    if (urlRoom) {
      loc = { room_number: urlRoom, room_label: urlParams.get('room_label') || urlRoom, room_area: urlParams.get('room_area') || '', location_type: urlParams.get('location_type') || 'room' };
    } else if (urlPublicAreaKey) {
      loc = { public_area_key: urlPublicAreaKey, public_area_label: urlParams.get('public_area_label') || '', room_area: urlParams.get('room_area') || '', location_type: 'public_area' };
    }

    base44.auth.me().then(u => {
      setUser(u);
      if (!loc && isManagerOrAdmin(u)) {
        // מנהלים ואדמין — Workies, קבלה (ניתן לשנות לחדר)
        loc = { room_number: null, room_label: null, room_area: "חללים משותפים", public_area_key: "reception", public_area_label: "קבלה", location_type: "public_area" };
      } else if (!loc && u?.default_room_number) {
        loc = { room_number: u.default_room_number, room_label: u.default_room_label, room_area: u.default_room_area, location_type: "room" };
      }
      if (loc) { setDefaultLoc(loc); setForm(f => ({ ...f, ...loc })); }
    }).catch(() => {});
  }, []);

  const isMgr = isManagerOrAdmin(user);
  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const { data: roomTenants = [] } = useQuery({
    queryKey: ['room-tenants-newticket', form.room_number],
    queryFn: () => base44.entities.RoomTenant.filter({ room_number: String(form.room_number), matched_room: true }, '-created_date', 10),
    enabled: isMgr && !!form.room_number,
    staleTime: 60000,
  });

  useEffect(() => {
    if (!isMgr || !form.room_number || roomTenants.length === 0) return;
    const tenant = roomTenants.find(t => t.is_primary_contact) || roomTenants[0];
    setForm(f => ({ ...f, customer_name: tenant.customer_name || "", phone: tenant.phone || "" }));
  }, [form.room_number, roomTenants, isMgr]);

  const handleQuickSelect = (qt) => {
    if (qt.is_printing_package_request === true || qt.id === "printing_package_update") {
      setShowPrintingForm(true);
      return;
    }
    setSelected(qt);
    setPublicFaultType("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setForm(f => ({
      ...f,
      ticket_type: qt.ticket_type, quick_ticket_id: qt.id, area: qt.area, priority: qt.priority,
      sla_minutes: qt.sla_minutes, sla_label: qt.sla_label, issue_description: "",
      ...(qt.ticket_type === "ניקיון חדר" && !f.customer_name && !isMgr ? { customer_name: user?.full_name || "", phone: user?.phone || "" } : {}),
      ...(qt.is_public_area_fault ? { room_number: null, room_label: null, public_area_key: null, public_area_label: null } : defaultLoc),
    }));
  };

  const startManual = () => {
    setSelected(MANUAL);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setForm(f => ({ ...f, ticket_type: "", quick_ticket_id: null, area: "", priority: "רגילה", sla_minutes: null, sla_label: "", issue_description: "" }));
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      const openedAtDate = new Date();
      const openedAtMs = openedAtDate.getTime();
      const ticketNumber = generateTicketNumber();
      const slaMin = Number(data.sla_minutes || PRIORITY_SLA_MINUTES[data.priority] || 0) || null;

      let slaDeadlineMs = null, slaStartAtMs = null, slaWarningAtMs = null;
      if (slaMin) {
        const { slaStart, slaDeadline } = calculateSlaDeadlineWithinServiceHours(openedAtDate, slaMin);
        slaStartAtMs = slaStart.getTime();
        slaDeadlineMs = slaDeadline.getTime();
        slaWarningAtMs = calculateSlaWarningAtMs(slaStartAtMs, slaMin);
      }

      if (!isWithinServiceHours(openedAtDate)) {
        setOffHoursMsg(openedAtDate.getHours() < 8 ? "קריאתך נרשמה. הטיפול יחל היום בשעה 08:00." : "קריאתך נרשמה. הטיפול יחל ביום הפעילות הבא בשעה 08:00.");
      }

      const customerName = data.customer_name || (isMgr ? "Workies" : user?.full_name) || "";

      let publicAreaLabel = data.public_area_label;
      if (data.public_area_key && data.public_area_near_room) publicAreaLabel = `${data.public_area_label} (ליד חדר ${data.public_area_near_room})`;
      else if (data.public_area_key && data.public_area_location) publicAreaLabel = `${data.public_area_label} - ${data.public_area_location}`;

      const baseDesc = data.issue_description || data.ticket_type;
      const issueDesc = publicFaultType ? `${publicFaultType} - ${data.issue_description || ""}`.trim() : baseDesc;

      const ticket = await base44.entities.ServiceTicket.create({
        ...data,
        issue_description: issueDesc,
        public_area_label: publicAreaLabel,
        request_type: publicFaultType || undefined,
        customer_name: customerName,
        ticket_number: ticketNumber,
        opened_at: openedAtDate.toISOString(),
        opened_at_ms: openedAtMs,
        sla_minutes: slaMin,
        sla_start_at: slaStartAtMs ? new Date(slaStartAtMs).toISOString() : null,
        sla_start_at_ms: slaStartAtMs,
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

      base44.functions.invoke('ticketNotifications', { action: 'ticket_created', ticket }).catch(() => {});
      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      navigate("/");
    },
  });

  if (showPrintingForm) return <PrintingPackageForm user={user} onBack={() => setShowPrintingForm(false)} />;

  // ---- Step 1: choose type ----
  if (!selected) {
    return (
      <div className="max-w-2xl mx-auto space-y-3" dir="rtl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="w-4 h-4" />חזרה
        </button>
        <QuickTicketSelector onSelect={handleQuickSelect} selectedId={null} />
        <button type="button" onClick={startManual}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary">
          <PenLine className="w-4 h-4" />משהו אחר? קריאה חופשית
        </button>
      </div>
    );
  }

  // ---- Step 2: quick details ----
  const isManual = selected.id === "manual";
  const isPublicFault = !!selected.is_public_area_fault;
  const selectedPublicArea = WORKIES_PUBLIC_AREAS.find(a => a.area_key === form.public_area_key);
  const needsNearRoom = selectedPublicArea?.requires_near_room;
  const needsLocation = selectedPublicArea?.requires_location;

  const isValid = (isManual ? form.issue_description && form.area : true)
    && (form.room_number || form.public_area_key || isMgr)
    && (!isPublicFault || !!publicFaultType)
    && (!needsNearRoom || !!form.public_area_near_room)
    && (!needsLocation || !!form.public_area_location);

  const autoLabel = isMgr && form.public_area_key === "reception" ? "נפתח בשם Workies" : (defaultLoc.room_number && form.room_number === defaultLoc.room_number ? "זוהה אוטומטית" : "מיקום");

  return (
    <div className="max-w-xl mx-auto pb-28 space-y-4" dir="rtl">
      <div className="flex items-center gap-3">
        <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0" aria-label="חזרה">
          <ArrowRight className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black leading-tight">{selected.ticket_type}</h1>
          {selected.sla_label && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />זמן טיפול: {selected.sla_label}</p>}
        </div>
      </div>

      <LocationChip form={form} onChange={loc => setForm(f => ({ ...f, ...loc }))} forcePublicMode={isPublicFault} autoLabel={autoLabel} />

      {needsNearRoom && <Input value={form.public_area_near_room} onChange={e => update("public_area_near_room", e.target.value)} placeholder="ליד איזה חדר? (מספר) *" />}
      {needsLocation && <Input value={form.public_area_location} onChange={e => update("public_area_location", e.target.value)} placeholder="מיקום מדויק (לדוגמה: קומה 1, ליד המעלית) *" />}

      {isPublicFault && (
        <div className="space-y-2">
          <p className="text-sm font-semibold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-orange-500" />סוג המפגע</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TICKET_LIST.find(q => q.id === 11)?.fault_types?.map(ft => (
              <button key={ft} type="button" onClick={() => setPublicFaultType(ft)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${publicFaultType === ft ? 'bg-orange-500 text-white border-orange-500' : 'bg-card border-border'}`}>
                {ft}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold">{isManual ? "מה קרה? *" : "מה הבעיה?"}</p>
        {!isManual && !isPublicFault && <CommonTopics quickTicket={selected} value={form.issue_description} onPick={t => update("issue_description", t)} />}
        <Input value={form.issue_description} onChange={e => update("issue_description", e.target.value)} placeholder={isManual ? "תיאור קצר של התקלה" : "או כתבו במילים שלכם (לא חובה)"} />
        {isManual && (
          <Select value={form.area} onValueChange={v => update("area", v)}>
            <SelectTrigger><SelectValue placeholder="אזור התקלה *" /></SelectTrigger>
            <SelectContent>{AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <AttachmentUploader attachments={form.customer_attachments} onChange={v => update("customer_attachments", v)} label="הוספת צילום" />
        <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="הערה (לא חובה)" rows={2} />
      </div>

      <ExtraDetails form={form} update={update}
        showCustomer={isMgr || form.ticket_type === "ניקיון חדר"}
        showPriority={isMgr || isManual}
        defaultOpen={isManual} />

      {offHoursMsg && <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">⏰ {offHoursMsg}</div>}

      <div className="fixed bottom-0 inset-x-0 lg:mr-60 p-3 bg-background/95 backdrop-blur border-t z-20">
        <div className="max-w-xl mx-auto">
          <Button onClick={() => mutation.mutate(form)} disabled={!isValid || mutation.isPending} className="w-full h-12 text-base gap-2 rounded-xl">
            {mutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" />שולח...</> : <><Send className="w-5 h-5" />שליחת קריאה</>}
          </Button>
        </div>
      </div>
    </div>
  );
}