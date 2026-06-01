import { cn } from "@/lib/utils";
import { STATUS_COLORS, PRIORITY_COLORS, getTimeRemainingLabel } from "@/lib/slaUtils";

export function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700';
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", cls)}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const cls = PRIORITY_COLORS[priority] || 'bg-slate-100 text-slate-700';
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", cls)}>
      {priority}
    </span>
  );
}

export function SlaBadge({ slaDeadline, status }) {
  if (status === 'נסגרה') return <span className="text-xs text-muted-foreground">נסגרה</span>;
  if (!slaDeadline) return <span className="text-xs text-muted-foreground">—</span>;

  const { text, breached } = getTimeRemainingLabel(slaDeadline);
  const now = new Date();
  const deadline = new Date(slaDeadline);
  const diffMin = (deadline - now) / 60000;

  if (breached) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">⚠ {text}</span>;
  }
  if (diffMin <= 30) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{text}</span>;
  }
  return <span className="text-xs text-muted-foreground">{text}</span>;
}