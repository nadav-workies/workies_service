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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { StatusBadge, UrgencyBadge, SlaBadge } from "@/components/tickets/TicketStatusBadge";
import { getTimeRemaining } from "@/lib/slaUtils";
import { format } from "date-fns";
import {
  ArrowRight, User, Phone, MapPin, Clock, Shield,
  MessageSquare, Loader2, CheckCircle, AlertTriangle
} from "lucide-react";

const STATUSES = ["פתוחה", "שויכה לטיפול", "בטיפול", "ממתינה", "טופלה", "נסגרה"];
const BREACH_REASONS = ["ממתין לספק", "חוסר בחלקים", "לא אותר הלקוח", "טיפול נדחה", "תקלה מורכבת", "עומס תפעולי", "אחר"];

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");
  const [closeDialog, setCloseDialog] = useState(false);
  const [closeForm, setCloseForm] = useState({ resolution_summary: "", client_notified: false, sla_breach_reason: "" });

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => base44.entities.ServiceTicket.filter({ id }),
    select: (data) => data[0],
  });

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

  const handleStatusChange = (newStatus) => {
    if (newStatus === "נסגרה") {
      setCloseDialog(true);
      return;
    }
    updateMutation.mutate({
      updates: { status: newStatus },
      historyEntry: { date: new Date().toISOString(), action: `סטטוס שונה ל: ${newStatus}`, user: "מנהל", note: "" }
    });
  };

  const handleAssign = (name) => {
    updateMutation.mutate({
      updates: { assigned_to: name, status: ticket.status === "פתוחה" ? "שויכה לטיפול" : ticket.status },
      historyEntry: { date: new Date().toISOString(), action: `שויכה לטיפול: ${name}`, user: "מנהל", note: "" }
    });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    updateMutation.mutate({
      updates: {},
      historyEntry: { date: new Date().toISOString(), action: "הערה חדשה", user: "מנהל", note: noteText }
    });
    setNoteText("");
  };

  const handleClose = () => {
    if (!closeForm.resolution_summary || !closeForm.client_notified) return;

    const now = new Date();
    const isBreach = new Date(ticket.sla_target) < now;
    
    if (isBreach && !closeForm.sla_breach_reason) return;

    updateMutation.mutate({
      updates: {
        status: "נסגרה",
        resolution_summary: closeForm.resolution_summary,
        client_notified: true,
        closed_date: now.toISOString(),
        sla_breached: isBreach,
        ...(isBreach && { sla_breach_reason: closeForm.sla_breach_reason }),
      },
      historyEntry: { date: now.toISOString(), action: "קריאה נסגרה", user: "מנהל", note: closeForm.resolution_summary }
    });
    setCloseDialog(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!ticket) {
    return <div className="text-center py-20 text-muted-foreground">הקריאה לא נמצאה</div>;
  }

  const slaRemaining = getTimeRemaining(ticket.sla_target);
  const isClosed = ticket.status === "נסגרה";
  const isBreach = !isClosed && new Date(ticket.sla_target) < new Date();

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowRight className="w-4 h-4" />
        חזרה
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{ticket.ticket_number}</h1>
            <StatusBadge status={ticket.status} />
            <UrgencyBadge urgency={ticket.urgency} />
          </div>
          <p className="text-muted-foreground mt-1">{ticket.issue_description}</p>
        </div>
        {!isClosed && (
          <div className="flex gap-2 flex-wrap">
            <Select onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="שנה סטטוס" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.filter(s => s !== ticket.status).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">פרטי הקריאה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={User} label="לקוח" value={ticket.client_name} />
                <InfoRow icon={MapPin} label="חדר" value={ticket.room_number} />
                <InfoRow icon={Phone} label="טלפון" value={ticket.phone_number} dir="ltr" />
                <InfoRow icon={MapPin} label="אזור" value={ticket.fault_area} />
                <InfoRow icon={Clock} label="נפתחה" value={format(new Date(ticket.created_date), "dd/MM/yyyy HH:mm")} />
                <InfoRow icon={Shield} label="SLA יעד" value={format(new Date(ticket.sla_target), "dd/MM/yyyy HH:mm")} />
              </div>
              {ticket.notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">הערות</p>
                  <p className="text-sm">{ticket.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SLA Status */}
          <Card className={isBreach ? "border-red-300 bg-red-50/50" : ""}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isBreach ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : isClosed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-primary" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{isClosed ? "הקריאה נסגרה" : isBreach ? "חריגת SLA" : "זמן שנותר"}</p>
                    <p className={`text-lg font-bold ${isBreach ? "text-red-600" : isClosed ? "text-green-600" : ""}`}>
                      {isClosed ? format(new Date(ticket.closed_date), "dd/MM/yyyy HH:mm") : slaRemaining.text}
                    </p>
                  </div>
                </div>
                <SlaBadge slaTarget={ticket.sla_target} status={ticket.status} />
              </div>
            </CardContent>
          </Card>

          {/* Resolution */}
          {ticket.resolution_summary && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-green-800">סיכום טיפול</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{ticket.resolution_summary}</p>
                {ticket.sla_breached && ticket.sla_breach_reason && (
                  <p className="text-xs text-red-600 mt-2">סיבת חריגה: {ticket.sla_breach_reason}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">היסטוריית עדכונים</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.update_history?.length > 0 ? (
                <div className="space-y-3">
                  {[...ticket.update_history].reverse().map((entry, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{entry.action}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.date), "dd/MM HH:mm")}
                          </span>
                        </div>
                        {entry.note && <p className="text-sm text-muted-foreground mt-0.5">{entry.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">אין היסטוריה</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Assign */}
          {!isClosed && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">שיוך אחראי טיפול</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="שם אחראי"
                    defaultValue={ticket.assigned_to || ""}
                    id="assignInput"
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const el = document.getElementById("assignInput");
                      if (el?.value) handleAssign(el.value);
                    }}
                  >
                    שייך
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add note */}
          {!isClosed && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">הוסף הערה</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="כתוב הערה..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <Button size="sm" className="mt-2 w-full gap-1" onClick={handleAddNote} disabled={!noteText.trim()}>
                  <MessageSquare className="w-3.5 h-3.5" />
                  הוסף
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          {!isClosed && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">פעולות מהירות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ticket.status !== "בטיפול" && (
                  <Button variant="outline" className="w-full text-sm justify-start" onClick={() => handleStatusChange("בטיפול")}>
                    סמן כבטיפול
                  </Button>
                )}
                {ticket.status !== "טופלה" && (
                  <Button variant="outline" className="w-full text-sm justify-start" onClick={() => handleStatusChange("טופלה")}>
                    סמן כטופלה
                  </Button>
                )}
                <Separator />
                <Button className="w-full text-sm gap-1" onClick={() => setCloseDialog(true)}>
                  <CheckCircle className="w-4 h-4" />
                  סגור קריאה
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Client info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">מענה ללקוח</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${ticket.client_notified ? 'bg-green-500' : 'bg-red-400'}`} />
                <span className="text-sm">{ticket.client_notified ? "הלקוח עודכן" : "הלקוח טרם עודכן"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Close dialog */}
      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>סגירת קריאת שירות</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>סיכום טיפול *</Label>
              <Textarea
                value={closeForm.resolution_summary}
                onChange={e => setCloseForm(f => ({ ...f, resolution_summary: e.target.value }))}
                placeholder="תאר את הטיפול שבוצע..."
                rows={4}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={closeForm.client_notified}
                onCheckedChange={v => setCloseForm(f => ({ ...f, client_notified: v }))}
              />
              <Label>הלקוח קיבל מענה *</Label>
            </div>
            {new Date(ticket.sla_target) < new Date() && (
              <div className="space-y-1.5">
                <Label>סיבת חריגת SLA *</Label>
                <Select value={closeForm.sla_breach_reason} onValueChange={v => setCloseForm(f => ({ ...f, sla_breach_reason: v }))}>
                  <SelectTrigger><SelectValue placeholder="בחר סיבה" /></SelectTrigger>
                  <SelectContent>
                    {BREACH_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCloseDialog(false)}>ביטול</Button>
            <Button
              onClick={handleClose}
              disabled={!closeForm.resolution_summary || !closeForm.client_notified || (new Date(ticket.sla_target) < new Date() && !closeForm.sla_breach_reason)}
            >
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
    <div className="flex items-center gap-2.5">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium" dir={dir}>{value}</p>
      </div>
    </div>
  );
}