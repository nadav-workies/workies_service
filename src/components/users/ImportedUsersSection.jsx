import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, MailCheck, UserPlus, CheckCircle2, Send } from "lucide-react";
import { format } from "date-fns";

const roleLabel = (role) => {
  if (role === 'admin') return 'מנהל מערכת';
  if (role === 'manager') return 'מנהל';
  return 'משתמש';
};

export default function ImportedUsersSection() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("pending"); // pending | all
  const [invitingId, setInvitingId] = useState(null);
  const [invitingAll, setInvitingAll] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);

  const { data: importedUsers = [], isLoading } = useQuery({
    queryKey: ["imported-users"],
    queryFn: () => base44.entities.ImportedUser.list("-imported_at", 500),
  });

  const pendingUsers = importedUsers.filter(u => !u.registered);
  const registeredUsers = importedUsers.filter(u => u.registered);
  const displayed = filter === "pending" ? pendingUsers : importedUsers;

  const handleInvite = async (user) => {
    setInvitingId(user.id);
    setInviteMsg(null);
    try {
      const res = await base44.functions.invoke("sendUserInvitation", { imported_user_id: user.id });
      const data = res.data || res;
      if (data.ok) {
        setInviteMsg({ type: "success", text: `הזמנה נשלחה ל-${user.email}` });
        queryClient.invalidateQueries({ queryKey: ["imported-users"] });
      } else {
        setInviteMsg({ type: "error", text: data.error || "שגיאה בשליחת הזמנה" });
      }
    } catch (err) {
      setInviteMsg({ type: "error", text: err.message || "שגיאה בשליחת הזמנה" });
    } finally {
      setInvitingId(null);
      setTimeout(() => setInviteMsg(null), 4000);
    }
  };

  const handleInviteAll = async () => {
    setInvitingAll(true);
    setInviteMsg(null);
    let sent = 0;
    let failed = 0;
    for (const u of pendingUsers) {
      try {
        const res = await base44.functions.invoke("sendUserInvitation", { imported_user_id: u.id });
        const data = res.data || res;
        if (data.ok) sent++;
        else failed++;
      } catch {
        failed++;
      }
    }
    queryClient.invalidateQueries({ queryKey: ["imported-users"] });
    setInvitingAll(false);
    setInviteMsg({
      type: failed > 0 ? "error" : "success",
      text: `נשלחו ${sent} הזמנות${failed > 0 ? `, ${failed} נכשלו` : ""}`,
    });
    setTimeout(() => setInviteMsg(null), 5000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (importedUsers.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            חדשים במערכת
            <span className="text-xs font-normal text-muted-foreground">
              ({pendingUsers.length} ממתינים · {registeredUsers.length} נרשמו)
            </span>
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              <button
                onClick={() => setFilter("pending")}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${filter === "pending" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
              >
                ממתינים ({pendingUsers.length})
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${filter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
              >
                הכל ({importedUsers.length})
              </button>
            </div>
            {pendingUsers.length > 0 && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleInviteAll} disabled={invitingAll}>
                {invitingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                הזמן את כולם ({pendingUsers.length})
              </Button>
            )}
          </div>
        </div>
        {inviteMsg && (
          <div className={`text-xs rounded-lg px-3 py-1.5 mt-2 ${inviteMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {inviteMsg.text}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {displayed.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            {filter === "pending" ? "אין משתמשים ממתינים להזמנה" : "אין משתמשים מיובאים"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-2 font-semibold">שם</th>
                  <th className="p-2 font-semibold">מייל</th>
                  <th className="p-2 font-semibold">טלפון</th>
                  <th className="p-2 font-semibold">חדר</th>
                  <th className="p-2 font-semibold">תפקיד</th>
                  <th className="p-2 font-semibold">סטטוס</th>
                  <th className="p-2 font-semibold">הזמנות</th>
                  <th className="p-2 font-semibold">פעולה</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(u => (
                  <tr key={u.id} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{u.full_name || "—"}</td>
                    <td className="p-2 text-xs" dir="ltr">{u.email}</td>
                    <td className="p-2 text-xs" dir="ltr">{u.phone || "—"}</td>
                    <td className="p-2 text-xs">
                      {u.room_label || u.room_number || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-2 text-xs">{roleLabel(u.role)}</td>
                    <td className="p-2">
                      {u.registered ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          נרשם
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                          <UserPlus className="w-3 h-3" />
                          ממתין
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {u.invite_count > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <MailCheck className="w-3 h-3" />
                          {u.invite_count}×
                          {u.invited_at && <span className="text-[10px]">({format(new Date(u.invited_at), "dd/MM")})</span>}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-2">
                      {!u.registered && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1.5"
                          onClick={() => handleInvite(u)}
                          disabled={invitingId === u.id || invitingAll}
                        >
                          {invitingId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                          שלח הזמנה
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}