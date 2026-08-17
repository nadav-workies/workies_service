import { WORK_STATUS_ORDER, WORK_STATUS_LABELS, CONTENT_FORMAT_LABELS } from "@/lib/contentBoardConfig";
import { PLATFORM_LABELS } from "@/lib/communityConfig";

export default function ContentBoardFilters({ filters, setFilters, customers }) {
  const set = (k, v) => setFilters((p) => ({ ...p, [k]: v }));
  const selectCls = "h-8 px-2 rounded-md border bg-background text-xs min-w-0";

  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5">
      <select className={selectCls} value={filters.status} onChange={(e) => set("status", e.target.value)}>
        <option value="">כל הסטטוסים</option>
        {WORK_STATUS_ORDER.map((s) => <option key={s} value={s}>{WORK_STATUS_LABELS[s]}</option>)}
      </select>
      <select className={selectCls} value={filters.platform} onChange={(e) => set("platform", e.target.value)}>
        <option value="">כל הפלטפורמות</option>
        {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <select className={selectCls} value={filters.content_format} onChange={(e) => set("content_format", e.target.value)}>
        <option value="">כל סוגי התוכן</option>
        {Object.entries(CONTENT_FORMAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <select className={selectCls} value={filters.customer} onChange={(e) => set("customer", e.target.value)}>
        <option value="">כל הלקוחות</option>
        {customers.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}