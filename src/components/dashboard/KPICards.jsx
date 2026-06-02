import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Ticket, Clock, AlertTriangle, AlertCircle, Timer, TrendingUp } from "lucide-react";
import { formatDuration } from "@/lib/slaAgent.js";

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
 * KPICards — מקבל tickets ו-slaMetrics מבחוץ.
 * אינו מחשב SLA בעצמו — כל הנתונים מגיעים מ-calculateMonthlySlaMetrics (slaAgent).
 */
export default function KPICards({ tickets, slaMetrics }) {
  const navigate = useNavigate();
  const open = tickets.filter(t => t.status !== 'נסגרה');
  const inProgress = tickets.filter(t => ['בטיפול', 'שויכה לטיפול'].includes(t.status));
  const critical = open.filter(t => t.priority === 'קריטית');

  const breachedCount = slaMetrics?.totalBreached ?? 0;

  const avgLabel = slaMetrics?.averageHandlingTimeMs != null
    ? formatDuration(slaMetrics.averageHandlingTimeMs)
    : 'אין נתונים';

  const slaRate = slaMetrics?.slaCompliance != null
    ? `${slaMetrics.slaCompliance}%`
    : 'אין נתונים';

  const slaColor = slaMetrics?.slaCompliance != null
    ? (slaMetrics.slaCompliance >= 80 ? 'text-green-600' : 'text-red-600')
    : 'text-muted-foreground';

  const go = (params) => navigate(`/tickets?${new URLSearchParams(params).toString()}`);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <KPICard title="פתוחות" value={open.length} icon={Ticket} onClick={() => go({ kpi: 'open' })} />
      <KPICard title="בטיפול" value={inProgress.length} icon={Clock} color="text-blue-600" onClick={() => go({ kpi: 'inProgress' })} />
      <KPICard title="חריגות SLA" value={breachedCount} icon={AlertTriangle} color="text-red-600" onClick={() => go({ kpi: 'breached' })} />
      <KPICard title="קריטיות" value={critical.length} icon={AlertCircle} color="text-amber-600" onClick={() => go({ kpi: 'critical' })} />
      <KPICard title="ממוצע טיפול" value={avgLabel} icon={Timer} color="text-indigo-600" onClick={() => go({ kpi: 'closed' })} />
      <KPICard title="עמידה SLA" value={slaRate} icon={TrendingUp} color={slaColor} onClick={() => go({ kpi: 'slaRate' })} />
    </div>
  );
}