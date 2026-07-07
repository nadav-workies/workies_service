import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Cake, ChevronLeft, Loader2 } from "lucide-react";
import { WORKIES_ROOMS } from "@/lib/workiesRooms";
import EditTenantDialog from "@/components/users/EditTenantDialog";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getUpcomingBirthdays(tenants, users) {
  const userByEmail = new Map();
  const userByRoomNumber = new Map();
  users.forEach(u => {
    const email = normalizeEmail(u.email);
    if (email) userByEmail.set(email, u);
    const rn = String(u.default_room_number || u.room_number || "").trim();
    if (rn) userByRoomNumber.set(rn, u);
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const roomMap = new Map(WORKIES_ROOMS.map(r => [String(r.room_number), r]));

  const results = [];

  for (const t of tenants) {
    let birthdate = t.birthdate;
    if (!birthdate) {
      const email = normalizeEmail(t.email);
      if (email && userByEmail.has(email)) birthdate = userByEmail.get(email).birthdate;
      if (!birthdate) {
        const rn = String(t.room_number || "").trim();
        if (rn && userByRoomNumber.has(rn)) birthdate = userByRoomNumber.get(rn).birthdate;
      }
    }
    if (!birthdate) continue;

    const bd = new Date(birthdate + "T00:00:00");
    const thisYearBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
    const diffDays = Math.round((thisYearBd - today) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 7) {
      const room = roomMap.get(String(t.room_number || ""));
      results.push({
        tenant: t,
        birthdate,
        diffDays,
        displayName: t.contact_name || t.customer_name || "—",
        roomLabel: room?.room_label || t.room_label || t.room_number || "",
        birthdateLabel: `${bd.getDate()}/${bd.getMonth() + 1}`,
      });
    }
  }

  results.sort((a, b) => a.diffDays - b.diffDays);
  return results;
}

export default function BirthdayListCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingTenant, setEditingTenant] = useState(null);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["room-tenants-dashboard"],
    queryFn: () => base44.entities.RoomTenant.list("-created_date", 2000),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users-for-birthdays"],
    queryFn: () => base44.entities.User.list("-created_date", 500),
  });

  const birthdays = getUpcomingBirthdays(tenants, users);

  return (
    <Card dir="rtl" className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4 border-b bg-pink-50/50">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Cake className="w-4 h-4 text-pink-600" />
            ימי הולדת השבוע
            {birthdays.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">({birthdays.length})</span>
            )}
          </h2>
          <button
            onClick={() => navigate("/users")}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
          >
            ניהול לקוחות
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : birthdays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Cake className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">אין ימי הולדת השבוע</p>
          </div>
        ) : (
          <div className="divide-y">
            {birthdays.map((item, idx) => {
              const isToday = item.diffDays === 0;
              return (
                <button
                  key={`${item.tenant.id}-${idx}`}
                  onClick={() => setEditingTenant(item.tenant)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-pink-50/40 transition-colors text-right"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${isToday ? "bg-primary text-primary-foreground" : "bg-pink-100 text-pink-600"}`}>
                      <Cake className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.roomLabel} · {item.birthdateLabel}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {isToday ? "היום! 🎉" : `בעוד ${item.diffDays} ימים`}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>

      {editingTenant && (
        <EditTenantDialog
          tenant={editingTenant}
          onClose={() => setEditingTenant(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["room-tenants-dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["room-tenants"] });
            setEditingTenant(null);
          }}
        />
      )}
    </Card>
  );
}