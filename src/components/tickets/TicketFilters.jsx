import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

const STATUSES = ["הכל", "פתוחה", "שויכה לטיפול", "בטיפול", "ממתינה", "טופלה", "נסגרה"];
const PRIORITIES = ["הכל", "רגילה", "בינונית", "גבוהה", "קריטית"];
const SLA_FILTER = ["הכל", "בזמן", "חריגה"];

export default function TicketFilters({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });
  const hasFilters = filters.status !== "הכל" || filters.priority !== "הכל" || filters.sla !== "הכל" || filters.search;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש..."
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          className="pr-9 h-9 text-sm"
        />
      </div>
      <Select value={filters.status} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="סטטוס" /></SelectTrigger>
        <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={filters.priority} onValueChange={(v) => update("priority", v)}>
        <SelectTrigger className="w-[110px] h-9 text-xs"><SelectValue placeholder="דחיפות" /></SelectTrigger>
        <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={filters.sla} onValueChange={(v) => update("sla", v)}>
        <SelectTrigger className="w-[100px] h-9 text-xs"><SelectValue placeholder="SLA" /></SelectTrigger>
        <SelectContent>{SLA_FILTER.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ status: "הכל", priority: "הכל", sla: "הכל", search: "" })} className="h-9 text-xs gap-1">
          <X className="w-3.5 h-3.5" />נקה
        </Button>
      )}
    </div>
  );
}