import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, PriorityBadge } from "@/components/tickets/TicketStatusBadge";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle, ChevronLeft, ShieldAlert } from "lucide-react";
import { isManagerOrAdmin } from "@/lib/slaUtils";

export default function SLAReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setUserLoading(false); }).catch(() => setUserLoading(false));
  }, []);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.ServiceTicket.list('-created_date', 500),
    enabled: !userLoading && isManagerOrAdmin(user),
  });

  if (userLoading || isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!isManagerOrAdmin(user)) return <div className="text-center py-20 text-muted-foreground">אין הרשאה לצפות בדף זה</div>;

  const now = new Date();
  const breachedOpen = tickets.filter(t => t.status !== 'נסגרה' && t.sla_deadline && new Date(t.sla_deadline) < now);
  const breachedClosed = tickets.filter(t => t.sla_breached === true && t.status === 'נסגרה');
  const allBreached = [...breachedOpen, ...breachedClosed];
  const totalClosed = tickets.filter(t => t.status === 'נסגרה').length;
  const slaRate = totalClosed > 0 ? Math.round(((totalClosed - breachedClosed.length) / totalClosed) * 100) : 100;

  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          דוח חריגות SLA
        </h1>
        <p className="text-muted-foreground text-sm mt-1">קריאות שחרגו מזמן היעד</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">סה״כ חריגות</p><p className="text-2xl font-bold text-red-600 mt-1">{allBreached.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">פתוחות</p><p className="text-2xl font-bold text-orange-600 mt-1">{breachedOpen.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">שנסגרו בחריגה</p><p className="text-2xl font-bold mt-1">{breachedClosed.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">עמידה ב-SLA</p><p className={`text-2xl font-bold mt-1 ${slaRate >= 80 ? 'text-green-600' : 'text-red-600'}`}>{slaRate}%</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            קריאות חורגות ({allBreached.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allBreached.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">אין חריגות SLA 🎉</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right">מס׳ קריאה</TableHead>
                    <TableHead className="text-right">לקוח</TableHead>
                    <TableHead className="text-right">סוג קריאה</TableHead>
                    <TableHead className="text-right">דחיפות</TableHead>
                    <TableHead className="text-right">סטטוס</TableHead>
                    <TableHead className="text-right">יעד SLA</TableHead>
                    <TableHead className="text-right">סיבת חריגה</TableHead>
                    <TableHead className="w-[30px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allBreached.map(t => (
                    <TableRow key={t.id} className="cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/tickets/${t.id}`)}>
                      <TableCell className="font-mono text-xs">{t.ticket_number}</TableCell>
                      <TableCell className="text-sm font-medium">{t.customer_name}</TableCell>
                      <TableCell className="text-xs">{t.ticket_type || '—'}</TableCell>
                      <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                      <TableCell className="text-xs">{t.sla_deadline ? format(new Date(t.sla_deadline), "dd/MM HH:mm") : '—'}</TableCell>
                      <TableCell className="text-xs">{t.sla_breach_reason || '—'}</TableCell>
                      <TableCell><ChevronLeft className="w-4 h-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}