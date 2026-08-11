import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Trash2, Calendar, User, Building2 } from "lucide-react";
import {
  DAY_LABELS, DAY_ORDER, PLATFORM_LABELS, PLATFORM_COLORS,
  CONTENT_STATUS_LABELS, CONTENT_STATUS_COLORS,
  CONTENT_TYPE_LABELS, CONTENT_TYPE_COLORS, getWeekStart,
} from "@/lib/communityConfig";

export default function ContentRecommendationsTab({ tenant }) {
  const qc = useQueryClient();
  const [adoptingId, setAdoptingId] = useState(null);
  const [adoptForm, setAdoptForm] = useState({
    week_start_date: getWeekStart(),
    day_of_week: "sunday",
    platform: "facebook",
  });

  const { data: ideas = [], isLoading } = useQuery({
    queryKey: ["customer-content-ideas", tenant?.id],
    queryFn: () => base44.entities.WeeklyContentIdea.filter({ related_customer_id: tenant.id }, "-created_date", 200),
    enabled: !!tenant?.id,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["customer-content-ideas", tenant.id] });
    qc.invalidateQueries({ queryKey: ["community-content-ideas"] });
  };

  const handleAdopt = async (idea) => {
    await base44.entities.WeeklyContentIdea.update(idea.id, {
      week_start_date: adoptForm.week_start_date,
      day_of_week: adoptForm.day_of_week,
      platform: adoptForm.platform,
      status: "planned",
    });
    setAdoptingId(null);
    invalidateAll();
  };

  const handleStatusChange = async (idea, status) => {
    await base44.entities.WeeklyContentIdea.update(idea.id, { status });
    invalidateAll();
  };

  const handleDelete = async (idea) => {
    await base44.entities.WeeklyContentIdea.delete(idea.id);
    invalidateAll();
  };

  const startAdopt = (idea) => {
    setAdoptingId(idea.id);
    setAdoptForm({
      week_start_date: idea.week_start_date || getWeekStart(),
      day_of_week: idea.day_of_week || "sunday",
      platform: idea.platform || "facebook",
    });
  };

  const shiftWeek = (days) => {
    const d = new Date(adoptForm.week_start_date);
    d.setDate(d.getDate() + days);
    setAdoptForm((p) => ({ ...p, week_start_date: d.toISOString().split("T")[0] }));
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  if (ideas.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        אין עדיין המלצות תוכן. הוסיפו סיכום שיחה ונתחו אותו כדי לקבל המלצות מותאמות.
      </div>
    );
  }

  const newIdeas = ideas.filter((i) => i.status === "idea");
  const plannedIdeas = ideas.filter((i) => i.status !== "idea" && i.status !== "dismissed");

  return (
    <div className="space-y-5" dir="rtl">
      {/* New recommendations */}
      <div>
        <p className="text-sm font-bold mb-2 flex items-center gap-1.5">
          <Calendar className="w-4 h-4" /> המלצות חדשות לאימוץ ({newIdeas.length})
        </p>
        {newIdeas.length === 0 ? (
          <p className="text-xs text-muted-foreground">אין המלצות חדשות — כל ההמלצות כבר אומצו או נדחו</p>
        ) : (
          <div className="space-y-2">
            {newIdeas.map((idea) => (
              <div key={idea.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium flex-1">{idea.topic}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                    CONTENT_TYPE_COLORS[idea.content_type] || CONTENT_TYPE_COLORS.customer_specific
                  }`}>
                    {idea.content_type === "workies_general"
                      ? <Building2 className="w-2.5 h-2.5" />
                      : <User className="w-2.5 h-2.5" />}
                    {CONTENT_TYPE_LABELS[idea.content_type] || "מותאם ללקוח"}
                  </span>
                </div>
                {idea.source_note && (
                  <p className="text-xs text-muted-foreground italic">"{idea.source_note}"</p>
                )}
                {adoptingId === idea.id ? (
                  <div className="space-y-2 bg-muted/30 rounded-lg p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium shrink-0">שבוע:</span>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => shiftWeek(-7)}>◀</Button>
                      <span className="text-xs font-mono">{adoptForm.week_start_date}</span>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => shiftWeek(7)}>▶</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="h-8 px-2 rounded-md border bg-background text-xs"
                        value={adoptForm.day_of_week}
                        onChange={(e) => setAdoptForm((p) => ({ ...p, day_of_week: e.target.value }))}>
                        {DAY_ORDER.map((d) => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
                      </select>
                      <select className="h-8 px-2 rounded-md border bg-background text-xs"
                        value={adoptForm.platform}
                        onChange={(e) => setAdoptForm((p) => ({ ...p, platform: e.target.value }))}>
                        {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" className="gap-1.5 flex-1" onClick={() => handleAdopt(idea)}>
                        <Check className="w-3.5 h-3.5" /> אמץ לתכנון
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAdoptingId(null)}>ביטול</Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(idea)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => startAdopt(idea)}>
                      <Calendar className="w-3.5 h-3.5" /> אמץ לתכנון
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(idea)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Already planned */}
      {plannedIdeas.length > 0 && (
        <div>
          <p className="text-sm font-bold mb-2 flex items-center gap-1.5">
            <Check className="w-4 h-4" /> תוכן שאומץ ({plannedIdeas.length})
          </p>
          <div className="space-y-1.5">
            {plannedIdeas.map((idea) => (
              <div key={idea.id} className="border rounded-lg p-2.5 flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${PLATFORM_COLORS[idea.platform] || "bg-gray-100"}`}>
                  {PLATFORM_LABELS[idea.platform] || idea.platform}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                  CONTENT_TYPE_COLORS[idea.content_type] || CONTENT_TYPE_COLORS.customer_specific
                }`}>
                  {CONTENT_TYPE_LABELS[idea.content_type] || "מותאם ללקוח"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{idea.topic}</p>
                  <p className="text-xs text-muted-foreground">
                    {DAY_LABELS[idea.day_of_week] || idea.day_of_week} · {idea.week_start_date}
                  </p>
                </div>
                <select value={idea.status}
                  onChange={(e) => handleStatusChange(idea, e.target.value)}
                  className={`text-[10px] px-1.5 py-0.5 rounded-full border-0 shrink-0 ${CONTENT_STATUS_COLORS[idea.status] || "bg-gray-100"}`}>
                  {Object.entries(CONTENT_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <button onClick={() => handleDelete(idea)} className="text-xs text-red-600 hover:text-red-700 px-1 shrink-0">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}