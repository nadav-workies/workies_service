import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2, Send, Printer, CheckCircle2 } from "lucide-react";
import { PRINTING_PACKAGES, hasActiveOffice } from "@/lib/printingPackages";
import { generateTicketNumber } from "@/lib/slaUtils";
import { cn } from "@/lib/utils";

export default function PrintingPackageForm({ user, onBack }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [addToMonthlyAccount, setAddToMonthlyAccount] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);
  const [notes, setNotes] = useState("");

  const { data: roomTenants = [] } = useQuery({
    queryKey: ['printing-tenants', user?.default_room_number],
    queryFn: () => base44.entities.RoomTenant.filter(
      { room_number: String(user?.default_room_number), matched_room: true },
      '-created_date', 10
    ),
    enabled: !!user?.default_room_number,
    staleTime: 60000,
  });

  const tenant = roomTenants[0] || null;
  const hasOffice = hasActiveOffice(user, tenant);
  const billingMethod = hasOffice && addToMonthlyAccount ? "monthly_account" : "manual_payment";

  const mutation = useMutation({
    mutationFn: async () => {
      const pkg = PRINTING_PACKAGES.find(p => p.id === selectedPackage);
      const openedAtDate = new Date();
      const ticketNumber = generateTicketNumber();
      const customerName = tenant?.customer_name || user?.full_name || "";
      const roomNumber = user?.default_room_number || tenant?.room_number || "";
      const roomLabel = user?.default_room_label || tenant?.room_label || "";
      const phone = tenant?.phone || "";
      const email = tenant?.email || user?.email || "";

      const initialStatus = billingMethod === "monthly_account" ? "ממתין לחיוב" : "ממתין לתשלום";

      const ticket = await base44.entities.ServiceTicket.create({
        ticket_number: ticketNumber,
        ticket_type: "עדכון חבילת הדפסה",
        request_type: "printing_package_update",
        is_printing_package_request: true,
        exclude_from_sla: true,
        printing_package_id: pkg.id,
        printing_package_name: pkg.name,
        printing_package_payment_amount: pkg.payment_amount,
        printing_package_credit_value: pkg.credit_value,
        printing_package_bw_pages: pkg.bw_pages,
        printing_package_color_pages: pkg.color_pages,
        printing_billing_method: billingMethod,
        printing_customer_acknowledged: true,
        printing_customer_notes: notes || "",
        customer_name: customerName,
        room_number: String(roomNumber),
        room_label: roomLabel,
        phone,
        email,
        issue_description: `בקשת חבילת הדפסה: ${pkg.name} (${pkg.payment_amount} ₪)`,
        area: "אחר",
        priority: "רגילה",
        status: initialStatus,
        opened_at: openedAtDate.toISOString(),
        opened_at_ms: openedAtDate.getTime(),
        sla_minutes: null,
        sla_label: "ללא SLA",
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
          note: pkg.name,
        }],
      });

      base44.functions.invoke('ticketNotifications', {
        action: 'ticket_created',
        ticket,
      }).catch(() => {});

      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      navigate("/");
    },
  });

  const canSubmit = selectedPackage && acknowledged && !mutation.isPending;

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
                      <p className="font-bold text-lg">{pkg.payment_amount} ₪</p>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      שווי לפני מע״מ: ₪{pkg.credit_value.toFixed(1)}
                    </p>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-[11px] text-muted-foreground">
                        שחור-לבן: {pkg.bw_pages} דפים
                      </p>
                      {pkg.color_pages > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          צבעוני: {pkg.color_pages} דפים
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