import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Ticket, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { isTicketClosed } from "@/lib/slaAgent.js";

function KPICard({ title, value, icon: Icon, color, onClick }) {
  const iconBg = color?.includes("red") ? "bg-red-50" : color?.includes("amber") ? "bg-amber-50" : color?.includes("green") ? "bg-emerald-50" : color?.includes("blue") ? "bg-blue-50" : "bg-primary/5";
  return (
    <Card
      onClick={onClick}
      className={cn("p-4 transition-all duration-150", onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0")}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className={cn("text-2xl font-bold mt-1 tracking-tight", color)}>{value}</p>
        </div>
        <div className={cn("p-2 rounded-lg", iconBg)}>
          <Icon className={cn("w-4 h-4", color || "text-primary")} />
        </div>
      </div>
    </Card>
  );
}

/**
 * KPICards — 4 KPIs: סך הקריאות, כמה טופלו, חריגות SLA, אחוז עמידה SLA.
 * כל הנתונים מגיעים מ-calculateMonthlySlaMetrics (slaAgent) + tickets.
 */
export default function KPICards({ tickets, slaMetrics, selectedRange }) {
  const navigate = useNavigate();

  const totalCount     = tickets.length;
  const resolvedCount  = tickets.filter(t => isTicketClosed(t)).length;
  const breachedCount  = slaMetrics?.totalBreached ?? 0;
  const slaRate        = slaMetrics?.slaCompliance != null
    ? `${slaMetrics.slaCompliance}%`
    : 'אין נתונים';
  const slaColor       = slaMetrics?.slaCompliance != null
    ? (slaMetrics.slaCompliance >= 80 ? 'text-green-600' : 'text-red-600')
    : 'text-muted-foreground';

  const rangeParams = selectedRange
    ? `&from=${selectedRange.dateFrom}&to=${selectedRange.dateTo}`
    : '';
  const go = (kpi) => navigate(`/tickets?kpi=${kpi}${rangeParams}`);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard title="סך הקריאות" value={totalCount} icon={Ticket} onClick={() => go('all')} />
      <KPICard title="טופלו מתוכן" value={resolvedCount} icon={CheckCircle2} color="text-green-600" onClick={() => go('closed')} />
      <KPICard title="חריגות SLA" value={breachedCount} icon={AlertTriangle} color="text-red-600" onClick={() => go('breached')} />
      <KPICard title="אחוז עמידה SLA" value={slaRate} icon={TrendingUp} color={slaColor} onClick={() => go('slaRate')} />
    </div>
  );
}