import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarRange } from "lucide-react";
import {
  getTodayRange,
  getCurrentCalendarMonthRange,
  getPreviousCalendarMonthRange,
  getCustomDateRange,
  getRangeFromMonthValue,
} from "@/lib/dateRangeUtils";

export default function DateRangeFilter({ value, onChange }) {
  const currentRange = value || getCurrentCalendarMonthRange();

  const [dateFrom, setDateFrom]   = useState(currentRange.dateFrom);
  const [dateTo,   setDateTo]     = useState(currentRange.dateTo);
  const [monthValue, setMonthValue] = useState("");

  const applyCurrentMonth = () => {
    const range = getCurrentCalendarMonthRange();
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
    setMonthValue("");
    onChange(range);
  };

  const applyPreviousMonth = () => {
    const range = getPreviousCalendarMonthRange();
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
    setMonthValue("");
    onChange(range);
  };

  const applySelectedMonth = (val) => {
    setMonthValue(val);
    const range = getRangeFromMonthValue(val);
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
    onChange(range);
  };

  const applyCustomRange = () => {
    const range = getCustomDateRange(dateFrom, dateTo);
    setMonthValue("");
    onChange(range);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 p-3 bg-muted/40 rounded-xl border" dir="rtl">
      <CalendarRange className="w-4 h-4 text-muted-foreground shrink-0" />

      <div className="flex flex-col">
        <span className="text-xs font-semibold text-muted-foreground">תקופת מדידה</span>
        <span className="text-[10px] text-muted-foreground hidden sm:block">מחושב לפי מועד פתיחת הקריאה</span>
      </div>

      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { const r = getTodayRange(); setDateFrom(r.dateFrom); setDateTo(r.dateTo); setMonthValue(""); onChange(r); }}>
        היום
      </Button>
      <Button variant="outline" size="sm" className="text-xs h-7" onClick={applyCurrentMonth}>
        החודש הנוכחי
      </Button>
      <Button variant="outline" size="sm" className="text-xs h-7" onClick={applyPreviousMonth}>
        חודש קודם
      </Button>

      <Input
        type="month"
        value={monthValue}
        onChange={(e) => applySelectedMonth(e.target.value)}
        className="h-7 text-xs w-36"
      />

      <span className="text-xs text-muted-foreground">מ:</span>
      <Input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className="h-7 text-xs w-32"
      />
      <span className="text-xs text-muted-foreground">עד:</span>
      <Input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="h-7 text-xs w-32"
      />
      <Button size="sm" className="h-7 text-xs" onClick={applyCustomRange}>
        החל
      </Button>

      <span className="text-[11px] font-medium text-orange-600 sm:mr-auto">
        טווח פעיל: {currentRange.dateFrom} עד {currentRange.dateTo}
      </span>
    </div>
  );
}