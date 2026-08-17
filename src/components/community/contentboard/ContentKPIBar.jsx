import { KPI_GROUPS, matchesKpi } from "@/lib/contentBoardConfig";

export default function ContentKPIBar({ items, activeKpi, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
      {KPI_GROUPS.map((g) => (
        <button key={g.key}
          onClick={() => onSelect(activeKpi === g.key ? "" : g.key)}
          className={`rounded-lg border p-2 text-center transition-colors ${
            activeKpi === g.key ? "border-primary bg-primary/10" : "bg-card hover:bg-muted/50"
          }`}>
          <p className="text-lg font-bold leading-none">{items.filter((it) => matchesKpi(it, g.key)).length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{g.label}</p>
        </button>
      ))}
    </div>
  );
}