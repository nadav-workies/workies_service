import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Copy, MessageCircle, CheckCircle2, XCircle, Pencil, Loader2, ExternalLink, ClipboardList } from "lucide-react";
import { ORDER_STATUS, TIME_SLOTS, formatDate, money, orderLink } from "@/lib/catering";

const waPhone = (p) => { let d = String(p || "").replace(/\D/g, ""); if (d.startsWith("0")) d = "972" + d.slice(1); return d; };

export function whatsappInvite(order) {
  const name = order.contact_name ? ` ${order.contact_name}` : "";
  const text = `היי${name}, כאן Workies 🙂\nמצרפים קישור להרכבת הזמנת ההסעדה לאירוע${order.event_name ? ` "${order.event_name}"` : ""}${order.event_date ? ` ב-${formatDate(order.event_date)}` : ""}.\nבוחרים מתוך הספקים שלנו, שולחים, ואנחנו מאשרים מולכם:\n${orderLink(order.token)}`;
  const phone = waPhone(order.contact_phone);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

// Text summary per supplier, ready to paste to the supplier
function supplierSummary(order) {
  const bySup = {};
  for (const l of order.lines || []) if (l.pricing_model !== "delivery") (bySup[l.supplier_name] ||= []).push(l);
  return Object.entries(bySup).map(([sup, lines]) => [
    `*${sup}* · הזמנה ${order.order_number}`,
    `${order.company || ""} · ${formatDate(order.event_date)} ${order.event_time || TIME_SLOTS[order.time_slot] || ""}`,
    ...lines.map((l) => `• ${l.item_name} × ${l.quantity}${l.note ? ` (${l.note})` : ""}`),
    order.dietary_notes ? `תזונה ואלרגיות: ${order.dietary_notes}` : "",
  ].filter(Boolean).join("\n")).join("\n\n");
}

export default function OrderDetailDialog({ order, open, onOpenChange, user, onChanged, onEdit }) {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState("");

  useEffect(() => { if (order) setNotes(order.internal_notes || ""); }, [order]);
  if (!order) return null;
  const status = ORDER_STATUS[order.status] || ORDER_STATUS.link_created;
  const who = user?.full_name || user?.email || "";

  const copy = async (text, msg) => { await navigator.clipboard.writeText(text); toast({ title: msg }); };

  async function update(data, action) {
    setBusy(action);
    try {
      const saved = await base44.entities.CateringOrder.update(order.id, { ...data, history: [...(order.history || []), { date: new Date().toISOString(), action, user: who }] });
      onChanged(saved);
    } finally { setBusy(""); }
  }

  async function approve() {
    setBusy("approve");
    try {
      const { data } = await base44.functions.invoke("cateringOrder", { action: "approve", order_id: order.id, notify_customer: notify });
      if (!data?.ok) throw new Error(data?.error);
      const fresh = await base44.entities.CateringOrder.get(order.id);
      onChanged(fresh);
      toast({ title: notify ? "ההזמנה אושרה ונשלח מייל ללקוח" : "ההזמנה אושרה" });
    } catch (e) {
      toast({ title: "האישור נכשל", description: e?.response?.data?.error || e.message, variant: "destructive" });
    } finally { setBusy(""); }
  }

  const markSent = () => update({ link_sent_at: new Date().toISOString() }, "הקישור נשלח ללקוח");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {order.company || "הזמנת הסעדה"} <span className="text-muted-foreground font-normal text-sm">{order.order_number}</span>
            <span className={`text-xs rounded-full px-2 py-0.5 ${status.className}`}>{status.label}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm rounded-xl bg-muted/50 p-3">
          <div><p className="text-xs text-muted-foreground">אירוע</p><p className="font-medium">{order.event_name || "-"}</p></div>
          <div><p className="text-xs text-muted-foreground">תאריך ושעה</p><p className="font-medium">{formatDate(order.event_date)} {order.event_time || TIME_SLOTS[order.time_slot] || ""}</p></div>
          <div><p className="text-xs text-muted-foreground">משתתפים</p><p className="font-medium">{order.guests_count || "-"}</p></div>
          <div><p className="text-xs text-muted-foreground">איש קשר</p><p className="font-medium">{order.contact_name || "-"}</p><p dir="ltr" className="text-xs text-right">{order.contact_phone}</p></div>
          <div><p className="text-xs text-muted-foreground">חדר / חלל</p><p className="font-medium">{order.location || "-"}</p></div>
          <div><p className="text-xs text-muted-foreground">הסכם ב-AIO</p><p className="font-medium" dir="ltr">{order.aio_agreement_ref || "-"}</p></div>
        </div>

        {/* Link actions */}
        {order.status !== "cancelled" && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => copy(orderLink(order.token), "הקישור הועתק")}><Copy className="w-3.5 h-3.5" />העתקת קישור</Button>
            {order.contact_phone && <Button size="sm" variant="outline" className="gap-1.5" asChild><a href={whatsappInvite(order)} target="_blank" rel="noreferrer" onClick={() => !order.link_sent_at && markSent()}><MessageCircle className="w-3.5 h-3.5" />שליחה בוואטסאפ</a></Button>}
            <Button size="sm" variant="ghost" className="gap-1.5" asChild><a href={orderLink(order.token)} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5" />תצוגת לקוח</a></Button>
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={onEdit}><Pencil className="w-3.5 h-3.5" />עריכת פרטים</Button>
          </div>
        )}

        {/* Lines */}
        <section>
          <h3 className="font-semibold text-sm mb-1">שורות ההזמנה</h3>
          {(order.lines || []).length === 0 ? <p className="text-sm text-muted-foreground">הלקוח עוד לא שלח הזמנה.</p> : (
            <>
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-muted-foreground border-b"><th className="text-right py-1.5">ספק</th><th className="text-right">פריט</th><th>כמות</th><th className="text-right">מחיר</th><th className="text-right">סה"כ</th></tr></thead>
                <tbody>
                  {order.lines.map((l) => (
                    <tr key={l.line_id} className="border-b last:border-0 align-top">
                      <td className="py-1.5">{l.supplier_name}</td>
                      <td>{l.item_name}{l.note && <p className="text-xs text-muted-foreground">{l.note}</p>}</td>
                      <td className="text-center">{l.quantity}</td>
                      <td>{money(l.unit_price)}</td>
                      <td className="font-medium">{money(l.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between font-bold border-t mt-1 pt-2"><span>סה"כ ללקוח</span><span>{money(order.total)}</span></div>
              <Button size="sm" variant="outline" className="gap-1.5 mt-2" onClick={() => copy(supplierSummary(order), "הסיכום לספקים הועתק")}><ClipboardList className="w-3.5 h-3.5" />העתקת סיכום לספקים</Button>
            </>
          )}
          {order.dietary_notes && <p className="text-sm mt-2"><b>תזונה ואלרגיות:</b> {order.dietary_notes}</p>}
          {order.customer_notes && <p className="text-sm mt-1"><b>הערות הלקוח:</b> {order.customer_notes}</p>}
        </section>

        {/* Approve */}
        {order.status === "submitted" && (
          <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-2">
            <p className="text-sm font-semibold">ההזמנה ממתינה לאישור שלך</p>
            <label className="flex items-center gap-2 text-sm"><Switch checked={notify} onCheckedChange={setNotify} />שליחת מייל אישור ללקוח{!order.contact_email && <span className="text-xs text-muted-foreground">(אין אימייל)</span>}</label>
            <Button className="gap-2" onClick={approve} disabled={!!busy}>{busy === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}אישור ההזמנה</Button>
          </section>
        )}

        {/* Internal notes */}
        <section className="space-y-1.5">
          <h3 className="font-semibold text-sm">הערות פנימיות</h3>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="לא מוצג ללקוח" />
          {notes !== (order.internal_notes || "") && <Button size="sm" onClick={() => update({ internal_notes: notes }, "עודכנו הערות פנימיות")} disabled={!!busy}>שמירת הערות</Button>}
        </section>

        {/* History */}
        <section>
          <h3 className="font-semibold text-sm mb-1">היסטוריה</h3>
          <ul className="space-y-1 text-xs">
            {[...(order.history || [])].reverse().map((h, i) => (
              <li key={i} className="flex gap-2"><span className="text-muted-foreground shrink-0">{new Date(h.date).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" })}</span><span>{h.action}{h.user ? ` · ${h.user}` : ""}{h.note ? ` · ${h.note}` : ""}</span></li>
            ))}
          </ul>
        </section>

        {["link_created", "submitted"].includes(order.status) && (
          <div className="pt-2 border-t">
            <Button size="sm" variant="ghost" className="gap-1.5 text-destructive" onClick={() => update({ status: "cancelled" }, "ההזמנה בוטלה")} disabled={!!busy}><XCircle className="w-3.5 h-3.5" />ביטול ההזמנה והקישור</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
