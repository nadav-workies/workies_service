import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Ticket, Clock, AlertTriangle, AlertCircle, Timer, TrendingUp } from "lucide-react";

function KPICard({ title, value, subtitle, icon: Icon, color, trend }) {
  return (
    <Card className="p-5 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className={cn("text-3xl font-bold tracking-tight", color)}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("p-2.5 rounded-xl", color?.includes("red") ? "bg-red-50" : color?.includes("amber") ? "bg-amber-50" : color?.includes("green") ? "bg-emerald-50" : "bg-primary/5")}>
          <Icon className={cn("w-5 h-5", color || "text-primary")} />
        </div>
      </div>
    </Card>
  );
}

export default function KPICards({ tickets }) {
  const openTickets = tickets.filter(t => t.status !== 'נסגרה');
  const inProgress = tickets.filter(t => ['בטיפול', 'שויכה לטיפול'].includes(t.status));
  
  const now = new Date();
  const breached = openTickets.filter(t => new Date(t.sla_target) < now);
  const critical = openTickets.filter(t => t.urgency === 'קריטית');
  
  const closedTickets = tickets.filter(t => t.status === 'נסגרה' && t.closed_date);
  let avgTime = 0;
  if (closedTickets.length > 0) {
    const totalMs = closedTickets.reduce((sum, t) => {
      return sum + (new Date(t.closed_date) - new Date(t.created_date));
    }, 0);
    avgTime = Math.round(totalMs / closedTickets.length / (1000 * 60 * 60));
  }

  const closedOnTime = closedTickets.filter(t => !t.sla_breached).length;
  const slaPercent = closedTickets.length > 0 ? Math.round((closedOnTime / closedTickets.length) * 100) : 100;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <KPICard
        title="קריאות פתוחות"
        value={openTickets.length}
        icon={Ticket}
      />
      <KPICard
        title="בטיפול"
        value={inProgress.length}
        icon={Clock}
        color="text-blue-600"
      />
      <KPICard
        title="חריגות SLA"
        value={breached.length}
        icon={AlertTriangle}
        color="text-red-600"
      />
      <KPICard
        title="קריטיות"
        value={critical.length}
        icon={AlertCircle}
        color="text-amber-600"
      />
      <KPICard
        title="זמן טיפול ממוצע"
        value={`${avgTime} שע׳`}
        icon={Timer}
        color="text-indigo-600"
      />
      <KPICard
        title="עמידה ב-SLA"
        value={`${slaPercent}%`}
        icon={TrendingUp}
        color={slaPercent >= 80 ? "text-green-600" : "text-red-600"}
      />
    </div>
  );
}