import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Wrench, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { canManageMaintenancePlan } from "@/lib/permissions";

export default function MaintenanceKpiCard({ user }) {
  const navigate = useNavigate();
  const { data: tasks = [] } = useQuery({
    queryKey: ["maintenance-tasks-dash"],
    queryFn: () => base44.entities.MaintenanceTask.list("-planned_date", 500),
    enabled: !!user && canManageMaintenancePlan(user),
  });

  if (!canManageMaintenancePlan(user)) return null;

  const opened = tasks.length;
  const done = tasks.filter(t => t.status === "done" || t.status === "checked").length;
  const pending = tasks.filter(t => t.status === "planned" || t.status === "in_progress").length;

  return (
    <button
      onClick={() => navigate("/maintenance-plan")}
      className="flex items-center gap-3 bg-card border rounded-xl p-3 text-right hover:shadow-md transition-shadow w-full"
      dir="rtl"
    >
      <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
        <Wrench className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">תוכנית תחזוקה</p>
        <p className="text-sm font-semibold">נפתחו {opened} · בוצעו {done}</p>
        {pending > 0 && <p className="text-[10px] text-orange-600">{pending} ממתינות לביצוע</p>}
      </div>
      <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}