import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Phone, Star, Building2, CheckCircle, Search } from "lucide-react";
import { WORKIES_ROOMS } from "@/lib/workiesRooms";

export default function TenantsSection() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [invitingId, setInvitingId] = useState(null);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["room-tenants"],
    queryFn: () => base44.entities.RoomTenant.list("-created_date", 2000),
  });

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

  const roomMap = new Map(WORKIES_ROOMS.map(r => [String(r.room_number), r]));

  const tenantsByRoom = {};
  tenants.forEach(t => {
    const rn = String(t.room_number || "");
    if (!tenantsByRoom[rn]) tenantsByRoom[rn] = [];
    tenantsByRoom[rn].push(t);
  });

  const roomNumbersWithTenants = Object.keys(tenantsByRoom).sort((a, b) => {
    const na = parseInt(a) || 0;
    const nb = parseInt(b) || 0;
    return na - nb;
  });

  const filteredRooms = roomNumbersWithTenants.filter(rn => {
    if (!search) return true;
    const q = search.toLowerCase();
    return tenantsByRoom[rn].some(t =>
      (t.customer_name || "").toLowerCase().includes(q) ||
      (t.email || "").toLowerCase().includes(q) ||
      (t.company_id || "").toLowerCase().includes(q) ||
      (t.room_code || "").toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" dir="rtl">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card dir="rtl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            דיירים בחדרים ({tenants.length})
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
      </CardHeader>
      <CardContent>
        {tenants.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            אין דיירים טעונים. ניתן לייבא קובץ דיירים פעילים מאקסל.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRooms.map(rn => {
              const room = roomMap.get(rn);
              const roomTenants = [...tenantsByRoom[rn]].sort((a, b) => {
                if (a.is_primary_contact && !b.is_primary_contact) return -1;
                if (!a.is_primary_contact && b.is_primary_contact) return 1;
                return 0;
              });
              return (
                <div key={rn} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/40 px-3 py-2 flex items-center gap-2">
                    <span className="font-semibold text-sm">{room?.room_label || `חדר ${rn}`}</span>
                    <span className="text-xs text-muted-foreground">({roomTenants.length} דייר{roomTenants.length > 1 ? "ים" : ""})</span>
                    {room?.room_area && <span className="text-xs text-muted-foreground">· {room.room_area}</span>}
                  </div>
                  <div className="divide-y">
                    {roomTenants.map(t => (
                      <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/20 flex-wrap">
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            {t.is_primary_contact && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                            <span className="font-medium text-sm">{t.contact_name || t.customer_name || "—"}</span>
                            {t.is_primary_contact && <span className="text-[10px] text-amber-600 font-medium">מרכזי</span>}
                            {t.contact_role && <span className="text-xs text-muted-foreground">· {t.contact_role}</span>}
                            {t.company_id && <span className="text-xs text-muted-foreground" dir="ltr">({t.company_id})</span>}
                            {t.customer_status && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${t.customer_status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                                {t.customer_status}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {t.email && <span dir="ltr">{t.email}</span>}
                            {t.phone && <span dir="ltr">{t.phone}</span>}
                            {t.desk_count != null && <span>עמדות: {t.desk_count}</span>}
                            {t.room_code && <span className="text-muted-foreground/70" dir="ltr">קוד: {t.room_code}</span>}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
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
                          {t.invite_sent ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                              <CheckCircle className="w-3.5 h-3.5" />
                              הוזמן
                            </span>
                          ) : t.email ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1.5"
                              onClick={() => handleInvite(t)}
                              disabled={invitingId === t.id}
                            >
                              {invitingId === t.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Mail className="w-3.5 h-3.5" />}
                              הזמן למערכת
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">אין אימייל</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {filteredRooms.length === 0 && (
              <div className="py-8 text-center text-muted-foreground text-sm">
                לא נמצאו תוצאות לחיפוש
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}