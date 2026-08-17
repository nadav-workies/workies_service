import { WORK_STATUS_ORDER, WORK_STATUS_LABELS, normalizeStatus } from "@/lib/contentBoardConfig";

const KPI_STATUSES = WORK_STATUS_ORDER.filter((s) => s !== "dismissed");

export default function ContentKPIBar({ items, activeStatus, onSelect }) {
  const counts = {};
  items.forEach((it) => {
    const s = normalizeStatus(it.status);
    counts[s] = (counts[s] || 0) + 1;
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
      {KPI_STATUSES.map((s) => (
        <button key={s}
          onClick={() => onSelect(activeStatus === s ? "" : s)}
          className={`rounded-lg border p-2 text-center transition-colors ${
            activeStatus === s ? "border-primary bg-primary/10" : "bg-card hover:bg-muted/50"
          }`}>
          <p className="text-lg font-bold leading-none">{counts[s] || 0}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{WORK_STATUS_LABELS[s]}</p>
        </button>
      ))}
    </div>
  );
}