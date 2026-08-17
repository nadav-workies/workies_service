import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Sparkles, CalendarDays, Columns3 } from "lucide-react";
import InsightsPickerDialog from "@/components/community/InsightsPickerDialog";
import ContentKPIBar from "./ContentKPIBar";
import ContentBoardFilters from "./ContentBoardFilters";
import WeekBoard from "./WeekBoard";
import MonthCalendar from "./MonthCalendar";
import ContentItemDrawer from "./ContentItemDrawer";
import ApprovedWeeklyPlan from "./ApprovedWeeklyPlan";
import { getWeekStart } from "@/lib/communityConfig";
import { effectiveDate, addDays, toLocalDateStr, normalizeStatus, matchesKpi } from "@/lib/contentBoardConfig";

export default function ContentBoard() {
  const qc = useQueryClient();
  const [view, setView] = useState("week");
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [monthStr, setMonthStr] = useState(() => toLocalDateStr(new Date()).slice(0, 7));
  const [filters, setFilters] = useState({ kpi: "", status: "", platform: "", output_type: "", source_type: "", customer: "" });
  const [drawerItem, setDrawerItem] = useState(null);
  const [showInsights, setShowInsights] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["content-work-items"],
    queryFn: () => base44.entities.WeeklyContentIdea.list("-created_date", 500),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["content-work-items"] });
    qc.invalidateQueries({ queryKey: ["community-content-ideas"] });
  };

  const rangeItems = useMemo(() => items.filter((it) => {
    const d = effectiveDate(it);
    if (view === "week") {
      if (!d) return it.week_start_date === weekStart;
      return d >= weekStart && d <= addDays(weekStart, 6);
    }
    return d ? d.slice(0, 7) === monthStr : false;
  }), [items, view, weekStart, monthStr]);

  const filtered = useMemo(() => rangeItems.filter((it) =>
    (!filters.kpi || matchesKpi(it, filters.kpi)) &&
    (!filters.status || normalizeStatus(it.status) === filters.status) &&
    (!filters.platform || it.platform === filters.platform) &&
    (!filters.output_type || it.output_type === filters.output_type) &&
    (!filters.source_type || it.source_type === filters.source_type) &&
    (!filters.customer || it.related_customer_name === filters.customer)
  ), [rangeItems, filters]);

  const customers = useMemo(
    () => [...new Set(items.map((i) => i.related_customer_name).filter(Boolean))].sort(),
    [items]
  );

  const shiftMonth = (n) => {
    const [y, m] = monthStr.split("-").map(Number);
    const d = new Date(y, m - 1 + n, 1);
    setMonthStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const openNew = () => setDrawerItem({
    planned_date: view === "week" ? weekStart : `${monthStr}-01`,
    output_type: "post", status: "idea",
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <Button size="sm" variant={view === "week" ? "default" : "ghost"} className="h-7 gap-1 text-xs" onClick={() => setView("week")}>
            <Columns3 className="w-3.5 h-3.5" /> שבועי
          </Button>
          <Button size="sm" variant={view === "month" ? "default" : "ghost"} className="h-7 gap-1 text-xs" onClick={() => setView("month")}>
            <CalendarDays className="w-3.5 h-3.5" /> חודשי
          </Button>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowInsights(true)}>
            <Sparkles className="w-3.5 h-3.5" /> הפק המלצות מתוכן קיים
          </Button>
          <Button size="sm" className="gap-1.5 text-xs" onClick={openNew}>
            <Plus className="w-3.5 h-3.5" /> הוסף יחידת תוכן
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {view === "week" ? (
          <>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setWeekStart(addDays(weekStart, -7))}>שבוע קודם</Button>
            <span className="text-xs font-medium">{weekStart.split("-").reverse().join(".")} — {addDays(weekStart, 6).split("-").reverse().join(".")}</span>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setWeekStart(addDays(weekStart, 7))}>שבוע הבא</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setWeekStart(getWeekStart())}>היום</Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => shiftMonth(-1)}>חודש קודם</Button>
            <span className="text-xs font-medium">{monthStr.split("-").reverse().join("/")}</span>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => shiftMonth(1)}>חודש הבא</Button>
          </>
        )}
      </div>

      <ContentKPIBar items={rangeItems} activeKpi={filters.kpi}
        onSelect={(k) => setFilters((p) => ({ ...p, kpi: k }))} />

      <ContentBoardFilters filters={filters} setFilters={setFilters} customers={customers} />

      {view === "week" ? (
        <>
          <WeekBoard weekStart={weekStart} items={filtered} onOpen={setDrawerItem} />
          <ApprovedWeeklyPlan weekStart={weekStart} items={items} onOpen={setDrawerItem} onChanged={refresh} />
        </>
      ) : (
        <MonthCalendar monthStr={monthStr} items={filtered} onOpen={setDrawerItem} />
      )}

      <ContentItemDrawer
        item={drawerItem}
        onClose={() => setDrawerItem(null)}
        onSaved={(saved) => { refresh(); setDrawerItem(saved); }}
        onDeleted={() => { refresh(); setDrawerItem(null); }}
      />

      {showInsights && (
        <InsightsPickerDialog
          weekStart={weekStart}
          onClose={() => setShowInsights(false)}
          onAdded={refresh}
        />
      )}
    </div>
  );
}