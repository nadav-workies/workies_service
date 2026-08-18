import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Wrench, CheckCircle2, Clock4, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { canManageMaintenancePlan, canApproveMaintenancePlan } from "@/lib/permissions";

export default function MaintenanceKpiCard({ user }) {
  const navigate = useNavigate();
  const { data: tasks = [] } = useQuery({
    queryKey: ["maintenance-tasks-dash"],
    queryFn: () => base44.entities.MaintenanceTask.list("-planned_date", 500),
    enabled: !!user && canManageMaintenancePlan(user),
  });

  if (!canManageMaintenancePlan(user)) return null;

  const pending = tasks.filter(t => (t.approval_status || "pending_approval") === "pending_approval").length;
  const approved = tasks.filter(t => t.approval_status === "approved").length;
  const done = tasks.filter(t => t.approval_status === "approved" && (t.status === "done" || t.status === "checked")).length;
  const canApprove = canApproveMaintenancePlan(user);

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
        <p className="text-sm font-semibold flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="flex items-center gap-1 text-amber-600"><Clock4 className="w-3.5 h-3.5" />{pending} ממתינות</span>
          <span className="text-muted-300">·</span>
          <span className="flex items-center gap-1 text-green-600"><ShieldCheck className="w-3.5 h-3.5" />{approved} אושרו</span>
          <span className="text-muted-300">·</span>
          <span className="flex items-center gap-1 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" />{done} בוצעו</span>
        </p>
        {canApprove && pending > 0 && <p className="text-[11px] text-amber-700 font-medium mt-0.5">נדרש אישור מנהל תפעול — {pending} משימות ממתינות</p>}
      </div>
    </button>
  );
}