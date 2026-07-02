import { cn } from "@/lib/utils";
import { isTicketSlaBreached, getDeadlineMs } from "@/lib/slaAgent";

const PRINTING_CLOSED_STATUSES = ["נסגרה", "הושלם", "בוטל"];

export function isPrintingTicketUrgent(ticket) {
  return ticket?.is_printing_package_request === true &&
    !PRINTING_CLOSED_STATUSES.includes(ticket?.status);
}

export function getPrintingHighlightClass(ticket) {
  if (!isPrintingTicketUrgent(ticket)) return "";
  const deadlineMs = getDeadlineMs(ticket);
  if (!deadlineMs) return "border-red-300 bg-red-50";
  const diffMs = deadlineMs - Date.now();
  const diffMin = diffMs / 60000;
  if (diffMs <= 0 || isTicketSlaBreached(ticket)) return "border-red-500 bg-red-100 animate-pulse";
  if (diffMin <= 2) return "border-red-500 bg-red-100 animate-pulse";
  return "border-red-300 bg-red-50";
}

export function getPrintingBadgeInfo(ticket) {
  if (!ticket?.is_printing_package_request) return null;
  if (!isPrintingTicketUrgent(ticket)) return null;

  const deadlineMs = getDeadlineMs(ticket);
  if (!deadlineMs) return { label: "הדפסות — SLA 5 דק׳", className: "border-red-300 bg-red-50 text-red-700", pulse: false };

  const diffMs = deadlineMs - Date.now();
  const diffMin = diffMs / 60000;

  if (diffMs <= 0 || isTicketSlaBreached(ticket)) {
    return { label: "חריגה — חבילת הדפסה", className: "border-red-500 bg-red-100 text-red-800", pulse: true };
  }
  if (diffMin <= 2) {
    return { label: "דחוף מאוד", className: "border-red-500 bg-red-100 text-red-800", pulse: true };
  }
  return { label: "הדפסות — SLA 5 דק׳", className: "border-red-300 bg-red-50 text-red-700", pulse: false };
}

export default function PrintingBadge({ ticket, className }) {
  const info = getPrintingBadgeInfo(ticket);
  if (!info) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap",
        info.className,
        className,
        info.pulse && "animate-pulse"
      )}
    >
      {info.label}
    </span>
  );
}