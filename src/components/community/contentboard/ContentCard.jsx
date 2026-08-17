import { CheckCircle2, XCircle } from "lucide-react";
import {
  WORK_STATUS_LABELS, WORK_STATUS_COLORS, normalizeStatus,
  OUTPUT_TYPE_LABELS, hebDate, effectiveDate,
} from "@/lib/contentBoardConfig";
import { PLATFORM_LABELS, PLATFORM_COLORS } from "@/lib/communityConfig";

export default function ContentCard({ item, onClick }) {
  const status = normalizeStatus(item.status);
  return (
    <button onClick={onClick}
      className="w-full text-right border rounded-lg p-2 bg-card hover:border-primary/50 transition-colors space-y-1">
      <div className="flex items-start gap-1">
        <p className="flex-1 text-xs font-semibold leading-snug line-clamp-2">{item.title || item.topic}</p>
        {item.final_approved && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />}
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {item.output_type && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {OUTPUT_TYPE_LABELS[item.output_type]}
          </span>
        )}
        {item.platform && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${PLATFORM_COLORS[item.platform] || "bg-gray-100"}`}>
            {PLATFORM_LABELS[item.platform] || item.platform}
          </span>
        )}
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${WORK_STATUS_COLORS[status]}`}>
          {WORK_STATUS_LABELS[status]}
        </span>
        {item.execution_status === "done" && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" /> בוצע
          </span>
        )}
        {item.execution_status === "not_done" && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
            <XCircle className="w-2.5 h-2.5" /> לא בוצע
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="truncate">{item.related_customer_name || ""}</span>
        <span>{hebDate(effectiveDate(item))}</span>
      </div>
    </button>
  );
}