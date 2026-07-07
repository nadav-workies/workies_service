import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2, Mail, Phone, Star, Search, Pencil, Send, X,
  UserCheck, Clock, UserPlus, Users, Activity, CheckCircle, Cake
} from "lucide-react";
import { WORKIES_ROOMS } from "@/lib/workiesRooms";
import EditTenantDialog from "@/components/users/EditTenantDialog";

const MAX_BULK_INVITE = 10;

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function KpiCard({ icon: Icon, label, value, filterKey, activeFilter, onFilter }) {
  const isActive = activeFilter === filterKey;
  return (
    <Card
      className={`cursor-pointer transition-all ${isActive ? "ring-2 ring-primary" : "hover:shadow-md"}`}
      onClick={() => onFilter(isActive ? "all" : filterKey)}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isActive ? "bg-primary/10" : "bg-muted"}`}>
            <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomersAndRoomsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [invitingId, setInvitingId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkInviting, setBulkInviting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["room-tenants"],
    queryFn: () => base44.entities.RoomTenant.list("-created_date", 2000),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users-for-tenants"],
    queryFn: () => base44.entities.User.list("-created_date", 500),
  });

  const registeredEmails = new Set(
    users.map(u => normalizeEmail(u.email)).filter(Boolean)
  );

  // Also match by room number — users who registered with a different email
  // than the one in the tenant import still count as "registered" if their
  // default_room_number matches the tenant's room_number.
  const registeredRoomNumbers = new Set(
    users.map(u => String(u.default_room_number || u.room_number || "").trim())
      .filter(Boolean)
  );

  const getTenantStatus = (t) => {
    const email = normalizeEmail(t.email);
    if (email && registeredEmails.has(email)) return "registered";
    const rn = String(t.room_number || "").trim();
    if (rn && registeredRoomNumbers.has(rn)) return "registered";
    if (t.invite_sent === true) return "invited";
    return "pending";
  };

  const statusCounts = tenants.reduce((acc, t) => {
    const s = getTenantStatus(t);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, { registered: 0, invited: 0, pending: 0 });

  const activeCustomersCount = tenants.filter(t =>
    String(t.customer_status || "").trim().toLowerCase() === "active"
  ).length;

  const userByEmail = new Map();
  const userByRoomNumber = new Map();
  users.forEach(u => {
    const email = normalizeEmail(u.email);
    if (email) userByEmail.set(email, u);
    const rn = String(u.default_room_number || u.room_number || "").trim();
    if (rn) userByRoomNumber.set(rn, u);
  });

  const getTenantBirthdate = (t) => {
    const email = normalizeEmail(t.email);
    if (email && userByEmail.has(email)) return userByEmail.get(email).birthdate;
    const rn = String(t.room_number || "").trim();
    if (rn && userByRoomNumber.has(rn)) return userByRoomNumber.get(rn).birthdate;
    return null;
  };

  const getBirthdayStatus = (birthdate) => {
    if (!birthdate) return null;
    const bd = new Date(birthdate + "T00:00:00");
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisYearBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
    const diffDays = Math.round((thisYearBd - today) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { status: "today", label: "היום! 🎂" };
    if (diffDays > 0 && diffDays <= 7) return { status: "soon", label: `בעוד ${diffDays} ימים` };
    return null;
  };

  const roomMap = new Map(WORKIES_ROOMS.map(r => [String(r.room_number), r]));

  const handleInvite = async (tenant) => {
    setInvitingId(tenant.id);
    try {
      const res = await base44.functions.invoke("sendTenantInvitation", { tenant_id: tenant.id });
      const data = res.data || res;
      if (!data.ok) throw new Error(data.error || "שגיאה בשליחת הזמנה");
      queryClient.invalidateQueries({ queryKey: ["room-tenants"] });
    } catch (err) {
      alert(err.message || "שגיאה בשליחת הזמנה");
    } finally {
      setInvitingId(null);
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_BULK_INVITE) {
          alert(`ניתן לבחור עד ${MAX_BULK_INVITE} דיירים בכל פעם`);
          return next;
        }
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const handleBulkInvite = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkInviting(true);
    setBulkResult(null);
    const results = { success: [], failed: [] };

    for (const id of ids) {
      const tenant = tenants.find(t => t.id === id);
      if (!tenant) continue;
      try {
        const res = await base44.functions.invoke("sendTenantInvitation", { tenant_id: id });
        const data = res.data || res;
        if (data.ok) {
          results.success.push(tenant.email);
        } else {
          results.failed.push({ email: tenant.email, error: data.error });
        }
      } catch (err) {
        results.failed.push({ email: tenant.email, error: err.message });
      }
    }

    setBulkResult(results);
    setBulkInviting(false);
    clearSelection();
    queryClient.invalidateQueries({ queryKey: ["room-tenants"] });
  };

  const q = search.trim().toLowerCase();

  const filteredTenants = tenants.filter(t => {
    const matchesSearch =
      !q ||
      String(t.customer_name || "").toLowerCase().includes(q) ||
      String(t.contact_name || "").toLowerCase().includes(q) ||
      String(t.email || "").toLowerCase().includes(q) ||
      String(t.phone || "").toLowerCase().includes(q) ||
      String(t.company_id || "").toLowerCase().includes(q) ||
      String(t.room_code || "").toLowerCase().includes(q) ||
      String(t.room_number || "").toLowerCase().includes(q);

    const status = getTenantStatus(t);

    const matchesFilter =
      tenantFilter === "all" ||
      tenantFilter === status ||
      (
        tenantFilter === "active_customers" &&
        String(t.customer_status || "").trim().toLowerCase() === "active"
      );

    return matchesSearch && matchesFilter;
  });

  const sortedTenants = [...filteredTenants].sort((a, b) => {
    const rnA = parseInt(a.room_number) || 9999;
    const rnB = parseInt(b.room_number) || 9999;
    if (rnA !== rnB) return rnA - rnB;
    if (a.is_primary_contact && !b.is_primary_contact) return -1;
    if (!a.is_primary_contact && b.is_primary_contact) return 1;
    const nameA = (a.contact_name || a.customer_name || "").toLowerCase();
    const nameB = (b.contact_name || b.customer_name || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" dir="rtl">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpiCards = [
    { icon: Users, label: "סה״כ לקוחות / אנשי קשר", value: tenants.length, filterKey: "all" },
    { icon: UserCheck, label: "רשומים במערכת", value: statusCounts.registered, filterKey: "registered" },
    { icon: Clock, label: "הוזמנו — ממתינים לרישום", value: statusCounts.invited, filterKey: "invited" },
    { icon: UserPlus, label: "ממתינים להזמנה", value: statusCounts.pending, filterKey: "pending" },
    { icon: Activity, label: "לקוחות פעילים", value: activeCustomersCount, filterKey: "active_customers" },
  ];

  const filterOptions = [
    { key: "all", label: `הכל (${tenants.length})` },
    { key: "registered", label: `רשומים במערכת (${statusCounts.registered})`, icon: UserCheck },
    { key: "invited", label: `הוזמנו (${statusCounts.invited})`, icon: Clock },
    { key: "pending", label: `ממתינים להזמנה (${statusCounts.pending})`, icon: UserPlus },
    { key: "active_customers", label: `לקוחות פעילים (${activeCustomersCount})`, icon: Activity },
  ];

  return (
    <>
      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3" dir="rtl">
        {kpiCards.map(card => (
          <KpiCard
            key={card.filterKey}
            icon={card.icon}
            label={card.label}
            value={card.value}
            filterKey={card.filterKey}
            activeFilter={tenantFilter}
            onFilter={setTenantFilter}
          />
        ))}
      </div>

      <Card dir="rtl">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              רשימת לקוחות ({sortedTenants.length})
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="חיפוש לפי שם, אימייל, טלפון, ח.פ, קוד..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-8 pl-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring w-64"
              />
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1 flex-wrap mb-3">
            {filterOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => setTenantFilter(opt.key)}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border transition-colors ${tenantFilter === opt.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
              >
                {opt.icon && <opt.icon className="w-3 h-3" />}
                {opt.label}
              </button>
            ))}
          </div>

          {/* Bulk invite bar */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{selected.size} נבחרו</span>
                <span className="text-xs text-muted-foreground">(מקסימום {MAX_BULK_INVITE})</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={clearSelection} disabled={bulkInviting}>
                  <X className="w-3 h-3" />ביטול בחירה
                </Button>
                <Button size="sm" className="h-7 text-xs gap-1.5" onClick={handleBulkInvite} disabled={bulkInviting}>
                  {bulkInviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  שלח הזמנות ({selected.size})
                </Button>
              </div>
            </div>
          )}

          {/* Bulk result */}
          {bulkResult && (
            <div className="mb-3 space-y-1.5 text-xs bg-muted/40 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">תוצאות שליחה קבוצתית</span>
                <button onClick={() => setBulkResult(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-3 flex-wrap">
                <span className="text-emerald-600 font-medium">✓ נשלחו: {bulkResult.success.length}</span>
                {bulkResult.failed.length > 0 && (
                  <span className="text-red-600 font-medium">✗ נכשלו: {bulkResult.failed.length}</span>
                )}
              </div>
              {bulkResult.failed.length > 0 && (
                <ul className="list-disc pr-4 space-y-0.5 text-red-600">
                  {bulkResult.failed.map((f, i) => (
                    <li key={i}>{f.email}: {f.error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tenants.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              אין לקוחות טעונים. ניתן לייבא קובץ דיירים פעילים מאקסל.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="p-2 font-semibold w-8"></th>
                    <th className="p-2 font-semibold">שם לקוח / איש קשר</th>
                    <th className="p-2 font-semibold">מייל</th>
                    <th className="p-2 font-semibold">טלפון</th>
                    <th className="p-2 font-semibold">חדר</th>
                    <th className="p-2 font-semibold">קוד משרד</th>
                    <th className="p-2 font-semibold">עמדות</th>
                    <th className="p-2 font-semibold whitespace-nowrap">יום הולדת</th>
                    <th className="p-2 font-semibold">סטטוס לקוח</th>
                    <th className="p-2 font-semibold">סטטוס רישום</th>
                    <th className="p-2 font-semibold">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTenants.map(t => {
                    const isSelected = selected.has(t.id);
                    const regStatus = getTenantStatus(t);
                    const isRegistered = regStatus === "registered";
                    const isInvited = regStatus === "invited";
                    const canSelect = t.email && !isRegistered;
                    const room = roomMap.get(String(t.room_number || ""));
                    const isActiveCustomer = String(t.customer_status || "").trim().toLowerCase() === "active";
                    return (
                      <tr key={t.id} className={`border-b hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""}`}>
                        <td className="p-2">
                          {canSelect && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(t.id)}
                              className="w-4 h-4"
                            />
                          )}
                        </td>
                        <td className="p-2 font-medium">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {t.is_primary_contact && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                            {t.contact_name || t.customer_name || "—"}
                          </div>
                          {t.company_id && <span className="text-xs text-muted-foreground" dir="ltr">({t.company_id})</span>}
                        </td>
                        <td className="p-2 text-xs" dir="ltr">{t.email || "—"}</td>
                        <td className="p-2 text-xs" dir="ltr">{t.phone || "—"}</td>
                        <td className="p-2 text-xs">
                          {room?.room_label || t.room_label || t.room_number || "—"}
                        </td>
                        <td className="p-2 text-xs" dir="ltr">{t.room_code || "—"}</td>
                        <td className="p-2 text-xs text-center">{t.desk_count != null ? t.desk_count : "—"}</td>
                        <td className="p-2 text-xs">
                          {(() => {
                            const bd = getTenantBirthdate(t);
                            if (!bd) return <span className="text-muted-foreground">—</span>;
                            const bdDate = new Date(bd + "T00:00:00");
                            const bdStr = `${bdDate.getDate()}/${bdDate.getMonth() + 1}`;
                            const status = getBirthdayStatus(bd);
                            if (status?.status === "today") {
                              return (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                                  <Cake className="w-3 h-3" />{bdStr} — {status.label}
                                </span>
                              );
                            }
                            if (status?.status === "soon") {
                              return (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                                  <Cake className="w-3 h-3" />{bdStr} — {status.label}
                                </span>
                              );
                            }
                            return <span className="text-muted-foreground">{bdStr}</span>;
                          })()}
                        </td>
                        <td className="p-2">
                          {t.customer_status ? (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isActiveCustomer ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                              {t.customer_status}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-2">
                          {isRegistered ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
                              <UserCheck className="w-3 h-3" />
                              רשום במערכת
                            </span>
                          ) : isInvited ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                              <Clock className="w-3 h-3" />
                              הוזמן — ממתין לרישום
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">
                              <UserPlus className="w-3 h-3" />
                              ממתין להזמנה
                            </span>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            {t.email && (
                              <a href={`mailto:${t.email}`} className="inline-flex items-center justify-center w-7 h-7 rounded border hover:bg-muted" title="שלח מייל">
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {t.phone && (
                              <a href={`tel:${t.phone}`} className="inline-flex items-center justify-center w-7 h-7 rounded border hover:bg-muted" title="חייג">
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => setEditingTenant(t)}
                              className="inline-flex items-center justify-center w-7 h-7 rounded border hover:bg-muted"
                              title="עריכת פרטים"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {isRegistered ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium px-2">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </span>
                            ) : isInvited ? (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium px-2">
                                <Clock className="w-3.5 h-3.5" />
                              </span>
                            ) : t.email ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50"
                                onClick={() => handleInvite(t)}
                                disabled={invitingId === t.id}
                              >
                                {invitingId === t.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Mail className="w-3.5 h-3.5" />}
                                הזמן
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">אין אימייל</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {sortedTenants.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-muted-foreground">לא נמצאו תוצאות</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingTenant && (
        <EditTenantDialog
          tenant={editingTenant}
          onClose={() => setEditingTenant(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["room-tenants"] });
            setEditingTenant(null);
          }}
        />
      )}
    </>
  );
}