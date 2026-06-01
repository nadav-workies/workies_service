import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, UrgencyBadge } from "@/components/tickets/TicketStatusBadge";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle, ChevronLeft } from "lucide-react";

export default function SLAReport() {
  const navigate = useNavigate();
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.ServiceTicket.list('-created_date', 500),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const now = new Date();
  
  const breachedOpen = tickets.filter(t => t.status !== 'נסגרה' && new Date(t.sla_target) < now);
  const breachedClosed = tickets.filter(t => t.sla_breached === true && t.status === 'נסגרה');
  const allBreached = [...breachedOpen, ...breachedClosed];

  // Stats
  const totalClosed = tickets.filter(t => t.status === 'נסגרה').length;
  const onTimeClosed = totalClosed - breachedClosed.length;
  const slaRate = totalClosed > 0 ? Math.round((onTimeClosed / totalClosed) * 100) : 100;

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">דוח חריגות SLA</h1>
        <p className="text-muted-foreground text-sm mt-1">מעקב אחר קריאות שחרגו מזמן היעד</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">סה״כ חריגות</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{allBreached.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">חריגות פתוחות</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">{breachedOpen.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">חריגות שנסגרו</p>
            <p className="text-3xl font-bold mt-1">{breachedClosed.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">אחוז עמידה ב-SLA</p>
            <p className={`text-3xl font-bold mt-1 ${slaRate >= 80 ? 'text-green-600' : 'text-red-600'}`}>{slaRate}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            קריאות חורגות SLA ({allBreached.length})
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
                    <TableHead className="text-right">תקלה</TableHead>
                    <TableHead className="text-right">דחיפות</TableHead>
                    <TableHead className="text-right">סטטוס</TableHead>
                    <TableHead className="text-right">יעד SLA</TableHead>
                    <TableHead className="text-right">סיבת חריגה</TableHead>
                    <TableHead className="w-[30px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allBreached.map(t => (
                    <TableRow
                      key={t.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => navigate(`/tickets/${t.id}`)}
                    >
                      <TableCell className="font-mono text-xs">{t.ticket_number}</TableCell>
                      <TableCell className="font-medium text-sm">{t.client_name}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{t.issue_description}</TableCell>
                      <TableCell><UrgencyBadge urgency={t.urgency} /></TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                      <TableCell className="text-xs">{format(new Date(t.sla_target), "dd/MM HH:mm")}</TableCell>
                      <TableCell className="text-xs">{t.sla_breach_reason || "—"}</TableCell>
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