import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2, Building2, UserCheck, AlertTriangle, Archive, Search,
  ChevronDown, ChevronUp, Phone, Mail, Ticket
} from "lucide-react";
import { WORKIES_ROOMS } from "@/lib/workiesRooms";
import { format } from "date-fns";

const ROOM_STATUS_LABELS = {
  active: "פעיל",
  inactive_4_months: "ללא פעילות 4 חודשים",
  empty: "חדר ריק",
};

const ROOM_STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  inactive_4_months: "bg-orange-100 text-orange-800",
  empty: "bg-gray-100 text-gray-600",
};

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

function getFourMonthsAgoMs() {
  const d = new Date();
  d.setMonth(d.getMonth() - 4);
  return d.getTime();
}

function calculateRoomStatus(roomStatus, tenants, users, recentTickets) {
  const isEmpty = roomStatus?.is_empty === true;
  if (isEmpty) return "empty";
  const hasTenants = tenants.length > 0;
  const hasUsers = users.length > 0;
  const hasRecentTickets = recentTickets.length > 0;
  if (hasTenants || hasUsers || hasRecentTickets) return "active";
  return "inactive_4_months";
}

export default function RoomManagementTab({ currentUser }) {
  const queryClient = useQueryClient();
  const [roomSearch, setRoomSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [emptyDialog, setEmptyDialog] = useState(null);
  const [emptyReason, setEmptyReason] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users-management"],
    queryFn: () => base44.entities.User.list("-created_date", 500),
  });

  const { data: tickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ["users-mgmt-tickets"],
    queryFn: () => base44.entities.ServiceTicket.list("-opened_at_ms", 2000),
  });

  const { data: roomStatuses = [], isLoading: loadingRoomStatuses } = useQuery({
    queryKey: ["room-statuses"],
    queryFn: () => base44.entities.RoomStatus.list("-created_date", 500),
  });

  const { data: roomTenants = [], isLoading: loadingTenants } = useQuery({
    queryKey: ["room-tenants"],
    queryFn: () => base44.entities.RoomTenant.list("-created_date", 2000),
  });

  const isLoading = loadingUsers || loadingTickets || loadingRoomStatuses || loadingTenants;

  const fourMonthsAgoMs = getFourMonthsAgoMs();

  const recentTickets = tickets.filter(t => {
    if (!t.room_number) return false;
    if (t.archived === true || t.is_test_data === true || t.exclude_from_metrics === true) return false;
    const openedMs = Number(t.opened_at_ms) || (t.opened_at ? new Date(t.opened_at).getTime() : null);
    return openedMs && openedMs >= fourMonthsAgoMs;
  });

  const recentTicketsByRoom = {};
  recentTickets.forEach(t => {
    const rn = String(t.room_number);
    if (!recentTicketsByRoom[rn]) recentTicketsByRoom[rn] = [];
    recentTicketsByRoom[rn].push(t);
  });

  const allTicketsByRoom = {};
  tickets.forEach(t => {
    if (!t.room_number) return;
    if (t.archived === true || t.is_test_data === true) return;
    const rn = String(t.room_number);
    if (!allTicketsByRoom[rn]) allTicketsByRoom[rn] = [];
    allTicketsByRoom[rn].push(t);
  });

  const usersByRoom = {};
  users.forEach(u => {
    const rn = u.default_room_number || u.room_number;
    if (!rn) return;
    const key = String(rn);
    if (!usersByRoom[key]) usersByRoom[key] = [];
    usersByRoom[key].push(u);
  });

  const tenantsByRoom = {};
  roomTenants.forEach(t => {
    const rn = String(t.room_number || "");
    if (!rn) return;
    if (!tenantsByRoom[rn]) tenantsByRoom[rn] = [];
    tenantsByRoom[rn].push(t);
  });

  const roomStatusMap = {};
  roomStatuses.forEach(rs => { roomStatusMap[String(rs.room_number)] = rs; });

  const roomRows = WORKIES_ROOMS.map(room => {
    const rn = String(room.room_number);
    const adminStatus = roomStatusMap[rn];
    const roomTenantsForRoom = tenantsByRoom[rn] || [];
    const roomUsers = usersByRoom[rn] || [];
    const roomRecentTickets = recentTicketsByRoom[rn] || [];
    const roomAllTickets = allTicketsByRoom[rn] || [];
    const lastTicket = roomAllTickets[0];
    const roomCode = roomTenantsForRoom[0]?.room_code || "";

    return {
      room_number: rn,
      room_label: room.room_label,
      room_area: room.room_area,
      room_code: roomCode,
      room_status: calculateRoomStatus(adminStatus, roomTenantsForRoom, roomUsers, roomRecentTickets),
      is_empty: adminStatus?.is_empty === true,
      adminStatusId: adminStatus?.id || null,
      tenants_count: roomTenantsForRoom.length,
      room_tenants: roomTenantsForRoom,
      users_count: roomUsers.length,
      room_users: roomUsers,
      recent_tickets_count: roomRecentTickets.length,
      all_tickets: roomAllTickets,
      last_ticket_at: lastTicket?.opened_at || lastTicket?.created_date || null,
    };
  }).sort((a, b) => {
    const na = parseInt(a.room_number) || 0;
    const nb = parseInt(b.room_number) || 0;
    return na - nb;
  });

  // KPI counts
  const totalRooms = WORKIES_ROOMS.length;
  const activeRoomsCount = roomRows.filter(r => r.room_status === "active").length;
  const roomsWithUsersCount = roomRows.filter(r => r.tenants_count > 0 || r.users_count > 0).length;
  const inactiveFourMonthsCount = roomRows.filter(r => r.room_status === "inactive_4_months").length;
  const emptyRoomsCount = roomRows.filter(r => r.room_status === "empty").length;

  const q = roomSearch.trim().toLowerCase();

  const filteredRooms = roomRows.filter(room => {
    const matchesSearch =
      !q ||
      String(room.room_number || "").includes(q) ||
      String(room.room_code || "").toLowerCase().includes(q) ||
      String(room.room_label || "").toLowerCase().includes(q);

    const matchesFilter =
      roomFilter === "all" ||
      (roomFilter === "active" && room.room_status === "active") ||
      (roomFilter === "with_users" && (room.tenants_count > 0 || room.users_count > 0)) ||
      (roomFilter === "inactive_4_months" && room.room_status === "inactive_4_months") ||
      (roomFilter === "empty" && room.room_status === "empty");

    return matchesSearch && matchesFilter;
  });

  const handleToggleEmpty = async (room) => {
    const now = new Date().toISOString();
    if (room.is_empty && room.adminStatusId) {
      await base44.entities.RoomStatus.update(room.adminStatusId, {
        is_empty: false,
        empty_updated_at: now,
        empty_updated_by: currentUser.email,
      });
    } else if (room.adminStatusId) {
      await base44.entities.RoomStatus.update(room.adminStatusId, {
        is_empty: true,
        empty_reason: emptyReason || "",
        empty_updated_at: now,
        empty_updated_by: currentUser.email,
      });
    } else {
      await base44.entities.RoomStatus.create({
        room_number: room.room_number,
        room_label: room.room_label,
        is_empty: true,
        empty_reason: emptyReason || "",
        empty_updated_at: now,
        empty_updated_by: currentUser.email,
      });
    }
    setEmptyDialog(null);
    setEmptyReason("");
    queryClient.invalidateQueries({ queryKey: ["room-statuses"] });
  };

  const toggleExpand = (roomNumber, type) => {
    if (expandedRow?.roomNumber === roomNumber && expandedRow?.type === type) {
      setExpandedRow(null);
    } else {
      setExpandedRow({ roomNumber, type });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" dir="rtl">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpiCards = [
    { icon: Building2, label: "חדרים מזוהים", value: totalRooms, filterKey: "all" },
    { icon: Building2, label: "חדרים פעילים", value: activeRoomsCount, filterKey: "active" },
    { icon: UserCheck, label: "חדרים עם משתמשים", value: roomsWithUsersCount, filterKey: "with_users" },
    { icon: AlertTriangle, label: "ללא פעילות 4 חודשים", value: inactiveFourMonthsCount, filterKey: "inactive_4_months" },
    { icon: Archive, label: "חדרים ריקים", value: emptyRoomsCount, filterKey: "empty" },
  ];

  const filterOptions = [
    { key: "all", label: "הכל" },
    { key: "active", label: "פעילים" },
    { key: "with_users", label: "עם משתמשים" },
    { key: "inactive_4_months", label: "ללא פעילות 4 חודשים" },
    { key: "empty", label: "חדרים ריקים" },
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
            activeFilter={roomFilter}
            onFilter={setRoomFilter}
          />
        ))}
      </div>

      <Card dir="rtl">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              סטטוס חדרים ({filteredRooms.length})
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="חיפוש לפי מספר חדר, קוד משרד, שם..."
                value={roomSearch}
                onChange={e => setRoomSearch(e.target.value)}
                className="pr-8 pl-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring w-64"
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 flex-wrap mb-3">
            {filterOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => setRoomFilter(opt.key)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${roomFilter === opt.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-2 font-semibold">חדר</th>
                  <th className="p-2 font-semibold">קוד משרד</th>
                  <th className="p-2 font-semibold">אזור</th>
                  <th className="p-2 font-semibold">סטטוס חדר</th>
                  <th className="p-2 font-semibold text-center">לקוחות / דיירים</th>
                  <th className="p-2 font-semibold text-center">משתמשים רשומים</th>
                  <th className="p-2 font-semibold text-center">קריאות 4 חודשים</th>
                  <th className="p-2 font-semibold">קריאה אחרונה</th>
                  <th className="p-2 font-semibold">פעולה</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map(room => {
                  const isExpanded = expandedRow?.roomNumber === room.room_number;
                  const expandType = expandedRow?.type;
                  return (
                    <React.Fragment key={room.room_number}>
                      <tr className={`border-b hover:bg-muted/30 ${room.room_status === "empty" ? "bg-gray-50/50" : ""}`}>
                        <td className="p-2 font-medium">{room.room_label}</td>
                        <td className="p-2 text-xs" dir="ltr">{room.room_code || "—"}</td>
                        <td className="p-2 text-xs text-muted-foreground">{room.room_area}</td>
                        <td className="p-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROOM_STATUS_COLORS[room.room_status]}`}>
                            {ROOM_STATUS_LABELS[room.room_status]}
                          </span>
                        </td>
                        <td className="p-2 text-center">{room.tenants_count || "—"}</td>
                        <td className="p-2 text-center">{room.users_count || "—"}</td>
                        <td className="p-2 text-center">{room.recent_tickets_count || "—"}</td>
                        <td className="p-2 text-xs text-muted-foreground">
                          {room.last_ticket_at ? format(new Date(room.last_ticket_at), "dd/MM/yy") : "—"}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            {room.is_empty ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => handleToggleEmpty(room)}
                              >
                                בטל סימון ריק
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-muted-foreground"
                                onClick={() => { setEmptyDialog(room); setEmptyReason(""); }}
                              >
                                סמן כחדר ריק
                              </Button>
                            )}
                            {room.tenants_count > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs gap-1"
                                onClick={() => toggleExpand(room.room_number, "tenants")}
                              >
                                {isExpanded && expandType === "tenants" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                דיירים
                              </Button>
                            )}
                            {room.all_tickets.length > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs gap-1"
                                onClick={() => toggleExpand(room.room_number, "tickets")}
                              >
                                {isExpanded && expandType === "tickets" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                קריאות
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && expandType === "tenants" && (
                        <tr className="border-b bg-muted/20">
                          <td colSpan={9} className="p-3">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold mb-2">דיירים בחדר {room.room_label} ({room.room_tenants.length})</p>
                              {room.room_tenants.map(t => (
                                <div key={t.id} className="flex items-center gap-3 text-xs py-1 border-b border-border/50 last:border-0">
                                  <span className="font-medium">{t.contact_name || t.customer_name || "—"}</span>
                                  {t.is_primary_contact && <span className="text-amber-600">★ מרכזי</span>}
                                  {t.contact_role && <span className="text-muted-foreground">· {t.contact_role}</span>}
                                  {t.email && (
                                    <a href={`mailto:${t.email}`} className="text-muted-foreground hover:text-primary inline-flex items-center gap-1" dir="ltr">
                                      <Mail className="w-3 h-3" />{t.email}
                                    </a>
                                  )}
                                  {t.phone && (
                                    <a href={`tel:${t.phone}`} className="text-muted-foreground hover:text-primary inline-flex items-center gap-1" dir="ltr">
                                      <Phone className="w-3 h-3" />{t.phone}
                                    </a>
                                  )}
                                  {t.room_code && <span className="text-muted-foreground" dir="ltr">קוד: {t.room_code}</span>}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                      {isExpanded && expandType === "tickets" && (
                        <tr className="border-b bg-muted/20">
                          <td colSpan={9} className="p-3">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold mb-2">קריאות החדר {room.room_label} ({room.all_tickets.length})</p>
                              {room.all_tickets.map(t => (
                                <div key={t.id} className="flex items-center gap-3 text-xs py-1 border-b border-border/50 last:border-0">
                                  <Ticket className="w-3 h-3 text-muted-foreground" />
                                  <span className="font-medium">{t.ticket_number || "—"}</span>
                                  <span className="text-muted-foreground">{t.ticket_type || t.area || "—"}</span>
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${t.status === "טופלה" || t.status === "נסגרה" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                    {t.status}
                                  </span>
                                  {t.opened_at && (
                                    <span className="text-muted-foreground">
                                      {format(new Date(t.opened_at), "dd/MM/yy")}
                                    </span>
                                  )}
                                  {t.issue_description && (
                                    <span className="text-muted-foreground truncate max-w-xs">· {t.issue_description}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filteredRooms.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">לא נמצאו חדרים</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Empty Room Dialog */}
      {emptyDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" dir="rtl">
          <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-bold text-base">סימון חדר ריק</h2>
            <p className="text-sm text-muted-foreground">חדר: <strong>{emptyDialog.room_label}</strong></p>
            <div className="space-y-1">
              <label className="text-xs font-medium">סיבה (לא חובה)</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="למשל: חדר לא מאוכלס, ממתין לשוכר..."
                value={emptyReason}
                onChange={e => setEmptyReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEmptyDialog(null)}>ביטול</Button>
              <Button size="sm" onClick={() => handleToggleEmpty(emptyDialog)}>אישור</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}