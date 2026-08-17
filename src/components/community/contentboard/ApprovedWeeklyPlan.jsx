import { CalendarCheck } from "lucide-react";
import ExecutionControls from "./ExecutionControls";
import { PLATFORM_LABELS } from "@/lib/communityConfig";
import {
  OUTPUT_TYPE_LABELS, EXECUTION_STATUS_LABELS, FULL_DAY_ORDER, FULL_DAY_LABELS,
  effectiveDate, addDays, hebDate, normalizeStatus,
} from "@/lib/contentBoardConfig";

export default function ApprovedWeeklyPlan({ weekStart, items, onOpen, onChanged }) {
  const weekEnd = addDays(weekStart, 6);
  const approved = items
    .filter((it) => {
      const s = normalizeStatus(it.status);
      const d = effectiveDate(it);
      return (it.final_approved || s === "approved" || s === "published") && d && d >= weekStart && d <= weekEnd;
    })
    .sort((a, b) => (effectiveDate(a) || "").localeCompare(effectiveDate(b) || ""));

  return (
    <div className="border rounded-xl p-3 bg-card space-y-2">
      <p className="text-sm font-bold flex items-center gap-1.5">
        <CalendarCheck className="w-4 h-4 text-green-600" /> תוכנית שבועית מאושרת ({approved.length})
      </p>
      {approved.length === 0 ? (
        <p className="text-xs text-muted-foreground">אין עדיין תוכן מאושר לשבוע זה. תוכן נכנס לכאן רק אחרי "אשר תוצר סופי".</p>
      ) : (
        <div className="space-y-2">
          {approved.map((it) => {
            const d = effectiveDate(it);
            const dayLabel = d ? FULL_DAY_LABELS[FULL_DAY_ORDER[new Date(d + "T00:00:00").getDay()]] : "";
            return (
              <div key={it.id} className="border rounded-lg p-2 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold">{hebDate(d)} · {dayLabel}</span>
                  {it.output_type && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {OUTPUT_TYPE_LABELS[it.output_type]}
                    </span>
                  )}
                  {it.platform && (
                    <span className="text-[10px] text-muted-foreground">{PLATFORM_LABELS[it.platform] || it.platform}</span>
                  )}
                  <button className="text-xs font-medium hover:text-primary text-right flex-1 min-w-0 truncate" onClick={() => onOpen(it)}>
                    {it.title || it.topic}
                  </button>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    it.execution_status === "done" ? "bg-emerald-100 text-emerald-700"
                      : it.execution_status === "not_done" ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {EXECUTION_STATUS_LABELS[it.execution_status || "not_checked"]}
                  </span>
                </div>
                <ExecutionControls item={it} onChanged={onChanged} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}