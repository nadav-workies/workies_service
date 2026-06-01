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
import { getTimeRemainingLabel, isManagerOrAdmin } from "@/lib/slaUtils";
import { format } from "date-fns";
import { ArrowRight, User, Phone, MapPin, Clock, Shield, MessageSquare, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

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
  const [closeForm, setCloseForm] = useState({ resolution_summary: "", customer_response_sent: false, sla_breach_reason: "" });

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
    updateMutation.mutate({ updates: { status: newStatus }, historyEntry: addHistory(`סטטוס שונה ל: ${newStatus}`) });
  };

  const handleAssign = () => {
    if (!assignName.trim()) return;
    updateMutation.mutate({
      updates: { assigned_to: assignName, status: ticket.status === "פתוחה" ? "שויכה לטיפול" : ticket.status },
      historyEntry: addHistory(`שויכה לטיפול: ${assignName}`)
    });
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
    const isBreach = ticket.sla_deadline && new Date(ticket.sla_deadline) < now;
    if (isBreach && !closeForm.sla_breach_reason) return;
    updateMutation.mutate({
      updates: {
        status: "נסגרה",
        resolution_summary: closeForm.resolution_summary,
        customer_response_sent: true,
        closed_at: now.toISOString(),
        sla_breached: !!isBreach,
        ...(isBreach && { sla_breach_reason: closeForm.sla_breach_reason }),
      },
      historyEntry: addHistory("קריאה נסגרה", closeForm.resolution_summary)
    });
    setCloseDialog(false);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!ticket || !canView) return <div className="text-center py-20 text-muted-foreground">הקריאה לא נמצאה או שאין לך הרשאה לצפות בה</div>;

  const isClosed = ticket.status === "נסגרה";
  const isBreach = !isClosed && ticket.sla_deadline && new Date(ticket.sla_deadline) < new Date();
  const sla = getTimeRemainingLabel(ticket.sla_deadline);

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
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">{ticket.ticket_type || ticket.issue_description}</p>
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
                <InfoRow icon={Clock} label="נפתחה" value={format(new Date(ticket.created_date), "dd/MM/yyyy HH:mm")} />
                {ticket.sla_deadline && (
                  <InfoRow icon={Shield} label="יעד SLA" value={format(new Date(ticket.sla_deadline), "dd/MM/yyyy HH:mm")} />
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
            </CardContent>
          </Card>

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
                <SlaBadge slaDeadline={ticket.sla_deadline} status={ticket.status} />
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

          {/* Customer response */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${ticket.customer_response_sent ? 'bg-green-500' : 'bg-slate-300'}`} />
                <span className="text-sm">{ticket.customer_response_sent ? "הלקוח עודכן" : "הלקוח טרם עודכן"}</span>
              </div>
              {ticket.assigned_to && (
                <p className="text-xs text-muted-foreground mt-2">אחראי: {ticket.assigned_to}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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