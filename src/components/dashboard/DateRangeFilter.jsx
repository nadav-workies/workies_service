import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarRange } from "lucide-react";

function toDateStr(ms) {
  const d = new Date(ms);
  return d.toISOString().slice(0, 10);
}

export default function DateRangeFilter({ dateFrom, dateTo, onChange }) {
  const [localFrom, setLocalFrom] = useState(dateFrom);
  const [localTo,   setLocalTo]   = useState(dateTo);

  const applyFilter = () => {
    if (localFrom && localTo) onChange({ dateFrom: localFrom, dateTo: localTo });
  };

  const setCurrentMonth = () => {
    const now = new Date();
    const from = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1).getTime());
    const to   = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime());
    setLocalFrom(from);
    setLocalTo(to);
    onChange({ dateFrom: from, dateTo: to });
  };

  const setPrevMonth = () => {
    const now = new Date();
    const from = toDateStr(new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime());
    const to   = toDateStr(new Date(now.getFullYear(), now.getMonth(), 0).getTime());
    setLocalFrom(from);
    setLocalTo(to);
    onChange({ dateFrom: from, dateTo: to });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/40 rounded-xl border" dir="rtl">
      <CalendarRange className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-xs font-semibold text-muted-foreground">תקופת מדידה:</span>

      <Button variant="outline" size="sm" className="text-xs h-7" onClick={setCurrentMonth}>
        החודש הנוכחי
      </Button>
      <Button variant="outline" size="sm" className="text-xs h-7" onClick={setPrevMonth}>
        חודש קודם
      </Button>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">מ:</span>
        <Input
          type="date"
          value={localFrom}
          onChange={e => setLocalFrom(e.target.value)}
          className="h-7 text-xs w-32"
        />
        <span className="text-xs text-muted-foreground">עד:</span>
        <Input
          type="date"
          value={localTo}
          onChange={e => setLocalTo(e.target.value)}
          className="h-7 text-xs w-32"
        />
        <Button size="sm" className="h-7 text-xs" onClick={applyFilter}>
          החל
        </Button>
      </div>

      <span className="text-[10px] text-muted-foreground mr-auto">המדדים מחושבים לפי מועד פתיחת הקריאה</span>
    </div>
  );
}