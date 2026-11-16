import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { CONSENT, SOURCES } from "@/lib/mailing";

const selectCls = "h-10 rounded-md border bg-background px-3 text-sm flex-1 sm:flex-none";

export default function ContactFilters({ filters, onChange }) {
  const set = (k, v) => onChange({ ...filters, [k]: v });
  return <div className="flex flex-wrap gap-2 items-center">
    <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
      <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input value={filters.q} onChange={e => set("q", e.target.value)} placeholder="חיפוש לפי שם, מייל, טלפון או חברה" className="pr-9" />
    </div>
    <select value={filters.consent} onChange={e => set("consent", e.target.value)} className={selectCls} aria-label="סינון לפי הסכמה">
      <option value="all">כל סטטוסי ההסכמה</option>
      {Object.entries(CONSENT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
    </select>
    <select value={filters.source} onChange={e => set("source", e.target.value)} className={selectCls} aria-label="סינון לפי מקור">
      <option value="all">כל המקורות</option>
      {Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  </div>;
}