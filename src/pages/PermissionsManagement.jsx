import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { canManagePermissions } from "@/lib/permissions";
import { INTERNAL_ROLES } from "@/lib/internalRoles";
import RoleGuide from "@/components/permissions/RoleGuide";
import PermissionUserRow from "@/components/permissions/PermissionUserRow";

export default function PermissionsManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [internalFilter, setInternalFilter] = useState("all");
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

  if (!currentUser || isLoading) {
    return <div className="flex items-center justify-center py-20" dir="rtl"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const adminCount = users.filter(u => u.role === "admin").length;
  const q = searchQuery.toLowerCase();
  const filteredUsers = users.filter(u =>
    (roleFilter === "all" || u.role === roleFilter) &&
    (internalFilter === "all" || (internalFilter === "any" ? !!u.internal_role : u.internal_role === internalFilter)) &&
    (!q || (u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q))
  );
  const chips = [
    { key: "all", label: "הכל", count: users.length },
    { key: "admin", label: "מנהלי מערכת", count: adminCount },
    { key: "manager", label: "מנהלים", count: users.filter(u => u.role === "manager").length },
    { key: "user", label: "משתמשים", count: users.filter(u => u.role === "user").length },
  ];

  return <div className="max-w-6xl mx-auto space-y-5" dir="rtl">
    <div>
      <h1 className="text-xl font-bold flex items-center gap-2"><Shield className="w-5 h-5" />ניהול הרשאות</h1>
      <p className="text-sm text-muted-foreground mt-1">{users.length} משתמשי מערכת · {adminCount} מנהלי מערכת · שינויים נשמרים לכל משתמש בנפרד</p>
    </div>
    <RoleGuide />
    <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
      <div className="relative flex-1">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="חיפוש לפי שם או אימייל..." className="pr-9 h-10" />
      </div>
      <Select value={internalFilter} onValueChange={setInternalFilter}>
        <SelectTrigger className="h-10 lg:w-48" aria-label="סינון לפי תפקיד פנימי"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">כל התפקידים הפנימיים</SelectItem>
          <SelectItem value="any">עם תפקיד פנימי</SelectItem>
          {INTERNAL_ROLES.map(r => <SelectItem key={r.key} value={r.key}>{r.label} ({users.filter(u => u.internal_role === r.key).length})</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="flex gap-1 flex-wrap">
        {chips.map(c => <button key={c.key} type="button" onClick={() => setRoleFilter(c.key)}
          className={`px-3 min-h-10 rounded-full text-xs border ${roleFilter === c.key ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"}`}>{c.label} ({c.count})</button>)}
      </div>
    </div>
    <div className="space-y-2">
      {filteredUsers.map(u => <PermissionUserRow key={`${u.id}-${u.updated_date}`} user={u}
        isLastAdmin={u.role === "admin" && adminCount <= 1} canEditInternal={currentUser.role === "admin"}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["permissions-users"] })} />)}
      {filteredUsers.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">לא נמצאו משתמשים</p>}
    </div>
  </div>;
}