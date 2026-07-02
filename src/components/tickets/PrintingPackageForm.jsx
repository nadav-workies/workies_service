import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2, Send, Printer, CheckCircle2, Building2, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRINTING_PACKAGES, hasActiveOffice } from "@/lib/printingPackages";
import { WORKIES_ROOMS } from "@/lib/workiesRooms";
import { generateTicketNumber } from "@/lib/slaUtils";
import {
  calculateSlaDeadlineWithinServiceHours,
  isWithinServiceHours,
} from "@/lib/slaAgent";
import { calculateSlaWarningAtMs } from "@/lib/slaUtils";
import { cn } from "@/lib/utils";

const PRINTING_SLA_MINUTES = 5;

export default function PrintingPackageForm({ user, onBack }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [addToMonthlyAccount, setAddToMonthlyAccount] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);
  const [notes, setNotes] = useState("");
  const [manualRoomNumber, setManualRoomNumber] = useState("");
  const [submittedTicket, setSubmittedTicket] = useState(null);

  const autoRoomNumber = user?.default_room_number || user?.room_number || "";

  const { data: roomTenants = [], isLoading: tenantsLoading } = useQuery({
    queryKey: ['printing-tenants', autoRoomNumber],
    queryFn: () => base44.entities.RoomTenant.filter(
      { room_number: String(autoRoomNumber), matched_room: true },
      '-created_date', 10
    ),
    enabled: !!autoRoomNumber,
    staleTime: 60000,
  });

  const tenant = roomTenants[0] || null;
  const hasOffice = hasActiveOffice(user, tenant);

  // ─── Room resolution: auto-detected or manually selected ───
  const resolvedRoomNumber = autoRoomNumber || manualRoomNumber;
  const resolvedRoom = WORKIES_ROOMS.find(r => r.room_number === String(resolvedRoomNumber)) || null;
  const resolvedRoomLabel = resolvedRoom?.room_label
    || user?.default_room_label
    || tenant?.room_label
    || "";
  const roomAutoIdentified = !!autoRoomNumber;
  const roomSelectionNeeded = !roomAutoIdentified;
  const billingMethod = hasOffice && addToMonthlyAccount ? "monthly_account" : "manual_payment";

  const mutation = useMutation({
    mutationFn: async () => {
      const pkg = PRINTING_PACKAGES.find(p => p.id === selectedPackage);
      const openedAtDate = new Date();
      const ticketNumber = generateTicketNumber();
      const customerName = tenant?.customer_name || user?.full_name || "";
      const roomNumber = resolvedRoomNumber;
      const roomCode = user?.room_code || tenant?.room_code || "";
      const roomLabel = resolvedRoomLabel || roomCode || roomNumber || "";
      const phone = tenant?.phone || "";
      const email = tenant?.email || user?.email || "";

      const initialStatus = "ממתין לטעינת חבילת הדפסה";
      const billingLabel = billingMethod === "monthly_account"
        ? "הוספה לחשבון השכירות החודשי"
        : "תשלום ידני מול הלקוח";
      const roomDisplay = roomLabel || roomNumber || roomCode || "לא משויך לחדר";

      // ─── SLA calculation: 5 minutes within service hours ───
      const slaMin = PRINTING_SLA_MINUTES;
      const { slaStart, slaDeadline } = calculateSlaDeadlineWithinServiceHours(openedAtDate, slaMin);
      const slaStartAtMs = slaStart.getTime();
      const slaDeadlineMs = slaDeadline.getTime();
      const slaWarningAtMs = calculateSlaWarningAtMs(slaStartAtMs, slaMin);

      const requestSummary = `בקשה לטעינת חבילת הדפסה

לקוח: ${customerName}
מייל: ${email}
טלפון: ${phone}
חדר: ${roomDisplay}
חבילה: ${pkg.title || pkg.credit_value + ' קרדיטים'}
עלות לתשלום: ₪${pkg.payment_amount} כולל מע״מ
קרדיטים: ${pkg.credit_value}
אופן חיוב: ${billingLabel}
הערות לקוח: ${notes || "אין"}`;

      const ticket = await base44.entities.ServiceTicket.create({
        ticket_number: ticketNumber,
        ticket_type: "עדכון חבילת הדפסה",
        request_type: "printing_package_update",
        is_printing_package_request: true,
        exclude_from_sla: false,
        no_sla: false,
        printing_package_id: pkg.id,
        printing_package_name: pkg.title || `${pkg.credit_value} קרדיטים`,
        printing_package_payment_amount: pkg.payment_amount,
        printing_package_credit_value: pkg.credit_value,
        printing_package_bw_pages: pkg.bw_pages,
        printing_package_color_pages: pkg.color_pages,
        printing_billing_method: billingMethod,
        printing_customer_acknowledged: true,
        printing_customer_notes: notes || "",
        customer_name: customerName,
        room_number: String(roomNumber) || null,
        room_label: roomLabel || null,
        room_area: tenant?.room_area || user?.default_room_area || "",
        location_type: (roomNumber || roomCode) ? "room" : "none",
        phone,
        email,
        issue_description: requestSummary,
        internal_notes: roomCode ? `קוד משרד: ${roomCode}` : "",
        notes: notes || "",
        area: "אחר",
        priority: "קריטית",
        status: initialStatus,
        opened_at: openedAtDate.toISOString(),
        opened_at_ms: openedAtDate.getTime(),
        sla_minutes: slaMin,
        sla_label: "5 דקות",
        sla_start_at: slaStart.toISOString(),
        sla_start_at_ms: slaStartAtMs,
        sla_deadline: slaDeadline.toISOString(),
        sla_deadline_ms: slaDeadlineMs,
        sla_warning_at: new Date(slaWarningAtMs).toISOString(),
        sla_warning_at_ms: slaWarningAtMs,
        sla_breached: false,
        exclude_from_metrics: false,
        customer_response_sent: false,
        manager_alert_sent: false,
        source_system: "Base44-ServiceTickets",
        aio_ready: true,
        created_by: user?.email || "",
        created_by_id: user?.id || "",
        created_by_name: user?.full_name || "",
        update_history: [{
          date: openedAtDate.toISOString(),
          action: "בקשת חבילת הדפסה נפתחה",
          user: user?.full_name || "מערכת",
          note: pkg.title || `${pkg.credit_value} קרדיטים`,
        }],
      });

      base44.functions.invoke('ticketNotifications', {
        action: 'ticket_created',
        ticket,
      }).catch(() => {});

      return ticket;
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      setSubmittedTicket(ticket);
    },
  });

  const canSubmit = selectedPackage && acknowledged && !!resolvedRoomNumber && !mutation.isPending;

  // ─── Success screen ───
  if (submittedTicket) {
    return (
      <div className="max-w-2xl mx-auto" dir="rtl">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-green-800">בקשתך נמצאת בטיפול בשירות</h2>
              <p className="text-sm text-muted-foreground">
                בדקות הקרובות יתווספו הקרדיטים לחשבונך.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 bg-white border border-green-200 rounded-lg px-4 py-2">
              <span className="text-xs text-muted-foreground">מספר קריאה:</span>
              <span className="font-mono font-bold text-sm text-green-800">{submittedTicket.ticket_number}</span>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <Button onClick={() => navigate("/")}>חזרה לדשבורד</Button>
              <Button variant="outline" onClick={() => navigate(`/tickets/${submittedTicket.id}`)}>צפה בקריאה</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />חזרה
      </button>

      <div className="space-y-4">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <Printer className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold">עדכון חבילת הדפסה</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              בחר חבילת הדפסות לטעינה. הבקשה תועבר לטיפול שירות / גבייה.
            </p>
          </CardContent>
        </Card>

        {/* ─── Room association: auto-detected or manual selection ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              חדר / משרד מבקש השירות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roomAutoIdentified ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                <MapPin className="w-4 h-4 text-green-600 shrink-0" />
                <div className="text-sm">
                  <span className="font-semibold text-green-800">
                    {resolvedRoomLabel || resolvedRoomNumber}
                  </span>
                  <span className="text-green-600 text-xs mr-2">— זוהה אוטומטית</span>
                </div>
              </div>
            ) : roomSelectionNeeded ? (
              <div className="space-y-2">
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  לא זוהה חדר אוטומטית. נדרש לבחור חדר מהרשימה כדי לשייך את הבקשה.
                </p>
                <Select value={manualRoomNumber} onValueChange={setManualRoomNumber}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="בחר חדר / משרד מהרשימה..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {WORKIES_ROOMS.map(room => (
                      <SelectItem key={room.room_number} value={room.room_number}>
                        {room.room_number} — {room.room_label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {manualRoomNumber && resolvedRoom && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium">{resolvedRoom.room_label}</span>
                    <span className="text-xs text-muted-foreground">({resolvedRoom.room_area})</span>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">בחר חבילה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {PRINTING_PACKAGES.map(pkg => {
                const isSelected = selectedPackage === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={cn(
                      "text-right p-4 rounded-lg border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-lg">{pkg.title || `${pkg.credit_value} קרדיטים`}</p>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-xs mt-1 font-medium text-foreground">
                      עלות לתשלום: ₪{pkg.payment_amount} כולל מע״מ
                    </p>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-[11px] text-muted-foreground">
                        עד {pkg.bw_pages.toLocaleString()} הדפסות שחור־לבן
                      </p>
                      {pkg.color_pages > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          עד {pkg.color_pages.toLocaleString()} הדפסות צבעוניות
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold">אופן תשלום</p>
              {hasOffice ? (
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addToMonthlyAccount}
                    onChange={e => setAddToMonthlyAccount(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-muted-foreground">
                    חיוב בחשבון השכירות החודשי
                    {tenant?.customer_name && ` (${tenant.customer_name})`}
                  </span>
                </label>
              ) : (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  תשלום ידני — לא זוהה משרד פעיל. נציג שירות ייצור איתך קשר לתיאום תשלום.
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                אופן תשלום נבחר: {billingMethod === "monthly_account" ? "חיוב חודשי" : "תשלום ידני"}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">הערות (לא חובה)</label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="הערות נוספות לבקשה"
                rows={2}
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={e => setAcknowledged(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-sm text-muted-foreground">
                אני מאשר/ת את הבקשה ומודע/ת לעלות החבילה ולתנאי התשלום.
              </span>
            </label>

            <div className="flex gap-3 pt-1">
              <Button
                onClick={() => mutation.mutate()}
                disabled={!canSubmit}
                className="gap-2"
              >
                {mutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />שולח...</>
                ) : (
                  <><Send className="w-4 h-4" />שלח בקשה</>
                )}
              </Button>
              <Button variant="outline" onClick={onBack}>ביטול</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}