import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Lightbulb } from "lucide-react";
import {
  INSIGHT_TYPE_LABELS, INSIGHT_TYPE_COLORS,
  DAY_ORDER, PLATFORM_LABELS,
} from "@/lib/communityConfig";
import { addDays } from "@/lib/contentBoardConfig";

export default function InsightsPickerDialog({ weekStart, onClose, onAdded }) {
  const [selected, setSelected] = useState(new Set());
  const [adding, setAdding] = useState(false);
  const [platform, setPlatform] = useState("facebook");

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ["community-insights-for-picker"],
    queryFn: () => base44.entities.CustomerInsight.list("-created_date", 200),
  });

  const { data: existingIdeas = [] } = useQuery({
    queryKey: ["community-content-ideas", weekStart],
    queryFn: () => base44.entities.WeeklyContentIdea.filter({ week_start_date: weekStart }, "day_of_week", 200),
  });

  const existingTopics = new Set(existingIdeas.map((i) => (i.topic || "").trim()));
  const newInsights = insights.filter((ins) => ins.status === "new" || ins.status === "reviewed");
  const available = newInsights.filter((ins) => !existingTopics.has((ins.title || "").trim()));

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === available.length) setSelected(new Set());
    else setSelected(new Set(available.map((a) => a.id)));
  };

  const handleAdd = async () => {
    setAdding(true);
    const selectedInsights = available.filter((ins) => selected.has(ins.id));
    const records = selectedInsights.map((ins, i) => ({
      week_start_date: weekStart,
      day_of_week: DAY_ORDER[i % DAY_ORDER.length],
      planned_date: addDays(weekStart, i % DAY_ORDER.length),
      platform,
      title: ins.title,
      topic: ins.title,
      content_type: "customer_specific",
      related_customer_id: ins.tenant_id || "",
      related_customer_name: ins.customer_name || "",
      source_insight_id: ins.id,
      source_note: ins.source_quote || "",
      status: "idea",
    }));
    if (records.length > 0) {
      await base44.entities.WeeklyContentIdea.bulkCreate(records);
    }
    setAdding(false);
    onAdded?.();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            הוסף רעיונות מתובנות ({available.length} זמינות)
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : available.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            אין תובנות חדשות להוספה. נתחו שיחות לקוח כדי לקבל תובנות נוספות.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium">פלטפורמה:</span>
              <select className="h-8 px-2 rounded-md border bg-background text-xs"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}>
                {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <Button size="sm" variant="outline" onClick={toggleAll} className="text-xs mr-auto">
                {selected.size === available.length ? "בטל הכל" : "בחר הכל"}
              </Button>
            </div>
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
              {available.map((ins) => (
                <label key={ins.id} className={`flex items-start gap-2 border rounded-lg p-2.5 cursor-pointer hover:bg-muted/30 ${selected.has(ins.id) ? "border-primary bg-primary/5" : ""}`}>
                  <input type="checkbox" checked={selected.has(ins.id)} onChange={() => toggle(ins.id)} className="mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${INSIGHT_TYPE_COLORS[ins.insight_type] || "bg-gray-100"}`}>
                        {INSIGHT_TYPE_LABELS[ins.insight_type] || ins.insight_type}
                      </span>
                      {ins.customer_name && <span className="text-xs text-muted-foreground">{ins.customer_name}</span>}
                    </div>
                    <p className="text-sm font-medium mt-1">{ins.title}</p>
                    {ins.content && ins.content !== ins.title && <p className="text-xs text-muted-foreground">{ins.content}</p>}
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        <DialogFooter>
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onClose} disabled={adding}>ביטול</Button>
            <Button onClick={handleAdd} disabled={adding || selected.size === 0} className="gap-2 flex-1">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              הפוך {selected.size > 0 ? selected.size : ""} רעיונות ליחידות תוכן
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}