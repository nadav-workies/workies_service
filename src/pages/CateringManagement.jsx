import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Search, UtensilsCrossed } from "lucide-react";
import OrderFormDialog from "@/components/catering/OrderFormDialog";
import OrderDetailDialog from "@/components/catering/OrderDetailDialog";
import CateringCatalogTab from "@/components/catering/CateringCatalogTab";
import { canManageCatering, canEditCateringCatalog } from "@/lib/permissions";
import { ORDER_STATUS, TIME_SLOTS, formatDate, money } from "@/lib/catering";

const FILTERS = [["active", "פעילות"], ["submitted", "ממתינות לאישור"], ["link_created", "ממתינות ללקוח"], ["approved", "מאושרות"], ["all", "הכל"]];

// Catering orders for event agreements: Sali creates a link per event, the customer builds the order, Sali approves.
export default function CateringManagement() {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["catering-orders"],
    queryFn: () => base44.entities.CateringOrder.list("-created_date", 500),
    enabled: canManageCatering(user),
  });

  const shown = useMemo(() => {
    const q = search.trim();
    return orders
      .filter((o) => filter === "all" ? true : filter === "active" ? ["link_created", "submitted"].includes(o.status) : o.status === filter)
      .filter((o) => !q || [o.company, o.event_name, o.contact_name, o.order_number].some((v) => String(v || "").includes(q)))
      .sort((a, b) => String(a.event_date || "").localeCompare(String(b.event_date || "")));
  }, [orders, filter, search]);

  const pending = orders.filter((o) => o.status === "submitted").length;
  const selected = orders.find((o) => o.id === selectedId) || null;

  const refresh = (saved) => {
    qc.setQueryData(["catering-orders"], (old = []) => old.some((o) => o.id === saved.id) ? old.map((o) => (o.id === saved.id ? { ...o, ...saved } : o)) : [saved, ...old]);
    qc.invalidateQueries({ queryKey: ["catering-orders"] });
  };

  if (!user) return <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!canManageCatering(user)) return <div className="text-center py-20 text-muted-foreground">אין הרשאה לצפות בדף זה</div>;

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><UtensilsCrossed className="w-5 h-5" />הזמנות הסעדה לאירועים</h1>
          <p className="text-muted-foreground text-sm mt-1">יוצרים קישור לאירוע, שולחים ללקוח, והוא מרכיב הזמנה מספקי ההסעדה שלנו</p>
        </div>
        <Button className="gap-2" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="w-4 h-4" />קישור הזמנה חדש</Button>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">הזמנות{pending > 0 && <span className="mr-1.5 rounded-full bg-amber-500 text-white text-[10px] px-1.5">{pending}</span>}</TabsTrigger>
          <TabsTrigger value="catalog">ספקים ותפריטים</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-3 mt-4">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map(([k, label]) => (
              <button key={k} type="button" onClick={() => setFilter(k)}
                className={`px-3 py-1.5 rounded-full text-sm border ${filter === k ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/50"}`}>{label}</button>
            ))}
            <div className="relative mr-auto">
              <Search className="w-4 h-4 absolute right-2.5 top-2.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש לקוח או אירוע" className="pr-8 h-9 w-56" />
            </div>
          </div>

          {isLoading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          : shown.length === 0 ? (
            <div className="rounded-xl border bg-card py-14 text-center space-y-3">
              <p className="text-muted-foreground">{orders.length ? "אין הזמנות בסינון הזה" : "עדיין אין הזמנות הסעדה"}</p>
              {!orders.length && <Button variant="outline" className="gap-2" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="w-4 h-4" />ליצירת הקישור הראשון</Button>}
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr><th className="text-right p-3">תאריך</th><th className="text-right p-3">לקוח</th><th className="text-right p-3">אירוע</th><th className="p-3">משתתפים</th><th className="text-right p-3">סכום</th><th className="text-right p-3">סטטוס</th></tr>
                </thead>
                <tbody>
                  {shown.map((o) => {
                    const st = ORDER_STATUS[o.status] || ORDER_STATUS.link_created;
                    return (
                      <tr key={o.id} onClick={() => setSelectedId(o.id)} className="border-t cursor-pointer hover:bg-muted/30">
                        <td className="p-3 whitespace-nowrap">{formatDate(o.event_date)}<p className="text-xs text-muted-foreground">{o.event_time || TIME_SLOTS[o.time_slot] || ""}</p></td>
                        <td className="p-3 font-medium">{o.company}<p className="text-xs text-muted-foreground font-normal">{o.order_number}</p></td>
                        <td className="p-3">{o.event_name || "-"}</td>
                        <td className="p-3 text-center">{o.guests_count || "-"}</td>
                        <td className="p-3 font-medium">{o.total ? money(o.total) : "-"}</td>
                        <td className="p-3"><span className={`text-xs rounded-full px-2 py-0.5 whitespace-nowrap ${st.className}`}>{st.label}</span>{o.status === "link_created" && !o.link_sent_at && <p className="text-[11px] text-muted-foreground mt-0.5">הקישור עוד לא נשלח</p>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="catalog" className="mt-4">
          <CateringCatalogTab canEdit={canEditCateringCatalog(user)} />
        </TabsContent>
      </Tabs>

      <OrderFormDialog open={formOpen} onOpenChange={setFormOpen} order={editing} user={user}
        onSaved={(saved) => { refresh(saved); if (!editing) setSelectedId(saved.id); }} />
      <OrderDetailDialog order={selected} open={!!selected} onOpenChange={(v) => !v && setSelectedId(null)} user={user}
        onChanged={refresh} onEdit={() => { setEditing(selected); setSelectedId(null); setFormOpen(true); }} />
    </div>
  );
}
