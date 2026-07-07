import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle, Flame } from "lucide-react";
import { isTicketSlaBreached } from "@/lib/slaAgent.js";

function DistCard({ title, value, sub, icon: Icon, color, onClick }) {
  const iconBg = color?.includes("red") ? "bg-red-50" : color?.includes("amber") ? "bg-amber-50" : color?.includes("blue") ? "bg-blue-50" : "bg-primary/5";
  return (
    <Card
      onClick={onClick}
      className="p-4 cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className={cn("text-2xl font-bold mt-1 tracking-tight", color)}>{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={cn("p-2 rounded-lg", iconBg)}>
          <Icon className={cn("w-4 h-4", color || "text-primary")} />
        </div>
      </div>
    </Card>
  );
}

/**
 * TicketDistributionCards — שורת פילוג: בטיפול, חורגות, רמת תיעדוף.
 * openTickets — קריאות פתוחות חיות (ללא תלות בתקופה).
 */
export default function TicketDistributionCards({ openTickets, nowMs, selectedRange }) {
  const navigate = useNavigate();

  const inTreatment = openTickets.filter(t => ['בטיפול', 'שויכה לטיפול'].includes(t.status));
  const breached    = openTickets.filter(t => isTicketSlaBreached(t, nowMs));
  const critical    = openTickets.filter(t => t.priority === 'קריטית');
  const high        = openTickets.filter(t => t.priority === 'גבוהה');

  const rangeParams = selectedRange ? `&from=${selectedRange.dateFrom}&to=${selectedRange.dateTo}` : '';
  const go = (kpi) => navigate(`/tickets?kpi=${kpi}${rangeParams}`);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <DistCard title="בטיפול" value={inTreatment.length} sub={`מתוך ${openTickets.length} פתוחות`} icon={Clock} color="text-blue-600" onClick={() => go('inProgress')} />
      <DistCard title="חורגות SLA" value={breached.length} sub="דורשות טיפול מיידי" icon={AlertTriangle} color="text-red-600" onClick={() => go('breached')} />
      <DistCard title="רמת תיעדוף" value={critical.length} sub={`${high.length} בעדיפות גבוהה`} icon={Flame} color="text-amber-600" onClick={() => go('critical')} />
    </div>
  );
}