import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { StatusBadge, PriorityBadge, SlaBadge } from "@/components/tickets/TicketStatusBadge";
import { isManagerOrAdmin } from "@/lib/slaUtils";
import { getTimeRemainingLabel, getDeadlineMs, getOpenedAtMs, isTicketSlaBreached as isTicketBreached } from "@/lib/slaAgent.js";
import { format } from "date-fns";
import { ArrowRight, User, Phone, MapPin, Clock, Shield, MessageSquare, Loader2, CheckCircle, AlertTriangle, Star, ExternalLink, Send, Building2, RefreshCw, Mail, Printer } from "lucide-react";
import FeedbackModal from "@/components/tickets/FeedbackModal";
import AttachmentUploader from "@/components/tickets/AttachmentUploader";
import SlaExclusionDialog from "@/components/tickets/SlaExclusionDialog";
import PrintingBadge from "@/components/tickets/PrintingBadge";
import RecordActionsMenu from "@/components/admin/RecordActionsMenu";
import TargetDateEditor from "@/components/tickets/TargetDateEditor";
import { openTenantWhatsApp } from "@/lib/whatsappNotify";

const STATUSES = ["פתוחה","שויכה לטיפול","בטיפול","ממתינה","טופלה","נסגרה"];
const BREACH_REASONS = ["ממתין לספק","חוסר בחלקים","לא אותר הלקוח","טיפול נדחה","תקלה מורכבת","עומס תפעולי","אחר"];

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [assignName, setAssignName] = useState("");
  const [closeDialog, setCloseDialog] = useState(false);
  const [closeForm, setCloseForm] = useState({ resolution_summary: "", customer_response_sent: false, sla_breach_reason: "", resolution_attachments: [] });
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [googleSending, setGoogleSending] = useState(false);
  const [googleSent, setGoogleSent] = useState(false);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [slaExclusionOpen, setSlaExclusionOpen] = useState(false);
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [treatmentDeadlineForm, setTreatmentDeadlineForm] = useState({ date: "", time: "" });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => base44.entities.ServiceTicket.filter({ id }),
    select: d => d[0],
  });

  const isMgr = isManagerOrAdmin(user);
  const isOwner = user && ticket && (ticket.created_by_id === user.id || ticket.created_by === user.email);
  const canView = isMgr || isOwner;

  // Fetch current tenant data for the ticket's room
  const { data: roomTenants = [] } = useQuery({
    queryKey: ['ticket-room-tenants', ticket?.room_number],
    queryFn: () => base44.entities.RoomTenant.filter({ room_number: String(ticket.room_number), matched_room: true }, '-created_date', 10),
    enabled: !!ticket?.room_number && isMgr,
    staleTime: 60000,
  });
  const currentTenant = roomTenants.find(t => t.is_primary_contact) || roomTenants[0] || null;

  const updateMutation = useMutation({
    mutationFn: ({ updates, historyEntry }) => {
      const newHistory = [...(ticket.update_history || []), historyEntry].filter(Boolean);
      return base44.entities.ServiceTicket.update(id, { ...updates, update_history: newHistory });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const addHistory = (action, note = "") => ({
    date: new Date().toISOString(), action, user: user?.full_name || "משתמש", note
  });

  const handleStatusChange = (newStatus) => {
    if (newStatus === "נסגרה") { setCloseDialog(true); return; }

    if (newStatus === "בטיפול") {
      if (ticket.treatment_deadline_locked) {
        // דדליין כבר ננעל — שינוי סטטוס בלבד
        updateMutation.mutate({ updates: { status: "בטיפול" }, historyEntry: addHistory("סטטוס שונה ל: בטיפול") });
        base44.functions.invoke('ticketNotifications', { action: 'status_changed', ticket: { ...ticket, status: "בטיפול" }, newStatus: "בטיפול", oldStatus: ticket.status }).catch(() => {});
        openTenantWhatsApp({ ...ticket, status: "בטיפול" }, currentTenant, "בטיפול");
        return;
      }
      setTreatmentDeadlineForm({ date: "", time: "" });
      setTreatmentDialogOpen(true);
      return;
    }

    const isPrintingCompletion = ticket.is_printing_package_request === true && newStatus === "טופלה";
    updateMutation.mutate({ updates: { status: newStatus }, historyEntry: addHistory(`סטטוס שונה ל: ${newStatus}`) });
    if (isPrintingCompletion) {
      base44.functions.invoke('ticketNotifications', {
        action: 'printing_package_completed',
        ticket: { ...ticket, status: newStatus, closed_at: new Date().toISOString() }
      }).catch(() => {});
    } else {
      base44.functions.invoke('ticketNotifications', { action: 'status_changed', ticket: { ...ticket, status: newStatus }, newStatus, oldStatus: ticket.status }).catch(() => {});
    }
  };

  const handleStartTreatmentWithDeadline = () => {
    if (!treatmentDeadlineForm.date || !treatmentDeadlineForm.time) return;
    const deadlineDate = new Date(`${treatmentDeadlineForm.date}T${treatmentDeadlineForm.time}:00`);
    const deadlineMs = deadlineDate.getTime();
    if (!Number.isFinite(deadlineMs) || deadlineMs <= Date.now()) return;

    const now = new Date();
    const updates = {
      status: "בטיפול",
      original_sla_deadline: ticket.original_sla_deadline || ticket.sla_deadline || null,
      original_sla_deadline_ms: ticket.original_sla_deadline_ms || ticket.sla_deadline_ms || null,
      treatment_started_at: now.toISOString(),
      treatment_started_at_ms: now.getTime(),
      treatment_started_by: user?.email || user?.full_name || "מערכת",
      treatment_deadline: deadlineDate.toISOString(),
      treatment_deadline_ms: deadlineMs,
      treatment_deadline_locked: true,
      treatment_deadline_set_at: now.toISOString(),
      treatment_deadline_set_by: user?.email || user?.full_name || "מערכת",
      sla_deadline: deadlineDate.toISOString(),
      sla_deadline_ms: deadlineMs,
    };

    updateMutation.mutate({
      updates,
      historyEntry: addHistory("תחילת טיפול", `דדליין סיום טיפול: ${deadlineDate.toLocaleString("he-IL")}`)
    });
    base44.functions.invoke('ticketNotifications', { action: 'status_changed', ticket: { ...ticket, ...updates }, newStatus: "בטיפול", oldStatus: ticket.status }).catch(() => {});
    openTenantWhatsApp({ ...ticket, ...updates }, currentTenant, "בטיפול");
    setTreatmentDialogOpen(false);
  };

  const handleAssign = () => {
    if (!assignName.trim()) return;
    const newStatus = ticket.status === "פתוחה" ? "שויכה לטיפול" : ticket.status;
    updateMutation.mutate({
      updates: { assigned_to: assignName, status: newStatus },
      historyEntry: addHistory(`שויכה לטיפול: ${assignName}`)
    });
    base44.functions.invoke('ticketNotifications', { action: 'status_changed', ticket: { ...ticket, assigned_to: assignName, status: newStatus }, newStatus: 'שויכה לטיפול', oldStatus: ticket.status }).catch(() => {});
    setAssignName("");
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    updateMutation.mutate({ updates: {}, historyEntry: addHistory("הערה", noteText) });
    setNoteText("");
  };

  const handleClose = () => {
    if (!closeForm.resolution_summary || !closeForm.customer_response_sent) return;
    const now = new Date();
    const currentBreach = isTicketBreached(ticket);
    if (currentBreach && !closeForm.sla_breach_reason) return;
    const isBreach = currentBreach;
    const isPrinting = ticket.is_printing_package_request === true;
    const closeStatus = isPrinting ? "הושלם" : "נסגרה";
    const closedTicket = {
      ...ticket,
      status: closeStatus,
      resolution_summary: closeForm.resolution_summary,
      customer_response_sent: true,
      closed_at: now.toISOString(),
      sla_breached: !!isBreach,
      ...(isBreach && { sla_breach_reason: closeForm.sla_breach_reason }),
      ...(closeForm.resolution_attachments?.length > 0 && { resolution_attachments: closeForm.resolution_attachments }),
    };
    updateMutation.mutate({
      updates: closedTicket,
      historyEntry: addHistory(isPrinting ? "קריאה הושלמה" : "קריאה נסגרה", closeForm.resolution_summary)
    });
    if (isPrinting) {
      base44.functions.invoke('ticketNotifications', {
        action: 'printing_package_completed',
        ticket: closedTicket
      }).catch(() => {});
      openTenantWhatsApp(closedTicket, currentTenant, "הושלם");
    } else {
      base44.functions.invoke('ticketNotifications', { action: 'status_changed', ticket: closedTicket, newStatus: closeStatus, oldStatus: ticket.status }).catch(() => {});
      base44.functions.invoke('ticketNotifications', { action: 'feedback_request', ticket: closedTicket }).catch(() => {});
    }
    setCloseDialog(false);
  };

  const handleSendGoogleReview = async () => {
    if (!ticket.created_by) return;
    setGoogleSending(true);
    await base44.functions.invoke('ticketNotifications', { action: 'google_review_request', ticket });
    await base44.entities.ServiceTicket.update(ticket.id, {
      google_review_request_sent: true,
      google_review_request_sent_at: new Date().toISOString(),
      google_review_request_manually_sent: true,
    });
    queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    setGoogleSending(false);
    setGoogleSent(true);
  };

  const handleSendFeedbackSurvey = async () => {
    setFeedbackSending(true);
    // Use the current tenant's email if available (from RoomTenant), otherwise fall back to ticket creator
    const recipientEmail = currentTenant?.email || ticket.created_by || "";
    await base44.functions.invoke('ticketNotifications', {
      action: 'feedback_request',
      ticket: { ...ticket, customer_email: recipientEmail, customer_name: currentTenant?.customer_name || ticket.customer_name },
    });
    queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    setFeedbackSending(false);
    setFeedbackSent(true);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!ticket || !canView) return <div className="text-center py-20 text-muted-foreground">הקריאה לא נמצאה או שאין לך הרשאה לצפות בה</div>;

  const isClosed = ticket.status === "נסגרה" || ticket.status === "הושלם" || ticket.status === "בוטל";
  const isBreach = isTicketBreached(ticket);
  const sla = getTimeRemainingLabel(ticket);
  const slaDeadlineMs = getDeadlineMs(ticket);
  const openedAtMs = getOpenedAtMs(ticket);

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ArrowRight className="w-4 h-4" />חזרה
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold">{ticket.ticket_number}</h1>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <PrintingBadge ticket={ticket} />
          </div>
          <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1.5">
            {ticket.is_printing_package_request && <Printer className="w-3.5 h-3.5 text-primary" />}
            {ticket.ticket_type || ticket.issue_description}
          </p>
        </div>
        {isMgr && !isClosed && (
          <Select onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="שנה סטטוס" /></SelectTrigger>
            <SelectContent>{STATUSES.filter(s => s !== ticket.status).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">פרטי הקריאה</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow icon={User} label="לקוח" value={ticket.customer_name} />
                <InfoRow icon={MapPin} label="חדר" value={ticket.room_number} />
                <InfoRow icon={Phone} label="טלפון" value={ticket.phone} dir="ltr" />
                <InfoRow icon={MapPin} label="אזור" value={ticket.area} />
                <InfoRow icon={Clock} label="נפתחה" value={openedAtMs ? format(new Date(openedAtMs), "dd/MM/yyyy HH:mm") : "—"} />
                {ticket.original_sla_deadline_ms ? (
                  <InfoRow icon={Shield} label="יעד תחילת טיפול" value={format(new Date(Number(ticket.original_sla_deadline_ms)), "dd/MM/yyyy HH:mm")} />
                ) : slaDeadlineMs && !ticket.treatment_deadline_ms ? (
                  <InfoRow icon={Shield} label="יעד SLA" value={format(new Date(slaDeadlineMs), "dd/MM/yyyy HH:mm")} />
                ) : null}
                {ticket.treatment_deadline_ms && (
                  <InfoRow icon={Shield} label="דדליין סיום טיפול" value={format(new Date(Number(ticket.treatment_deadline_ms)), "dd/MM/yyyy HH:mm")} />
                )}
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-0.5">מהות התקלה</p>
                <p className="text-sm">{ticket.issue_description}</p>
              </div>
              {ticket.notes && (
                <div className="mt-2 p-2 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-0.5">הערות</p>
                  <p className="text-sm">{ticket.notes}</p>
                </div>
              )}
              {ticket.customer_attachments?.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1.5">קבצים שצורפו על ידי הלקוח</p>
                  <AttachmentUploader attachments={ticket.customer_attachments} onChange={() => {}} disabled />
                </div>
              )}
              {ticket.resolution_attachments?.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1.5">קבצים שצורפו בסגירת הטיפול</p>
                  <AttachmentUploader attachments={ticket.resolution_attachments} onChange={() => {}} disabled />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current tenant info (from import) */}
          {isMgr && currentTenant && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />דייר נוכחי בחדר</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground">שם לקוח</p>
                    <p className="font-medium">{currentTenant.customer_name}</p>
                  </div>
                  {currentTenant.company_id && (
                    <div>
                      <p className="text-[10px] text-muted-foreground">ח.פ</p>
                      <p className="font-medium" dir="ltr">{currentTenant.company_id}</p>
                    </div>
                  )}
                  {currentTenant.phone && (
                    <div>
                      <p className="text-[10px] text-muted-foreground">טלפון</p>
                      <p className="font-medium" dir="ltr">{currentTenant.phone}</p>
                    </div>
                  )}
                  {currentTenant.email && (
                    <div>
                      <p className="text-[10px] text-muted-foreground">אימייל</p>
                      <p className="font-medium text-xs truncate" dir="ltr">{currentTenant.email}</p>
                    </div>
                  )}
                </div>
                {(currentTenant.customer_name !== ticket.customer_name || currentTenant.phone !== ticket.phone) && (
                  <div className="pt-1.5 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 gap-1 text-blue-600"
                      onClick={() => {
                        updateMutation.mutate({
                          updates: { customer_name: currentTenant.customer_name, phone: currentTenant.phone },
                          historyEntry: addHistory("עדכון פרטי לקוח ממאגר הדיירים"),
                        });
                      }}
                    >
                      <RefreshCw className="w-3 h-3" />
                      סנכרן פרטי לקוח מהמאגר
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* SLA */}
          <Card className={isBreach ? "border-red-300 bg-red-50/50" : ""}>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {isBreach ? <AlertTriangle className="w-5 h-5 text-red-500" /> : isClosed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Clock className="w-5 h-5 text-primary" />}
                  <div>
                    <p className="text-xs text-muted-foreground">{isClosed ? "נסגרה ב" : isBreach ? "חריגת SLA" : "זמן שנותר ל-SLA"}</p>
                    <p className={`font-bold ${isBreach ? "text-red-600" : isClosed ? "text-green-700" : ""}`}>
                      {isClosed && ticket.closed_at ? format(new Date(ticket.closed_at), "dd/MM/yyyy HH:mm") : sla.text}
                    </p>
                  </div>
                </div>
                <SlaBadge ticket={ticket} status={ticket.status} />
              </div>
            </CardContent>
          </Card>

          {/* Resolution */}
          {ticket.resolution_summary && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-1"><CardTitle className="text-sm text-green-800">סיכום טיפול</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm">{ticket.resolution_summary}</p>
                {ticket.sla_breached && ticket.sla_breach_reason && (
                  <p className="text-xs text-red-600 mt-1">סיבת חריגה: {ticket.sla_breach_reason}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* History */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">היסטוריית עדכונים</CardTitle></CardHeader>
            <CardContent>
              {ticket.update_history?.length > 0 ? (
                <div className="space-y-2.5">
                  {[...ticket.update_history].reverse().map((entry, i) => (
                    <div key={i} className="flex gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{entry.action}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(entry.date), "dd/MM HH:mm")}</span>
                        </div>
                        {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">אין היסטוריה</p>}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Manager actions */}
          {isMgr && !isClosed && (
            <>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">שיוך אחראי</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input value={assignName} onChange={e => setAssignName(e.target.value)} placeholder={ticket.assigned_to || "שם אחראי"} className="text-sm" />
                    <Button size="sm" onClick={handleAssign} disabled={!assignName.trim()}>שייך</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">פעולות מהירות</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {ticket.status !== "בטיפול" && (
                    <Button variant="outline" className="w-full text-sm justify-start" onClick={() => handleStatusChange("בטיפול")}>סמן כבטיפול</Button>
                  )}
                  {ticket.treatment_deadline_locked && ticket.treatment_deadline && (
                    <div className="text-xs text-muted-foreground bg-muted rounded px-2 py-1.5">
                      🔒 דדליין סיום טיפול: {format(new Date(ticket.treatment_deadline), "dd/MM/yyyy HH:mm")}
                    </div>
                  )}
                  {ticket.status !== "טופלה" && (
                    <Button variant="outline" className="w-full text-sm justify-start" onClick={() => handleStatusChange("טופלה")}>סמן כטופלה</Button>
                  )}
                  <Separator />
                  <Button className="w-full gap-1 text-sm" onClick={() => setCloseDialog(true)}>
                    <CheckCircle className="w-4 h-4" />סגור קריאה
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Target date editor — admin only */}
          {user?.role === 'admin' && !isClosed && (
            <TargetDateEditor
              ticket={ticket}
              user={user}
              onUpdated={() => queryClient.invalidateQueries({ queryKey: ['ticket', id] })}
            />
          )}

          {/* Add note — all users */}
          {!isClosed && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">הוסף הערה</CardTitle></CardHeader>
              <CardContent>
                <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="כתוב הערה..." rows={3} className="text-sm" />
                <Button size="sm" className="mt-2 w-full gap-1" onClick={handleAddNote} disabled={!noteText.trim()}>
                  <MessageSquare className="w-3.5 h-3.5" />הוסף
                </Button>
              </CardContent>
            </Card>
          )}

          {/* SLA Exclusion — admin only */}
          {user?.role === 'admin' && (
            <Card>
              <CardContent className="pt-4">
                {ticket.sla_excluded ? (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">קריאה מוחרגת ממדידת SLA</p>
                    <p className="text-xs">{ticket.sla_exclusion_reason}</p>
                    <p className="text-xs text-muted-foreground">על ידי: {ticket.sla_excluded_by}</p>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setSlaExclusionOpen(true)}>
                    החרג ממדידת SLA
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Admin: Archive / Delete — admin only */}
          {user?.role === 'admin' && (
            <Card className={ticket.archived ? "border-amber-300 bg-amber-50/40" : ""}>
              <CardContent className="pt-4 space-y-3">
                {ticket.archived ? (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-amber-700">קריאה מאורכבת — מנוטרלת ממדידה</p>
                    {ticket.archive_reason && <p className="text-xs">סיבה: {ticket.archive_reason}</p>}
                    {ticket.archived_by && <p className="text-xs text-muted-foreground">על ידי: {ticket.archived_by}</p>}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">פעולות ניהול נתונים</p>
                )}
                <RecordActionsMenu
                  entityName="ServiceTicket"
                  record={ticket}
                  recordType="ticket"
                  user={user}
                  queryKeys={['ticket', id, 'tickets', 'tickets-sla-report', 'tickets-for-surveys']}
                  onDeleted={() => navigate('/tickets')}
                />
              </CardContent>
            </Card>
          )}

          {/* Customer response */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${ticket.customer_response_sent ? 'bg-green-500' : 'bg-slate-300'}`} />
                <span className="text-sm">{ticket.customer_response_sent ? "הלקוח עודכן" : "הלקוח טרם עודכן"}</span>
              </div>
              {ticket.assigned_to && (
                <p className="text-xs text-muted-foreground">אחראי: {ticket.assigned_to}</p>
              )}
            </CardContent>
          </Card>

          {/* Feedback */}
          {isClosed && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">משוב שירות</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {ticket.feedback_rating ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">{ticket.feedback_rating}/10</span>
                    <span className="text-xs text-muted-foreground">{ticket.feedback_comment || 'ללא הערה'}</span>
                  </div>
                ) : isOwner && !ticket.feedback_rating ? (
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setFeedbackOpen(true)}>
                    <Star className="w-3.5 h-3.5" />דרג את השירות
                  </Button>
                ) : null}

                {/* Send rating request by email — manager only */}
                {isMgr && (
                  <div className="pt-1 border-t">
                    {ticket.feedback_request_sent || feedbackSent ? (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        בקשת דירוג נשלחה ללקוח{ticket.feedback_request_sent_at ? ` · ${format(new Date(ticket.feedback_request_sent_at), "dd/MM HH:mm")}` : ""}
                      </p>
                    ) : (
                      <Button size="sm" className="w-full gap-2 text-xs" onClick={handleSendFeedbackSurvey} disabled={feedbackSending}>
                        {feedbackSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                        שלח בקשה לדירוג במייל
                      </Button>
                    )}
                  </div>
                )}

                {/* Google review — manager only */}
                {isMgr && ticket.created_by && (
                  <div className="pt-1 border-t">
                    {ticket.google_review_request_sent ? (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        בקשת דירוג Google נשלחה
                      </p>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={handleSendGoogleReview} disabled={googleSending || googleSent}>
                        {googleSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                        {googleSent ? 'נשלח!' : 'שלח בקשת דירוג Google'}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* SLA Exclusion dialog — admin only */}
      {user?.role === 'admin' && (
        <SlaExclusionDialog
          ticket={ticket}
          user={user}
          open={slaExclusionOpen}
          onClose={() => setSlaExclusionOpen(false)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['ticket', id] })}
        />
      )}

      {/* Feedback modal */}
      <FeedbackModal
        ticket={ticket}
        user={user}
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSubmitted={() => queryClient.invalidateQueries({ queryKey: ['ticket', id] })}
      />

      {/* Treatment deadline dialog */}
      <Dialog open={treatmentDialogOpen} onOpenChange={setTreatmentDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>התחלת טיפול — התחייבות לסיום</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              לפני העברת הקריאה לסטטוס בטיפול, יש לציין צפי סיום טיפול.
              לא ניתן יהיה לשנות דדליין זה לאחר האישור.
            </p>
            <div className="space-y-1.5">
              <Label>תאריך סיום צפוי *</Label>
              <Input
                type="date"
                value={treatmentDeadlineForm.date}
                onChange={e => setTreatmentDeadlineForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>שעת סיום צפויה *</Label>
              <Input
                type="time"
                value={treatmentDeadlineForm.time}
                onChange={e => setTreatmentDeadlineForm(f => ({ ...f, time: e.target.value }))}
              />
            </div>
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-xs text-orange-800">
              שים לב: לאחר האישור לא ניתן יהיה לעדכן שוב את דדליין סיום הטיפול.
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTreatmentDialogOpen(false)}>ביטול</Button>
            <Button
              onClick={handleStartTreatmentWithDeadline}
              disabled={!treatmentDeadlineForm.date || !treatmentDeadlineForm.time}
            >
              אשר התחלת טיפול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close dialog */}
      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle>סגירת קריאה</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>סיכום טיפול *</Label>
              <Textarea value={closeForm.resolution_summary} onChange={e => setCloseForm(f => ({ ...f, resolution_summary: e.target.value }))} placeholder="תאר את הטיפול שבוצע..." rows={3} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={closeForm.customer_response_sent} onCheckedChange={v => setCloseForm(f => ({ ...f, customer_response_sent: v }))} />
              <Label>הלקוח קיבל מענה *</Label>
            </div>
            <div className="space-y-1.5">
              <Label>תמונת טיפול / קובץ טיפול</Label>
              <AttachmentUploader
                attachments={closeForm.resolution_attachments}
                onChange={v => setCloseForm(f => ({ ...f, resolution_attachments: v }))}
                label="צרף תמונת טיפול"
                helpText="אפשר לצרף תמונה של הטיפול שבוצע. לא חובה."
              />
            </div>
            {isBreach && (
              <div className="space-y-1.5">
                <Label>סיבת חריגת SLA *</Label>
                <Select value={closeForm.sla_breach_reason} onValueChange={v => setCloseForm(f => ({ ...f, sla_breach_reason: v }))}>
                  <SelectTrigger><SelectValue placeholder="בחר סיבה" /></SelectTrigger>
                  <SelectContent>{BREACH_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCloseDialog(false)}>ביטול</Button>
            <Button onClick={handleClose} disabled={!closeForm.resolution_summary || !closeForm.customer_response_sent || (isBreach && !closeForm.sla_breach_reason)}>
              סגור קריאה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, dir }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium" dir={dir}>{value}</p>
      </div>
    </div>
  );
}