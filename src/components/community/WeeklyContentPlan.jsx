import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Sparkles, CheckSquare, Trash2, Wand2 } from "lucide-react";
import InsightsPickerDialog from "@/components/community/InsightsPickerDialog";
import {
  DAY_LABELS, DAY_ORDER, PLATFORM_LABELS, PLATFORM_COLORS,
  CONTENT_STATUS_LABELS, CONTENT_STATUS_COLORS,
  CONTENT_TYPE_LABELS, CONTENT_TYPE_COLORS, getWeekStart,
} from "@/lib/communityConfig";

export default function WeeklyContentPlan() {
  const qc = useQueryClient();
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [showAdd, setShowAdd] = useState(false);
  const [newIdea, setNewIdea] = useState({
    day_of_week: "sunday",
    platform: "facebook",
    topic: "",
  });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showInsights, setShowInsights] = useState(false);

  const { data: ideas = [], isLoading } = useQuery({
    queryKey: ["community-content-ideas", weekStart],
    queryFn: () => base44.entities.WeeklyContentIdea.filter({ week_start_date: weekStart }, "day_of_week", 100),
  });

  const handleAdd = async () => {
    if (!newIdea.topic.trim()) return;
    await base44.entities.WeeklyContentIdea.create({
      week_start_date: weekStart,
      day_of_week: newIdea.day_of_week,
      platform: newIdea.platform,
      topic: newIdea.topic,
      status: "idea",
    });
    setNewIdea({ day_of_week: "sunday", platform: "facebook", topic: "" });
    setShowAdd(false);
    qc.invalidateQueries({ queryKey: ["community-content-ideas", weekStart] });
  };

  const handleStatusChange = async (idea, newStatus) => {
    await base44.entities.WeeklyContentIdea.update(idea.id, { status: newStatus });
    qc.invalidateQueries({ queryKey: ["community-content-ideas", weekStart] });
  };

  const handleDelete = async (idea) => {
    await base44.entities.WeeklyContentIdea.delete(idea.id);
    qc.invalidateQueries({ queryKey: ["community-content-ideas", weekStart] });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatus = async (newStatus) => {
    const updates = Array.from(selectedIds).map((id) => ({ id, status: newStatus }));
    await base44.entities.WeeklyContentIdea.bulkUpdate(updates);
    setSelectedIds(new Set());
    qc.invalidateQueries({ queryKey: ["community-content-ideas", weekStart] });
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await base44.entities.WeeklyContentIdea.delete(id);
    }
    setSelectedIds(new Set());
    qc.invalidateQueries({ queryKey: ["community-content-ideas", weekStart] });
  };

  const handleAutoAdopt = async () => {
    const ideaStatusItems = ideas.filter((i) => i.status === "idea");
    if (ideaStatusItems.length === 0) return;
    const updates = ideaStatusItems.map((idea, i) => ({
      id: idea.id,
      day_of_week: DAY_ORDER[i % DAY_ORDER.length],
      status: "planned",
    }));
    await base44.entities.WeeklyContentIdea.bulkUpdate(updates);
    qc.invalidateQueries({ queryKey: ["community-content-ideas", weekStart] });
  };

  const ideasByDay = DAY_ORDER.map((day) => ({
    day,
    ideas: ideas.filter((i) => i.day_of_week === day),
  }));

  const shiftWeek = (days) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + days);
    setWeekStart(d.toISOString().split("T")[0]);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => shiftWeek(-7)}>שבוע קודם</Button>
          <span className="text-sm font-medium">שבוע: {weekStart}</span>
          <Button variant="outline" size="sm" onClick={() => shiftWeek(7)}>שבוע הבא</Button>
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(getWeekStart())}>היום</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowInsights(true)}>
            <Sparkles className="w-4 h-4" /> מתוך תובנות
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleAutoAdopt}>
            <Wand2 className="w-4 h-4" /> אימוץ אוטומטי
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-4 h-4" /> הוסף רעיון
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <select className="h-9 px-3 rounded-md border bg-background text-sm"
                value={newIdea.day_of_week}
                onChange={(e) => setNewIdea((p) => ({ ...p, day_of_week: e.target.value }))}>
                {DAY_ORDER.map((d) => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
              </select>
              <select className="h-9 px-3 rounded-md border bg-background text-sm"
                value={newIdea.platform}
                onChange={(e) => setNewIdea((p) => ({ ...p, platform: e.target.value }))}>
                {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="text" placeholder="נושא / רעיון תוכן"
                value={newIdea.topic}
                onChange={(e) => setNewIdea((p) => ({ ...p, topic: e.target.value }))}
                className="h-9 px-3 rounded-md border bg-background text-sm sm:col-span-2" />
            </div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleAdd} disabled={!newIdea.topic.trim()}>שמור</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>ביטול</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg p-2 flex-wrap">
          <span className="text-sm font-medium">{selectedIds.size} נבחרו</span>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleBulkStatus("planned")}>
            <CheckSquare className="w-3.5 h-3.5" /> סמן כמתוכנן
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleBulkStatus("approved")}>
            אשר
          </Button>
          <Button size="sm" variant="ghost" className="text-red-600 gap-1.5" onClick={handleBulkDelete}>
            <Trash2 className="w-3.5 h-3.5" /> מחק
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>בטל בחירה</Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">שלב ראשון: נושאים ורעיונות תוכן בלבד. לא נוצרים פוסטים מלאים.</p>

      <div className="space-y-2">
        {ideasByDay.map(({ day, ideas }) => (
          <Card key={day}>
            <CardContent className="pt-3 pb-3">
              <p className="text-sm font-bold mb-2">{DAY_LABELS[day]} ({ideas.length})</p>
              {ideas.length === 0 ? (
                <p className="text-xs text-muted-foreground">אין רעיונות ליום זה</p>
              ) : (
                <div className="space-y-1.5">
                  {ideas.map((idea) => (
                    <div key={idea.id} className={`flex items-center gap-2 border rounded-lg p-2 ${selectedIds.has(idea.id) ? "border-primary bg-primary/5" : ""}`}>
                      <input type="checkbox" checked={selectedIds.has(idea.id)} onChange={() => toggleSelect(idea.id)} className="shrink-0" />
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${PLATFORM_COLORS[idea.platform] || "bg-gray-100"}`}>
                        {PLATFORM_LABELS[idea.platform] || idea.platform}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CONTENT_TYPE_COLORS[idea.content_type] || CONTENT_TYPE_COLORS.customer_specific}`}>
                        {CONTENT_TYPE_LABELS[idea.content_type] || "מותאם ללקוח"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{idea.topic}</p>
                        {idea.related_customer_name && (
                          <p className="text-xs text-muted-foreground">לקוח: {idea.related_customer_name}</p>
                        )}
                      </div>
                      <select value={idea.status}
                        onChange={(e) => handleStatusChange(idea, e.target.value)}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border-0 ${CONTENT_STATUS_COLORS[idea.status] || "bg-gray-100"}`}>
                        {Object.entries(CONTENT_STATUS_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <button onClick={() => handleDelete(idea)}
                        className="text-xs text-red-600 hover:text-red-700 px-1">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {showInsights && (
        <InsightsPickerDialog
          weekStart={weekStart}
          onClose={() => setShowInsights(false)}
          onAdded={() => qc.invalidateQueries({ queryKey: ["community-content-ideas", weekStart] })}
        />
      )}
    </div>
  );
}