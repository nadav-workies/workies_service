import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

const STATUSES = ["הכל", "פתוחה", "שויכה לטיפול", "בטיפול", "ממתינה", "טופלה", "נסגרה"];
const URGENCIES = ["הכל", "רגילה", "בינונית", "גבוהה", "קריטית"];
const SLA_FILTER = ["הכל", "בזמן", "חריגה"];
const AREAS = [
  "הכל", "משרד / חדר לקוח", "חלל משותף", "חדר ישיבות", "מטבחון",
  "שירותים", "מיזוג", "חשמל", "אינטרנט / תקשורת", "ניקיון", "תחזוקה כללית", "אחר"
];

export default function TicketFilters({ filters, onChange }) {
  const update = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const hasFilters = filters.status !== "הכל" || filters.urgency !== "הכל" || filters.sla !== "הכל" || filters.area !== "הכל" || filters.search;

  const reset = () => {
    onChange({ status: "הכל", urgency: "הכל", sla: "הכל", area: "הכל", search: "" });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש לקוח, חדר, תקלה..."
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          className="pr-9 h-9 text-sm"
        />
      </div>
      <Select value={filters.status} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="w-[130px] h-9 text-xs">
          <SelectValue placeholder="סטטוס" />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.urgency} onValueChange={(v) => update("urgency", v)}>
        <SelectTrigger className="w-[110px] h-9 text-xs">
          <SelectValue placeholder="דחיפות" />
        </SelectTrigger>
        <SelectContent>
          {URGENCIES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.sla} onValueChange={(v) => update("sla", v)}>
        <SelectTrigger className="w-[110px] h-9 text-xs">
          <SelectValue placeholder="SLA" />
        </SelectTrigger>
        <SelectContent>
          {SLA_FILTER.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.area} onValueChange={(v) => update("area", v)}>
        <SelectTrigger className="w-[150px] h-9 text-xs">
          <SelectValue placeholder="אזור" />
        </SelectTrigger>
        <SelectContent>
          {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={reset} className="h-9 text-xs gap-1">
          <X className="w-3.5 h-3.5" />
          נקה פילטרים
        </Button>
      )}
    </div>
  );
}