import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/tickets/TicketStatusBadge";
import { format, subMonths } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldAlert, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, MinusCircle } from "lucide-react";
import { isManagerOrAdmin } from "@/lib/slaUtils";
import {
  calculateMonthlySlaMetrics,
  getCurrentMonthRange,
  getMonthRange,
  formatDuration,
} from "@/lib/slaAgent.js";

const MONTH_LABELS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];

export default function SLAReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setUserLoading(false); }).catch(() => setUserLoading(false));
  }, []);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets-sla-report'],
    queryFn: () => base44.entities.ServiceTicket.list('-opened_at_ms', 1000),
    enabled: !userLoading && isManagerOrAdmin(user),
  });

  if (userLoading || isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!isManagerOrAdmin(user)) return <div className="text-center py-20 text-muted-foreground">אין הרשאה לצפות בדף זה</div>;

  const range = getMonthRange(selectedDate.getFullYear(), selectedDate.getMonth());
  const metrics = calculateMonthlySlaMetrics(tickets, range);

  const prevMonth = () => setSelectedDate(d => subMonths(d, 1));
  const nextMonth = () => {
    const next = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    if (next <= new Date()) setSelectedDate(next);
  };
  const isCurrentMonth = selectedDate.getMonth() === new Date().getMonth() && selectedDate.getFullYear() === new Date().getFullYear();

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            דוח SLA
          </h1>
          <p className="text-muted-foreground text-sm mt-1">מדידת עמידה ב-SLA לפי חודש</p>
        </div>
        {/* Month picker */}
        <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prevMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {MONTH_LABELS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={nextMonth} disabled={isCurrentMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="עמידה ב-SLA"
          value={metrics.slaCompliance !== null ? `${metrics.slaCompliance}%` : "אין נתונים"}
          color={metrics.slaCompliance !== null ? (metrics.slaCompliance >= 80 ? "text-green-600" : "text-red-600") : "text-muted-foreground"}
          sub={metrics.totalMeasured > 0 ? `${metrics.closedOnTime} מתוך ${metrics.totalMeasured} קריאות` : "אין קריאות למדידה"}
        />
        <MetricCard
          label="סה״כ חריגות"
          value={metrics.totalBreached}
          color="text-red-600"
          sub={`${metrics.breachedOpen} פתוחות · ${metrics.breachedClosed} שנסגרו בחריגה`}
        />
        <MetricCard
          label="ממוצע זמן טיפול"
          value={metrics.averageHandlingTimeMs !== null ? formatDuration(metrics.averageHandlingTimeMs) : "אין נתונים"}
          color="text-indigo-600"
          sub={metrics.closedTickets > 0 ? `${metrics.closedTickets} קריאות סגורות` : "אין קריאות סגורות"}
        />
        <MetricCard
          label="סה״כ קריאות בחודש"
          value={metrics.totalTickets}
          color="text-foreground"
          sub={`${metrics.openTickets} פתוחות · ${metrics.closedTickets} סגורות`}
        />
      </div>

      {/* Breached open tickets */}
      <TicketSection
        title={`קריאות פתוחות שחרגו SLA (${metrics.breachedOpenList.length})`}
        icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
        tickets={metrics.breachedOpenList}
        navigate={navigate}
        emptyMsg="אין קריאות פתוחות שחרגו SLA 🎉"
        showBreachReason={false}
      />

      {/* Breached closed tickets */}
      <TicketSection
        title={`קריאות שנסגרו בחריגה (${metrics.breachedClosedList.length})`}
        icon={<AlertTriangle className="w-4 h-4 text-orange-500" />}
        tickets={metrics.breachedClosedList}
        navigate={navigate}
        emptyMsg="אין קריאות שנסגרו בחריגה"
        showBreachReason={true}
      />

      {/* Excluded tickets — admin only */}
      {user?.role === 'admin' && metrics.excludedList.length > 0 && (
        <TicketSection
          title={`קריאות מוחרגות ממדידת SLA (${metrics.excludedList.length})`}
          icon={<MinusCircle className="w-4 h-4 text-slate-500" />}
          tickets={metrics.excludedList}
          navigate={navigate}
          emptyMsg=""
          showExclusion={true}
        />
      )}

      {/* No SLA data */}
      {metrics.noSlaDataCount > 0 && (
        <TicketSection
          title={`קריאות עם נתוני SLA חסרים (${metrics.noSlaDataList.length})`}
          icon={<CheckCircle className="w-4 h-4 text-slate-400" />}
          tickets={metrics.noSlaDataList}
          navigate={navigate}
          emptyMsg=""
          showNoData={true}
        />
      )}
    </div>
  );
}

function MetricCard({ label, value, color, sub }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function TicketSection({ title, icon, tickets, navigate, emptyMsg, showBreachReason, showExclusion, showNoData }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon}{title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground text-sm">{emptyMsg}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right">מס׳ קריאה</TableHead>
                  <TableHead className="text-right">לקוח</TableHead>
                  <TableHead className="text-right">סוג</TableHead>
                  <TableHead className="text-right">דחיפות</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">יעד SLA</TableHead>
                  {showBreachReason && <TableHead className="text-right">סיבת חריגה</TableHead>}
                  {showExclusion && <TableHead className="text-right">סיבת החרגה</TableHead>}
                  <TableHead className="w-[30px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map(t => (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/tickets/${t.id}`)}>
                    <TableCell className="font-mono text-xs">{t.ticket_number}</TableCell>
                    <TableCell className="text-sm font-medium">{t.customer_name}</TableCell>
                    <TableCell className="text-xs">{t.ticket_type || '—'}</TableCell>
                    <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-xs">
                      {t.sla_deadline ? format(new Date(t.sla_deadline), "dd/MM HH:mm") : '—'}
                    </TableCell>
                    {showBreachReason && <TableCell className="text-xs">{t.sla_breach_reason || '—'}</TableCell>}
                    {showExclusion && <TableCell className="text-xs">{t.sla_exclusion_reason || '—'}</TableCell>}
                    <TableCell><ChevronLeft className="w-4 h-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}