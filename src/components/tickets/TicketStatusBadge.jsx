import { cn } from "@/lib/utils";
import { STATUS_COLORS, PRIORITY_COLORS } from "@/lib/slaUtils";
import { getTimeRemainingLabel, getDeadlineMs } from "@/lib/slaAgent.js";

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

// SlaBadge מקבל ticket מלא — לא slaDeadline בלבד
export function SlaBadge({ ticket, status }) {
  const resolvedStatus = status || ticket?.status;
  if (resolvedStatus === 'נסגרה') return <span className="text-xs text-muted-foreground">נסגרה</span>;
  if (!ticket) return <span className="text-xs text-muted-foreground">—</span>;

  const deadlineMs = getDeadlineMs(ticket);
  if (!deadlineMs) return <span className="text-xs text-muted-foreground">—</span>;

  const { text, breached } = getTimeRemainingLabel(ticket);
  const diffMin = (deadlineMs - Date.now()) / 60000;

  if (breached) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">⚠ {text}</span>;
  }
  if (diffMin <= 30) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{text}</span>;
  }
  return <span className="text-xs text-muted-foreground">{text}</span>;
}