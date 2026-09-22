import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Archive, Search, Mail, Phone, UserCheck, ChevronDown, ChevronUp, Ticket } from "lucide-react";
import { format } from "date-fns";
import { isArchivedTenant, tenantRoomDisplay } from "@/lib/tenantStatus";
import ArchivedCustomerTickets from "@/components/users/ArchivedCustomerTickets";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export default function ArchivedCustomersTab() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["room-tenants"],
    queryFn: () => base44.entities.RoomTenant.list("-created_date", 2000),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users-for-tenants"],
    queryFn: () => base44.entities.User.list("-created_date", 500),
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["users-mgmt-tickets"],
    queryFn: () => base44.entities.ServiceTicket.list("-opened_at_ms", 2000),
  });

  const registeredEmails = new Set(users.map(u => normalizeEmail(u.email)).filter(Boolean));

  const archived = tenants.filter(isArchivedTenant);
  const q = search.trim().toLowerCase();

  const filtered = archived.filter(t =>
    !q ||
    String(t.customer_name || "").toLowerCase().includes(q) ||
    String(t.contact_name || "").toLowerCase().includes(q) ||
    String(t.email || "").toLowerCase().includes(q) ||
    String(t.company_id || "").toLowerCase().includes(q) ||
    String(t.room_number || "").toLowerCase().includes(q) ||
    String(t.room_code || "").toLowerCase().includes(q)
  );

  const sorted = [...filtered].sort((a, b) => {
    const rnA = parseInt(a.room_number) || 9999;
    const rnB = parseInt(b.room_number) || 9999;
    if (rnA !== rnB) return rnA - rnB;
    return String(a.customer_name || "").localeCompare(String(b.customer_name || ""));
  });

  const ticketsFor = (tenant) => {
    const rn = String(tenant.room_number || "").trim();
    const email = normalizeEmail(tenant.email);
    return tickets.filter(t =>
      (rn && String(t.room_number || "") === rn) ||
      (email && normalizeEmail(t.reporter_email || t.opened_by_email) === email)
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" dir="rtl">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card dir="rtl">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Archive className="w-4 h-4" />
            ארכיון לקוחות ({sorted.length})
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="חיפוש לפי שם, מייל, ח.פ, חדר..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-8 pl-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring w-64"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          לקוחות שאינם מופיעים בדוח המשרדים הפעילים. כל המידע נשמר, כולל קריאות השירות והעובדים.
        </p>

        {archived.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            אין לקוחות בארכיון.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-2 font-semibold">שם לקוח / איש קשר</th>
                  <th className="p-2 font-semibold">מייל</th>
                  <th className="p-2 font-semibold">טלפון</th>
                  <th className="p-2 font-semibold">משרד אחרון</th>
                  <th className="p-2 font-semibold">קוד משרד</th>
                  <th className="p-2 font-semibold">רישום למערכת</th>
                  <th className="p-2 font-semibold whitespace-nowrap">הועבר לארכיון</th>
                  <th className="p-2 font-semibold text-center">קריאות</th>
                  <th className="p-2 font-semibold">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(t => {
                  const tenantTickets = ticketsFor(t);
                  const isExpanded = expandedId === t.id;
                  const isRegistered = t.email && registeredEmails.has(normalizeEmail(t.email));
                  return (
                    <React.Fragment key={t.id}>
                      <tr className="border-b bg-muted/10 hover:bg-muted/30">
                        <td className="p-2 font-medium">
                          {t.contact_name || t.customer_name || "—"}
                          {t.company_id && <span className="text-xs text-muted-foreground" dir="ltr"> ({t.company_id})</span>}
                        </td>
                        <td className="p-2 text-xs" dir="ltr">{t.email || "—"}</td>
                        <td className="p-2 text-xs" dir="ltr">{t.phone || "—"}</td>
                        <td className="p-2 text-xs">{tenantRoomDisplay(t)}</td>
                        <td className="p-2 text-xs" dir="ltr">{t.room_code || "—"}</td>
                        <td className="p-2">
                          {isRegistered ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-slate-200 text-slate-700">
                              <UserCheck className="w-3 h-3" />
                              רשום במערכת
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                              רק במאגר הלקוחות
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          {t.archived_at ? format(new Date(t.archived_at), "dd/MM/yy") : "—"}
                        </td>
                        <td className="p-2 text-center text-xs">{tenantTickets.length || "—"}</td>
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
                            {tenantTickets.length > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs gap-1"
                                onClick={() => setExpandedId(isExpanded ? null : t.id)}
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                <Ticket className="w-3 h-3" />
                                היסטוריית קריאות
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b bg-muted/20">
                          <td colSpan={9} className="p-3">
                            <ArchivedCustomerTickets tenant={t} tickets={tenantTickets} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">לא נמצאו תוצאות</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}