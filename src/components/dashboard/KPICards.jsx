import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Ticket, Clock, AlertTriangle, AlertCircle, Timer, TrendingUp } from "lucide-react";

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

export default function KPICards({ tickets }) {
  const navigate = useNavigate();
  const now = new Date();
  const open = tickets.filter(t => t.status !== 'נסגרה');
  const inProgress = tickets.filter(t => ['בטיפול', 'שויכה לטיפול'].includes(t.status));
  const breached = open.filter(t => t.sla_deadline && new Date(t.sla_deadline) < now);
  const critical = open.filter(t => t.priority === 'קריטית');

  const closedTickets = tickets.filter(t => ["טופלה", "נסגרה"].includes(t.status));
  const validForAvg = closedTickets.filter(t => {
    const start = t.created_date;
    const end = t.closed_at || t.resolved_at;
    return start && end && new Date(end) > new Date(start);
  });
  let avgLabel = "אין נתונים";
  if (validForAvg.length > 0) {
    const totalMs = validForAvg.reduce((s, t) => {
      const start = new Date(t.created_date).getTime();
      const end = new Date(t.closed_at || t.resolved_at).getTime();
      return s + (end - start);
    }, 0);
    const avgMs = totalMs / validForAvg.length;
    const totalMinutes = Math.round(avgMs / 60000);
    if (totalMinutes < 1) avgLabel = "פחות מדקה";
    else if (totalMinutes < 60) avgLabel = `${totalMinutes} דק׳`;
    else {
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      avgLabel = m === 0 ? `${h} שע׳` : `${h} שע׳ ${m} דק׳`;
    }
  }

  const closedOnTime = closedTickets.filter(t => !t.sla_breached).length;
  const slaRate = closedTickets.length > 0 ? Math.round((closedOnTime / closedTickets.length) * 100) : 100;

  const go = (params) => navigate(`/tickets?${new URLSearchParams(params).toString()}`);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <KPICard title="פתוחות" value={open.length} icon={Ticket} onClick={() => go({ kpi: 'open' })} />
      <KPICard title="בטיפול" value={inProgress.length} icon={Clock} color="text-blue-600" onClick={() => go({ kpi: 'inProgress' })} />
      <KPICard title="חריגות SLA" value={breached.length} icon={AlertTriangle} color="text-red-600" onClick={() => go({ kpi: 'breached' })} />
      <KPICard title="קריטיות" value={critical.length} icon={AlertCircle} color="text-amber-600" onClick={() => go({ kpi: 'critical' })} />
      <KPICard title="ממוצע טיפול" value={avgLabel} icon={Timer} color="text-indigo-600" onClick={() => go({ kpi: 'closed' })} />
      <KPICard title="עמידה SLA" value={`${slaRate}%`} icon={TrendingUp} color={slaRate >= 80 ? "text-green-600" : "text-red-600"} onClick={() => go({ kpi: 'slaRate' })} />
    </div>
  );
}