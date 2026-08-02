import { Card } from "@/components/ui/card";
import { STAGE_STATUS_CONFIG, CATEGORY_LABELS, ONBOARDING_TEMPLATE } from "@/lib/onboardingTemplate";

export default function UnitList({ stages, activeUnitId, onSelectUnit }) {
  const sortedStages = [...stages].sort((a, b) => (a.order_number || 0) - (b.order_number || 0));
  const nextUnit = sortedStages.find((s) => s.status !== "completed");

  return (
    <div className="space-y-2" dir="rtl">
      <p className="text-sm font-bold mb-1">יחידות למידה</p>
      {sortedStages.map((stage) => {
        const config = STAGE_STATUS_CONFIG[stage.status] || STAGE_STATUS_CONFIG.not_started;
        const tplStage = ONBOARDING_TEMPLATE.stages.find((s) => s.template_stage_id === stage.template_stage_id);
        const totalItems = tplStage?.learning_items?.length || 0;
        const completedItems = (stage.checked_learning_items || []).filter((id) =>
          tplStage?.learning_items?.some((i) => i.id === id)).length;
        const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        const isActive = activeUnitId === stage.id;
        const isNext = nextUnit?.id === stage.id && stage.status !== "completed";

        return (
          <Card
            key={stage.id}
            className={`p-3 cursor-pointer transition-all min-w-0 ${isActive ? "border-primary ring-1 ring-primary/20" : "hover:bg-muted/30"}`}
            onClick={() => onSelectUnit?.(stage.id)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-2.5 h-2.5 rounded-full ${config.dot} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{stage.title}</span>
                  {stage.is_summary_quiz && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">מסכם</span>
                  )}
                  {isNext && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">הבאה</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{CATEGORY_LABELS[stage.category] || stage.category}</span>
                  {stage.mentor_name && (
                    <><span>·</span><span className="truncate">חונך: {stage.mentor_name}</span></>
                  )}
                </div>
                {totalItems > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{completedItems}/{totalItems}</span>
                  </div>
                )}
              </div>
              {stage.quiz_score != null && (
                <div className="shrink-0 text-center">
                  <p className="text-[10px] text-muted-foreground">ציון</p>
                  <p className={`text-sm font-bold ${stage.quiz_score >= 8 ? "text-green-600" : "text-red-600"}`}>
                    {stage.quiz_score}
                  </p>
                </div>
              )}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.color} shrink-0`}>
                {config.label}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}