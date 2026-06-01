import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Ticket, Clock, AlertTriangle, AlertCircle, Timer, TrendingUp } from "lucide-react";

function KPICard({ title, value, icon: Icon, color }) {
  const iconBg = color?.includes("red") ? "bg-red-50" : color?.includes("amber") ? "bg-amber-50" : color?.includes("green") ? "bg-emerald-50" : color?.includes("blue") ? "bg-blue-50" : "bg-primary/5";
  return (
    <Card className="p-4">
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
  const now = new Date();
  const open = tickets.filter(t => t.status !== 'נסגרה');
  const inProgress = tickets.filter(t => ['בטיפול', 'שויכה לטיפול'].includes(t.status));
  const breached = open.filter(t => t.sla_deadline && new Date(t.sla_deadline) < now);
  const critical = open.filter(t => t.priority === 'קריטית');

  const closedTickets = tickets.filter(t => t.status === 'נסגרה' && t.closed_at);
  let avgHours = 0;
  if (closedTickets.length > 0) {
    const totalMs = closedTickets.reduce((s, t) => s + (new Date(t.closed_at) - new Date(t.created_date)), 0);
    avgHours = Math.round(totalMs / closedTickets.length / 3600000);
  }

  const closedOnTime = closedTickets.filter(t => !t.sla_breached).length;
  const slaRate = closedTickets.length > 0 ? Math.round((closedOnTime / closedTickets.length) * 100) : 100;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <KPICard title="פתוחות" value={open.length} icon={Ticket} />
      <KPICard title="בטיפול" value={inProgress.length} icon={Clock} color="text-blue-600" />
      <KPICard title="חריגות SLA" value={breached.length} icon={AlertTriangle} color="text-red-600" />
      <KPICard title="קריטיות" value={critical.length} icon={AlertCircle} color="text-amber-600" />
      <KPICard title="ממוצע טיפול" value={`${avgHours}ש׳`} icon={Timer} color="text-indigo-600" />
      <KPICard title="עמידה SLA" value={`${slaRate}%`} icon={TrendingUp} color={slaRate >= 80 ? "text-green-600" : "text-red-600"} />
    </div>
  );
}