import {
  WORK_STATUS_LABELS, WORK_STATUS_COLORS, normalizeStatus,
  CONTENT_FORMAT_LABELS, hebDate, effectiveDate,
} from "@/lib/contentBoardConfig";
import { PLATFORM_LABELS, PLATFORM_COLORS } from "@/lib/communityConfig";

export default function ContentCard({ item, onClick }) {
  const status = normalizeStatus(item.status);
  return (
    <button onClick={onClick}
      className="w-full text-right border rounded-lg p-2 bg-card hover:border-primary/50 transition-colors space-y-1">
      <p className="text-xs font-semibold leading-snug line-clamp-2">{item.title || item.topic}</p>
      <div className="flex items-center gap-1 flex-wrap">
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${PLATFORM_COLORS[item.platform] || "bg-gray-100"}`}>
          {PLATFORM_LABELS[item.platform] || item.platform}
        </span>
        {item.content_format && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {CONTENT_FORMAT_LABELS[item.content_format]}
          </span>
        )}
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${WORK_STATUS_COLORS[status]}`}>
          {WORK_STATUS_LABELS[status]}
        </span>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="truncate">{item.related_customer_name || ""}</span>
        <span>{hebDate(effectiveDate(item))}</span>
      </div>
    </button>
  );
}