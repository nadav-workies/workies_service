import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Building2, UserCheck, AlertTriangle, Archive } from "lucide-react";
import { isManagerOrAdmin } from "@/lib/slaUtils";
import { WORKIES_ROOMS } from "@/lib/workiesRooms";
import { format } from "date-fns";

function getFourMonthsAgoMs() {
  const d = new Date();
  d.setMonth(d.getMonth() - 4);
  return d.getTime();
}

function KpiCard({ icon: Icon, label, value, color = "text-foreground" }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="w-4 h-4 text-muted-foreground" />
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

const STATUS_LABELS = { active: "פעיל", inactive: "לא פעיל", empty: "חדר ריק" };
const STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-orange-100 text-orange-800",
  empty: "bg-gray-100 text-gray-600",
};

const roleLabel = (role) => {
  if (role === 'admin') return 'מנהל מערכת';
  if (role === 'manager') return 'מנהל';
  return 'משתמש';
};

export default function UsersManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [emptyDialog, setEmptyDialog] = useState(null); // { room_number, room_label, currentStatus }
  const [emptyReason, setEmptyReason] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (!u || (u.role !== 'admin' && u.role !== 'manager')) navigate("/");
    }).catch(() => navigate("/"));
  }, []);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users-management"],
    queryFn: () => base44.entities.User.list("-created_date", 500),
    enabled: !!currentUser && isManagerOrAdmin(currentUser),
  });

  const { data: tickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ["users-mgmt-tickets"],
    queryFn: () => base44.entities.ServiceTicket.list("-opened_at_ms", 2000),
    enabled: !!currentUser && isManagerOrAdmin(currentUser),
  });

  const { data: roomStatuses = [], isLoading: loadingRoomStatuses } = useQuery({
    queryKey: ["room-statuses"],
    queryFn: () => base44.entities.RoomStatus.list("-created_date", 500),
    enabled: !!currentUser && isManagerOrAdmin(currentUser),
  });

  const isLoading = loadingUsers || loadingTickets || loadingRoomStatuses;

  if (!currentUser || isLoading) {
    return (
      <div className="flex items-center justify-center py-20" dir="rtl">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // --- Compute room data ---
  const fourMonthsAgoMs = getFourMonthsAgoMs();

  const recentTickets = tickets.filter(t => {
    if (!t.room_number) return false;
    if (t.archived === true || t.is_test_data === true || t.exclude_from_metrics === true) return false;
    const openedMs = Number(t.opened_at_ms) || (t.opened_at ? new Date(t.opened_at).getTime() : null);
    return openedMs && openedMs >= fourMonthsAgoMs;
  });

  const ticketsByRoom = {};
  recentTickets.forEach(t => {
    const rn = String(t.room_number);
    if (!ticketsByRoom[rn]) ticketsByRoom[rn] = [];
    ticketsByRoom[rn].push(t);
  });

  const usersByRoom = {};
  users.forEach(u => {
    if (!u.room_number) return;
    const rn = String(u.room_number);
    if (!usersByRoom[rn]) usersByRoom[rn] = [];
    usersByRoom[rn].push(u);
  });

  const roomStatusMap = {};
  roomStatuses.forEach(rs => { roomStatusMap[String(rs.room_number)] = rs; });

  const roomData = WORKIES_ROOMS.map(room => {
    const rn = String(room.room_number);
    const adminStatus = roomStatusMap[rn];
    const isEmpty = adminStatus?.is_empty === true;
    const roomUsers = usersByRoom[rn] || [];
    const roomTickets = ticketsByRoom[rn] || [];
    const hasUsers = roomUsers.length > 0;
    const hasRecentTickets = roomTickets.length > 0;

    let status = "inactive";
    if (isEmpty) status = "empty";
    else if (hasUsers || hasRecentTickets) status = "active";

    // last ticket across all time for display
    const allRoomTickets = tickets.filter(t => String(t.room_number) === rn && !t.archived && !t.is_test_data);
    const lastTicket = allRoomTickets[0];

    return {
      room_number: rn,
      room_label: room.room_label,
      room_area: room.room_area,
      status,
      is_empty: isEmpty,
      adminStatusId: adminStatus?.id || null,
      users_count: roomUsers.length,
      recent_tickets_count: roomTickets.length,
      last_ticket_at: lastTicket?.opened_at || lastTicket?.created_date || null,
    };
  });

  // KPI counts
  const totalRooms = WORKIES_ROOMS.length;
  const activeRooms = roomData.filter(r => r.status === "active").length;
  const roomsWithUsers = roomData.filter(r => r.users_count > 0).length;
  const inactiveRooms = roomData.filter(r => r.status === "inactive").length;
  const emptyRooms = roomData.filter(r => r.status === "empty").length;

  const isAdmin = currentUser?.role === 'admin';

  const handleToggleEmpty = async (room) => {
    const now = new Date().toISOString();
    if (room.is_empty && room.adminStatusId) {
      // Unmark empty
      await base44.entities.RoomStatus.update(room.adminStatusId, {
        is_empty: false,
        empty_updated_at: now,
        empty_updated_by: currentUser.email,
      });
    } else if (room.adminStatusId) {
      // Already has record, mark empty
      await base44.entities.RoomStatus.update(room.adminStatusId, {
        is_empty: true,
        empty_reason: emptyReason || "",
        empty_updated_at: now,
        empty_updated_by: currentUser.email,
      });
    } else {
      // Create new record
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

  return (
    <div className="max-w-6xl mx-auto space-y-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          ניהול משתמשים וחדרים
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{users.length} משתמשים · {totalRooms} חדרים מזוהים</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard icon={Building2} label="חדרים מזוהים" value={totalRooms} />
        <KpiCard icon={Building2} label="חדרים פעילים" value={activeRooms} />
        <KpiCard icon={UserCheck} label="חדרים עם משתמשים" value={roomsWithUsers} />
        <KpiCard icon={AlertTriangle} label="ללא פעילות 4 חודשים" value={inactiveRooms} />
        <KpiCard icon={Archive} label="חדרים ריקים" value={emptyRooms} />
      </div>

      {/* Rooms Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">סטטוס חדרים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-2 font-semibold">חדר</th>
                  <th className="p-2 font-semibold">אזור</th>
                  <th className="p-2 font-semibold">סטטוס</th>
                  <th className="p-2 font-semibold">משתמשים</th>
                  <th className="p-2 font-semibold">קריאות 4 חודשים</th>
                  <th className="p-2 font-semibold">קריאה אחרונה</th>
                  {isAdmin && <th className="p-2 font-semibold">פעולה</th>}
                </tr>
              </thead>
              <tbody>
                {roomData.map(room => (
                  <tr key={room.room_number} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{room.room_label}</td>
                    <td className="p-2 text-muted-foreground text-xs">{room.room_area}</td>
                    <td className="p-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[room.status]}`}>
                        {STATUS_LABELS[room.status]}
                      </span>
                    </td>
                    <td className="p-2 text-center">{room.users_count || "—"}</td>
                    <td className="p-2 text-center">{room.recent_tickets_count || "—"}</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {room.last_ticket_at ? format(new Date(room.last_ticket_at), "dd/MM/yy") : "—"}
                    </td>
                    {isAdmin && (
                      <td className="p-2">
                        {room.is_empty ? (
                          <Button size="sm" variant="outline" className="text-xs h-7"
                            onClick={() => handleToggleEmpty(room)}>
                            בטל סימון ריק
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="text-xs h-7 text-muted-foreground"
                            onClick={() => { setEmptyDialog(room); setEmptyReason(""); }}>
                            סמן כחדר ריק
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
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

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">רשימת משתמשים ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-2 font-semibold">שם</th>
                  <th className="p-2 font-semibold">מייל</th>
                  <th className="p-2 font-semibold">תפקיד</th>
                  <th className="p-2 font-semibold">חדר</th>
                  <th className="p-2 font-semibold">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id || user.email} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{user.full_name || "—"}</td>
                    <td className="p-2" dir="ltr">{user.email || "—"}</td>
                    <td className="p-2">{roleLabel(user.role)}</td>
                    <td className="p-2">{user.room_label || user.room_number || "—"}</td>
                    <td className="p-2">{user.disabled ? "לא פעיל" : "פעיל"}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">לא נמצאו משתמשים</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}