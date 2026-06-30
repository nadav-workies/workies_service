import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2, Mail, Phone, Star, Users, CheckCircle, Search, Pencil, Send, X,
  UserCheck, Clock, UserPlus, Building2
} from "lucide-react";
import { WORKIES_ROOMS } from "@/lib/workiesRooms";
import EditTenantDialog from "@/components/users/EditTenantDialog";

const MAX_BULK_INVITE = 10;

export default function UnifiedUsersTable() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [invitingId, setInvitingId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkInviting, setBulkInviting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["room-tenants"],
    queryFn: () => base44.entities.RoomTenant.list("-created_date", 2000),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users-for-tenants"],
    queryFn: () => base44.entities.User.list("-created_date", 500),
  });

  const registeredEmails = new Set(
    users.map(u => (u.email || "").toLowerCase()).filter(Boolean)
  );

  const getTenantStatus = (t) => {
    if (t.email && registeredEmails.has(t.email.toLowerCase())) return "registered";
    if (t.invite_sent) return "invited";
    return "pending";
  };

  const statusCounts = tenants.reduce((acc, t) => {
    const s = getTenantStatus(t);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, { registered: 0, invited: 0, pending: 0 });

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

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = !search ||
      (t.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.contact_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.company_id || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.room_code || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || getTenantStatus(t) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" dir="rtl">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filterOptions = [
    { key: "all", label: `הכל (${tenants.length})` },
    { key: "registered", label: `רשום במערכת (${statusCounts.registered})`, icon: UserCheck },
    { key: "invited", label: `הוזמן (${statusCounts.invited})`, icon: Clock },
    { key: "pending", label: `ממתין להזמנה (${statusCounts.pending})`, icon: UserPlus },
  ];

  return (
    <>
      <Card dir="rtl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              רשימת לקוחות ({tenants.length})
            </CardTitle>
            <div className="relative">
              <Search className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="חיפוש לפי שם, אימייל, ח.פ, קוד..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-8 pl-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring w-64"
              />
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1 flex-wrap mt-2">
            {filterOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border transition-colors ${statusFilter === opt.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
              >
                {opt.icon && <opt.icon className="w-3 h-3" />}
                {opt.label}
              </button>
            ))}
          </div>

          {/* Bulk invite bar */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 mt-2">
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
            <div className="mt-2 space-y-1.5 text-xs bg-muted/40 rounded-lg p-3">
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
        </CardHeader>
        <CardContent>
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
                    <th className="p-2 font-semibold">שם</th>
                    <th className="p-2 font-semibold">מייל</th>
                    <th className="p-2 font-semibold">טלפון</th>
                    <th className="p-2 font-semibold">חדר</th>
                    <th className="p-2 font-semibold">תפקיד</th>
                    <th className="p-2 font-semibold">סטטוס</th>
                    <th className="p-2 font-semibold">פעולה</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map(t => {
                    const isSelected = selected.has(t.id);
                    const tenantStatus = getTenantStatus(t);
                    const isRegistered = tenantStatus === "registered";
                    const isInvited = tenantStatus === "invited";
                    const canSelect = t.email && !isRegistered;
                    const room = roomMap.get(String(t.room_number || ""));
                    return (
                      <tr key={t.id} className={`border-b hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""} ${isRegistered ? "border-r-2 border-emerald-400" : tenantStatus === "pending" ? "border-r-2 border-orange-400" : ""}`}>
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
                          {room?.room_area && <span className="text-muted-foreground"> · {room.room_area}</span>}
                        </td>
                        <td className="p-2 text-xs">{t.contact_role || "—"}</td>
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
                                <UserCheck className="w-3.5 h-3.5" />
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
                  {filteredTenants.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">לא נמצאו תוצאות</td>
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