import { useState, Fragment } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Cake, Loader2, Search, Bell, Clock, CalendarDays, Mail, Phone, Pencil } from "lucide-react";
import { buildBirthdayRows, MONTHS_HE } from "@/lib/birthdays";
import EditTenantDialog from "@/components/users/EditTenantDialog";

export default function BirthdaysTab() {
  const qc = useQueryClient();
  const [sort, setSort] = useState("upcoming"); // upcoming | calendar
  const [search, setSearch] = useState("");
  const [editingTenant, setEditingTenant] = useState(null);

  const { data: tenants = [], isLoading } = useQuery({ queryKey: ["room-tenants"], queryFn: () => base44.entities.RoomTenant.list("-created_date", 2000) });
  const { data: employees = [] } = useQuery({ queryKey: ["customer-employees-all"], queryFn: () => base44.entities.CustomerEmployee.list("name", 2000) });
  const { data: users = [] } = useQuery({ queryKey: ["users-for-tenants"], queryFn: () => base44.entities.User.list("-created_date", 500) });

  const q = search.trim().toLowerCase();
  const rows = buildBirthdayRows(tenants, employees, users)
    .filter(r => !q || [r.name, r.customer, r.room, r.email].some(v => String(v).toLowerCase().includes(q)));

  const sorted = [...rows].sort((a, b) =>
    sort === "upcoming" ? a.diffDays - b.diffDays || a.name.localeCompare(b.name)
      : a.month - b.month || a.day - b.day || a.name.localeCompare(b.name)
  );

  const today = rows.filter(r => r.diffDays === 0);
  const thisWeek = rows.filter(r => r.diffDays > 0 && r.diffDays <= 7);

  const badge = (r) => {
    if (r.diffDays === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground"><Cake className="w-3 h-3" /> היום!</span>;
    if (r.diffDays === 1) return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">מחר</span>;
    if (r.diffDays <= 7) return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">בעוד {r.diffDays} ימים</span>;
    if (r.diffDays <= 30) return <span className="px-2 py-0.5 rounded-full text-[11px] bg-muted text-muted-foreground">בעוד {r.diffDays} ימים</span>;
    return <span className="text-[11px] text-muted-foreground">בעוד {r.diffDays} ימים</span>;
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  // group by month in calendar mode
  let lastMonth = null;

  return (
    <div className="space-y-4" dir="rtl">
      {(today.length > 0 || thisWeek.length > 0) && (
        <div className="border-2 border-pink-200 bg-pink-50 rounded-xl p-3 space-y-1.5">
          <p className="text-sm font-bold flex items-center gap-2 text-pink-800"><Bell className="w-4 h-4" /> תזכורות ימי הולדת</p>
          {today.length > 0 && <p className="text-sm"><span className="font-semibold">היום 🎂:</span> {today.map(r => `${r.name} (${r.customer})`).join(", ")}</p>}
          {thisWeek.length > 0 && <p className="text-sm text-pink-900/80"><span className="font-semibold">בשבוע הקרוב:</span> {thisWeek.map(r => `${r.name} — ${r.dateLabel}`).join(", ")}</p>}
        </div>
      )}

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h2 className="text-base font-semibold flex items-center gap-2"><Cake className="w-4 h-4 text-pink-600" /> ימי הולדת ({sorted.length})</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                <button onClick={() => setSort("upcoming")} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium ${sort === "upcoming" ? "bg-card shadow-sm" : "text-muted-foreground"}`}><Clock className="w-3.5 h-3.5" /> הקרובים ביותר</button>
                <button onClick={() => setSort("calendar")} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium ${sort === "calendar" ? "bg-card shadow-sm" : "text-muted-foreground"}`}><CalendarDays className="w-3.5 h-3.5" /> לפי לוח שנה</button>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש שם / לקוח / חדר" className="pr-8 pl-3 py-1.5 text-sm border rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
          </div>

          {sorted.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">אין תאריכי לידה רשומים. הוסיפו תאריך לידה לאנשי קשר או לעובדים בכרטיס הלקוח.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="p-2 font-semibold">תאריך</th>
                    <th className="p-2 font-semibold">שם</th>
                    <th className="p-2 font-semibold">סוג</th>
                    <th className="p-2 font-semibold">לקוח</th>
                    <th className="p-2 font-semibold">חדר</th>
                    <th className="p-2 font-semibold">מתי</th>
                    <th className="p-2 font-semibold">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(r => {
                    const showMonth = sort === "calendar" && r.month !== lastMonth;
                    lastMonth = r.month;
                    return (
                      <Fragment key={r.key}>
                        {showMonth && (
                          <tr className="bg-pink-50/60">
                            <td colSpan={7} className="p-1.5 px-2 text-xs font-bold text-pink-800">{MONTHS_HE[r.month]}</td>
                          </tr>
                        )}
                        <tr className={`border-b hover:bg-muted/30 ${r.diffDays === 0 ? "bg-primary/5" : ""}`}>
                          <td className="p-2 font-mono text-xs whitespace-nowrap">{r.day} ב{MONTHS_HE[r.month]}</td>
                          <td className="p-2 font-medium">{r.name}</td>
                          <td className="p-2"><span className={`text-[10px] px-1.5 py-0.5 rounded-full ${r.kind === "employee" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>{r.kind === "employee" ? "עובד" : "איש קשר"}</span></td>
                          <td className="p-2 text-xs">{r.customer || "—"}</td>
                          <td className="p-2 text-xs">{r.room || "—"}</td>
                          <td className="p-2">{badge(r)}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              {r.email && <a href={`mailto:${r.email}`} className="w-7 h-7 inline-flex items-center justify-center rounded border hover:bg-muted" title="מייל"><Mail className="w-3.5 h-3.5" /></a>}
                              {r.phone && <a href={`tel:${r.phone}`} className="w-7 h-7 inline-flex items-center justify-center rounded border hover:bg-muted" title="חייג"><Phone className="w-3.5 h-3.5" /></a>}
                              {r.tenant && <button onClick={() => setEditingTenant(r.tenant)} className="w-7 h-7 inline-flex items-center justify-center rounded border hover:bg-muted" title="פתח כרטיס לקוח"><Pencil className="w-3.5 h-3.5" /></button>}
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingTenant && (
        <EditTenantDialog tenant={editingTenant} onClose={() => setEditingTenant(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["room-tenants"] }); setEditingTenant(null); }} />
      )}
    </div>
  );
}