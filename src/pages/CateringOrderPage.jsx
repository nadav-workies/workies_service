import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarDays, Clock, Users, MapPin, Loader2, CheckCircle2, ShieldCheck, ShoppingBag, Truck, Pencil, AlertCircle } from "lucide-react";
import MenuCard from "@/components/catering/MenuCard";
import { TIME_SLOTS, estimate, formatDate, lineKey, money } from "@/lib/catering";

const errorText = (e) => e?.response?.data?.error || e?.data?.error || "אירעה שגיאה. נסו שוב בעוד רגע.";

// Public catering order page, opened from the personal link Sali sends to the event customer.
export default function CateringOrderPage() {
  const { token } = useParams();
  const [state, setState] = useState("loading"); // loading | invalid | ready
  const [order, setOrder] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [editable, setEditable] = useState(false);
  const [mode, setMode] = useState("build"); // build | done
  const [activeSupplier, setActiveSupplier] = useState(null);
  const [kosherOnly, setKosherOnly] = useState(false);
  const [cart, setCart] = useState({});
  const [form, setForm] = useState({ contact_name: "", contact_phone: "", contact_email: "", guests_count: "", dietary_notes: "", customer_notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const summaryRef = useRef(null);

  useEffect(() => {
    document.title = "הזמנת הסעדה | Workies";
    base44.functions.invoke("cateringOrder", { action: "load", token })
      .then(({ data }) => {
        if (!data?.ok) { setState("invalid"); return; }
        const o = data.order;
        setOrder(o);
        setSuppliers(data.suppliers || []);
        setEditable(data.editable);
        setActiveSupplier(data.suppliers?.[0]?.id || null);
        setForm({
          contact_name: o.contact_name || "", contact_phone: o.contact_phone || "", contact_email: o.contact_email || "",
          guests_count: o.guests_count || "", dietary_notes: o.dietary_notes || "", customer_notes: o.customer_notes || "",
        });
        const c = {};
        for (const l of o.lines || []) if (l.pricing_model !== "delivery") c[lineKey(l.menu_id, l.pricing_model === "itemized" ? l.item_id : null)] = { menu_id: l.menu_id, item_id: l.pricing_model === "itemized" ? l.item_id : "", quantity: l.quantity, note: l.note || "" };
        setCart(c);
        setMode(o.status === "link_created" ? "build" : "done");
        setState("ready");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  const guests = Number(form.guests_count) || 0;
  const visible = useMemo(() => suppliers.filter((s) => !kosherOnly || s.is_kosher), [suppliers, kosherOnly]);
  const current = visible.find((s) => s.id === activeSupplier) || visible[0];
  const est = useMemo(() => estimate(cart, suppliers), [cart, suppliers]);

  const setQty = (menu, item, quantity) => {
    const key = lineKey(menu.id, item?.id);
    setCart((c) => {
      const next = { ...c };
      if (quantity > 0) next[key] = { menu_id: menu.id, item_id: item?.id || "", quantity, note: c[key]?.note || "" };
      else delete next[key];
      return next;
    });
  };

  // Lines for the summary, grouped by supplier
  const grouped = useMemo(() => {
    const out = [];
    for (const s of suppliers) {
      const rows = [];
      for (const m of s.menus) {
        if (m.pricing_model === "per_person") {
          const l = cart[lineKey(m.id)];
          if (l) rows.push({ key: lineKey(m.id), name: `${m.name} · לסועד`, qty: l.quantity, total: l.quantity * (m.price_per_diner || 0) });
        } else for (const i of m.items) {
          const l = cart[lineKey(m.id, i.id)];
          if (l) rows.push({ key: lineKey(m.id, i.id), name: i.name, qty: l.quantity, total: l.quantity * (i.price || 0) });
        }
      }
      if (rows.length) out.push({ supplier: s, rows });
    }
    return out;
  }, [cart, suppliers]);

  async function submit() {
    setError("");
    if (!form.contact_name.trim() || !form.contact_phone.trim()) { setError("נא למלא שם וטלפון של איש הקשר"); return; }
    if (!est.count) { setError("ההזמנה ריקה. בחרו לפחות פריט אחד."); return; }
    setSubmitting(true);
    try {
      const { data } = await base44.functions.invoke("cateringOrder", { action: "submit", token, ...form, lines: Object.values(cart) });
      if (!data?.ok) throw { data };
      setOrder(data.order);
      setMode("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { setError(errorText(e)); }
    finally { setSubmitting(false); }
  }

  if (state === "loading") return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-7 h-7 animate-spin text-primary" aria-label="טוענים" /></div>;
  if (state === "invalid") return (
    <main dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-4">
      <section className="max-w-md w-full rounded-2xl border bg-card p-8 text-center space-y-2">
        <p className="text-lg font-black tracking-wide text-primary">WORKIES</p>
        <h1 className="text-xl font-bold">הקישור אינו תקין</h1>
        <p className="text-sm text-muted-foreground">ייתכן שהקישור הועתק באופן חלקי או שבוטל. אפשר לפנות לנציג Workies ונשמח לעזור.</p>
      </section>
    </main>
  );

  const header = (
    <header className="bg-sidebar text-sidebar-foreground">
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-8">
        <p className="text-sm font-black tracking-[0.2em] text-primary">WORKIES</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">{order.event_name || "הזמנת הסעדה לאירוע"}</h1>
        {order.company && <p className="text-sidebar-foreground/70 mt-1">{order.company}</p>}
        <div className="flex flex-wrap gap-2 mt-4 text-sm">
          {order.event_date && <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1"><CalendarDays className="w-4 h-4 text-primary" />{formatDate(order.event_date)}</span>}
          {(order.event_time || order.time_slot) && <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1"><Clock className="w-4 h-4 text-primary" />{order.event_time || TIME_SLOTS[order.time_slot]}</span>}
          {guests > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1"><Users className="w-4 h-4 text-primary" />{guests} משתתפים</span>}
          {order.location && <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1"><MapPin className="w-4 h-4 text-primary" />{order.location}</span>}
        </div>
      </div>
    </header>
  );

  // Submitted / approved view
  if (mode === "done") {
    const approved = order.status === "approved";
    return (
      <main dir="rtl" lang="he" className="min-h-screen bg-background pb-12">
        {header}
        <div className="max-w-3xl mx-auto px-4 -mt-4 space-y-4">
          <section className="rounded-2xl border bg-card p-6 text-center space-y-2 shadow-sm">
            <CheckCircle2 className={`w-12 h-12 mx-auto ${approved ? "text-emerald-500" : "text-primary"}`} />
            <h2 className="text-xl font-bold">{approved ? "ההזמנה אושרה" : "תודה! ההזמנה התקבלה"}</h2>
            <p className="text-sm text-muted-foreground">
              {approved ? "ההזמנה אושרה על ידי צוות Workies. לשינויים אפשר לפנות לנציג שלכם." : "נציג Workies יעבור על ההזמנה ויחזור אליכם לאישור. עד האישור אפשר לעדכן אותה כאן."}
            </p>
            {!approved && editable && <Button variant="outline" className="gap-2 mt-2" onClick={() => setMode("build")}><Pencil className="w-4 h-4" />עדכון ההזמנה</Button>}
          </section>
          <section className="rounded-2xl border bg-card p-5">
            <h3 className="font-bold mb-3">סיכום ההזמנה {order.order_number && <span className="text-muted-foreground font-normal text-sm">· {order.order_number}</span>}</h3>
            <ul className="divide-y text-sm">
              {(order.lines || []).map((l) => (
                <li key={l.line_id} className="py-2 flex justify-between gap-3">
                  <span><span className="text-muted-foreground">{l.supplier_name} · </span>{l.item_name}{l.pricing_model !== "delivery" && <span className="text-muted-foreground"> × {l.quantity}</span>}</span>
                  <span className="font-medium shrink-0">{money(l.line_total)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t pt-3 mt-1 text-base font-bold"><span>סה"כ</span><span>{money(order.total)}</span></div>
            {order.dietary_notes && <p className="text-sm mt-3"><b>תזונה ואלרגיות:</b> {order.dietary_notes}</p>}
            {order.customer_notes && <p className="text-sm mt-1"><b>הערות:</b> {order.customer_notes}</p>}
          </section>
        </div>
      </main>
    );
  }

  // Build view
  return (
    <main dir="rtl" lang="he" className="min-h-screen bg-background pb-28">
      {header}
      <div className="max-w-3xl mx-auto px-4 -mt-4 space-y-5">
        {order.message_to_customer && (
          <section className="rounded-2xl border bg-card p-4 shadow-sm text-sm whitespace-pre-wrap">{order.message_to_customer}</section>
        )}
        <section className="rounded-2xl border bg-card p-4 shadow-sm text-sm space-y-1">
          <p className="font-semibold">איך זה עובד?</p>
          <p className="text-muted-foreground">בוחרים ספק, מוסיפים תפריטים ומגשים לפי מספר המשתתפים, ושולחים. אפשר לשלב כמה ספקים בהזמנה אחת. נציג Workies יאשר את ההזמנה מולכם.</p>
        </section>

        {/* Supplier picker */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold">הספקים שלנו</h2>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={kosherOnly} onChange={(e) => setKosherOnly(e.target.checked)} className="accent-[hsl(var(--primary))] w-4 h-4" />כשר בלבד
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x" role="tablist" aria-label="ספקי הסעדה">
            {visible.map((s) => {
              const active = current?.id === s.id;
              const picked = est.suppliersUsed.has(s.id);
              return (
                <button key={s.id} type="button" role="tab" aria-selected={active} onClick={() => setActiveSupplier(s.id)}
                  className={`snap-start shrink-0 rounded-2xl border px-4 py-3 text-right min-w-[140px] transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/50"}`}>
                  <span className="flex items-center gap-1.5 font-bold">{s.name}{picked && <span className={`w-2 h-2 rounded-full ${active ? "bg-white" : "bg-primary"}`} aria-label="נבחרו פריטים" />}</span>
                  <span className={`block text-xs mt-0.5 ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{s.kashrut_label || (s.is_kosher ? "כשר" : "לא כשר")}</span>
                </button>
              );
            })}
          </div>
        </section>

        {current && (
          <section className="space-y-3" role="tabpanel">
            <div className="rounded-2xl bg-primary/10 p-4">
              <h2 className="text-lg font-bold">{current.name}</h2>
              <p className="text-sm flex items-center gap-1.5 mt-1"><ShieldCheck className="w-4 h-4 text-primary" />{current.kashrut_label || (current.is_kosher ? "כשר" : "לא כשר")}</p>
              {current.description && <p className="text-sm text-muted-foreground mt-1">{current.description}</p>}
              {current.delivery_fee > 0 && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Truck className="w-3.5 h-3.5" />דמי משלוח {money(current.delivery_fee)} יתווספו פעם אחת להזמנה מספק זה</p>}
            </div>
            {current.menus.map((m) => <MenuCard key={m.id} menu={m} cart={cart} setQty={setQty} guests={guests} />)}
          </section>
        )}

        {/* Summary and details */}
        <section ref={summaryRef} className="rounded-2xl border bg-card p-5 space-y-4 scroll-mt-4">
          <h2 className="font-bold text-lg">סיכום ושליחה</h2>
          {grouped.length === 0 ? <p className="text-sm text-muted-foreground">עדיין לא נבחרו פריטים.</p> : (
            <div className="space-y-3">
              {grouped.map(({ supplier, rows }) => (
                <div key={supplier.id}>
                  <p className="text-sm font-semibold">{supplier.name}</p>
                  <ul className="text-sm divide-y">
                    {rows.map((r) => <li key={r.key} className="py-1.5 flex justify-between gap-3"><span>{r.name} <span className="text-muted-foreground">× {r.qty}</span></span><span className="shrink-0">{money(r.total)}</span></li>)}
                    {supplier.delivery_fee > 0 && <li className="py-1.5 flex justify-between text-muted-foreground"><span>משלוח</span><span>{money(supplier.delivery_fee)}</span></li>}
                  </ul>
                </div>
              ))}
              <div className="flex justify-between border-t pt-3 font-bold text-base"><span>סה"כ משוער</span><span>{money(est.total)}</span></div>
              <p className="text-xs text-muted-foreground">הסכום הסופי יאושר על ידי נציג Workies.</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5"><Label htmlFor="cn">שם איש הקשר *</Label><Input id="cn" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} autoComplete="name" /></div>
            <div className="space-y-1.5"><Label htmlFor="cp">טלפון *</Label><Input id="cp" type="tel" dir="ltr" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} autoComplete="tel" /></div>
            <div className="space-y-1.5"><Label htmlFor="ce">אימייל לקבלת אישור</Label><Input id="ce" type="email" dir="ltr" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} autoComplete="email" /></div>
            <div className="space-y-1.5"><Label htmlFor="gc">מספר משתתפים</Label><Input id="gc" type="number" inputMode="numeric" value={form.guests_count} onChange={(e) => setForm({ ...form, guests_count: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="dn">צמחונים, טבעונים, אלרגיות</Label><Textarea id="dn" rows={2} placeholder="למשל: 3 טבעונים, משתתף אחד ללא גלוטן" value={form.dietary_notes} onChange={(e) => setForm({ ...form, dietary_notes: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="nt">הערות נוספות</Label><Textarea id="nt" rows={2} placeholder="שעת הגשה, בקשות מיוחדות" value={form.customer_notes} onChange={(e) => setForm({ ...form, customer_notes: e.target.value })} /></div>

          {error && <p role="alert" className="text-sm text-destructive flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}
          <Button className="w-full h-12 text-base gap-2" onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            {order.status === "submitted" ? "עדכון ההזמנה" : "שליחת ההזמנה לאישור"}
          </Button>
        </section>
      </div>

      {/* Sticky cart bar */}
      {est.count > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-sm">
              <p className="font-bold text-base">{money(est.total)}</p>
              <p className="text-muted-foreground">{est.count} פריטים · {est.suppliersUsed.size} ספקים</p>
            </div>
            <Button className="gap-2" onClick={() => summaryRef.current?.scrollIntoView({ behavior: "smooth" })}><ShoppingBag className="w-4 h-4" />לסיכום ושליחה</Button>
          </div>
        </div>
      )}
    </main>
  );
}
