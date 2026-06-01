import { cn } from "@/lib/utils";
import { STATUS_COLORS, URGENCY_COLORS } from "@/lib/slaUtils";

export function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS['פתוחה'];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", colors.bg)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
      {status}
    </span>
  );
}

export function UrgencyBadge({ urgency }) {
  const colors = URGENCY_COLORS[urgency] || URGENCY_COLORS['רגילה'];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", colors.bg)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
      {urgency}
    </span>
  );
}

export function SlaBadge({ slaTarget, status }) {
  if (status === 'נסגרה') {
    return <span className="text-xs text-muted-foreground">נסגרה</span>;
  }
  
  const now = new Date();
  const target = new Date(slaTarget);
  const diffMs = target - now;
  
  if (diffMs <= 0) {
    const overHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        ⚠ חריגה {overHours} שע׳
      </span>
    );
  }
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours < 2) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
        {hours} שע׳ {minutes} דק׳
      </span>
    );
  }
  
  return (
    <span className="text-xs text-muted-foreground">
      {hours > 24 ? `${Math.floor(hours / 24)} ימים` : `${hours} שע׳ ${minutes} דק׳`}
    </span>
  );
}