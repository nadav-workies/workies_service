import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Shield, Save, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { canManagePermissions } from "@/lib/permissions";

const ROLE_LABELS = {
  admin: "מנהל מערכת",
  manager: "מנהל",
  user: "משתמש",
};

export default function PermissionsManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [editingRoles, setEditingRoles] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (!u || !canManagePermissions(u)) navigate("/");
    }).catch(() => navigate("/"));
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["permissions-users"],
    queryFn: () => base44.entities.User.list("-created_date", 500),
    enabled: !!currentUser && canManagePermissions(currentUser),
  });

  const adminCount = users.filter(u => u.role === "admin").length;

  const filteredUsers = users.filter(u => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (u.full_name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      if (!name.includes(q) && !email.includes(q)) return false;
    }
    return true;
  });

  const handleSave = async (userId) => {
    const newRole = editingRoles[userId];
    if (!newRole) return;
    setSavingId(userId);
    setError("");
    try {
      const res = await base44.functions.invoke("updateUserRole", {
        target_user_id: userId,
        new_role: newRole,
      });
      const data = res.data || res;
      if (!data.ok) throw new Error(data.error || "שגיאה בעדכון תפקיד");
      setEditingRoles(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["permissions-users"] });
    } catch (err) {
      setError(err.message || "שגיאה בעדכון תפקיד");
    } finally {
      setSavingId(null);
    }
  };

  const handleCancel = (userId) => {
    setEditingRoles(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    setError("");
  };

  if (!currentUser || isLoading) {
    return (
      <div className="flex items-center justify-center py-20" dir="rtl">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          ניהול הרשאות
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {users.length} משתמשי מערכת · {adminCount} מנהלי מערכת
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="חיפוש לפי שם או אימייל..."
            className="pr-9 h-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {[
            { key: "all", label: `הכל (${users.length})` },
            { key: "admin", label: `מנהלי מערכת (${users.filter(u => u.role === "admin").length})` },
            { key: "manager", label: `מנהלים (${users.filter(u => u.role === "manager").length})` },
            { key: "user", label: `משתמשים (${users.filter(u => u.role === "user").length})` },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setRoleFilter(opt.key)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${roleFilter === opt.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-3 font-semibold">שם</th>
                  <th className="p-3 font-semibold">אימייל</th>
                  <th className="p-3 font-semibold">תפקיד נוכחי</th>
                  <th className="p-3 font-semibold">שינוי תפקיד</th>
                  <th className="p-3 font-semibold w-[120px]">פעולה</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const isLastAdmin = u.role === "admin" && adminCount <= 1;
                  const selectValue = editingRoles[u.id] !== undefined ? editingRoles[u.id] : u.role;
                  const hasChanged = editingRoles[u.id] !== undefined && editingRoles[u.id] !== u.role;
                  return (
                    <tr key={u.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{u.full_name || "—"}</td>
                      <td className="p-3 text-xs" dir="ltr">{u.email || "—"}</td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium">
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <Select
                          value={selectValue}
                          onValueChange={(v) => setEditingRoles(prev => ({ ...prev, [u.id]: v }))}
                          disabled={isLastAdmin}
                        >
                          <SelectTrigger className="h-8 text-xs w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">מנהל מערכת</SelectItem>
                            <SelectItem value="manager">מנהל</SelectItem>
                            <SelectItem value="user">משתמש</SelectItem>
                          </SelectContent>
                        </Select>
                        {isLastAdmin && (
                          <p className="text-[10px] text-amber-600 mt-0.5">אדמין יחיד — לא ניתן לשנות</p>
                        )}
                      </td>
                      <td className="p-3">
                        {hasChanged && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => handleSave(u.id)}
                              disabled={savingId === u.id}
                            >
                              {savingId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                              שמור
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleCancel(u.id)}
                            >
                              ביטול
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
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