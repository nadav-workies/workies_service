import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import { isManagerOrAdmin } from "@/lib/slaUtils";

export default function UsersManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (!u || (u.role !== 'admin' && u.role !== 'manager')) {
        navigate("/");
      }
    }).catch(() => navigate("/"));
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users-management"],
    queryFn: () => base44.entities.User.list("-created_date", 500),
    enabled: !!currentUser && isManagerOrAdmin(currentUser),
  });

  if (!currentUser || isLoading) {
    return (
      <div className="flex items-center justify-center py-20" dir="rtl">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const roleLabel = (role) => {
    if (role === 'admin') return 'מנהל מערכת';
    if (role === 'manager') return 'מנהל';
    return 'משתמש';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5" dir="rtl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          ניהול משתמשים
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {users.length} משתמשים במערכת
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">רשימת משתמשים</CardTitle>
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
                {users.map((user) => (
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
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      לא נמצאו משתמשים
                    </td>
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