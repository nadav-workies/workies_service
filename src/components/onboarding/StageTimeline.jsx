import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Clock, FileText, CheckCircle, AlertCircle, UserCog, Calendar } from "lucide-react";
import { STAGE_STATUS_CONFIG, CATEGORY_LABELS, ONBOARDING_TEMPLATE } from "@/lib/onboardingTemplate";
import { useState, useMemo } from "react";

export default function StageTimeline({ stages, onQuizStart, isManager, onStageStatusChange, onFirstSession, managers = [], onMentorAssign, onQuickToggle }) {
  const [expandedId, setExpandedId] = useState(null);

  const dayGroups = useMemo(() => {
    const groups = {};
    [...stages].sort((a, b) => a.order_number - b.order_number).forEach((s) => {
      const day = s.day_number || 0;
      if (!groups[day]) groups[day] = [];
      groups[day].push(s);
    });
    return Object.keys(groups).map(Number).sort((a, b) => a - b).map((day) => {
      const dayStages = groups[day];
      const completed = dayStages.filter((s) => s.status === "completed").length;
      return { day, stages: dayStages, completed, total: dayStages.length };
    });
  }, [stages]);

  const [activeDay, setActiveDay] = useState(() => dayGroups[0]?.day ?? 0);
  const validActiveDay = dayGroups.find((g) => g.day === activeDay) ? activeDay : (dayGroups[0]?.day ?? 0);
  const activeIndex = dayGroups.findIndex((g) => g.day === validActiveDay);
  const activeGroup = dayGroups[activeIndex];
  const visibleStages = activeGroup?.stages || [];

  return (
    <div className="space-y-3 min-w-0" dir="rtl">
      {/* Day navigation */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={activeIndex <= 0}
          onClick={() => activeIndex > 0 && setActiveDay(dayGroups[activeIndex - 1].day)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-1.5 min-w-min">
            {dayGroups.map((g) => {
              const isActive = g.day === validActiveDay;
              return (
                <button
                  key={g.day}
                  onClick={() => setActiveDay(g.day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors flex flex-col items-center leading-tight ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    יום {g.day}
                  </span>
                  <span className={`text-[10px] ${isActive ? "opacity-80" : "opacity-60"}`}>{g.completed}/{g.total} הושלם</span>
                </button>
              );
            })}
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={activeIndex >= dayGroups.length - 1}
          onClick={() => activeIndex < dayGroups.length - 1 && setActiveDay(dayGroups[activeIndex + 1].day)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Stages for selected day */}
      <div className="space-y-2 min-w-0">
        {visibleStages.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">אין שלבים ביום זה</Card>
        )}
        {visibleStages.map((stage) => {
          const config = STAGE_STATUS_CONFIG[stage.status] || STAGE_STATUS_CONFIG.not_started;
          const isExpanded = expandedId === stage.id;
          const canTakeQuiz = stage.status !== "completed" && stage.status !== "relearning";

          return (
            <Card key={stage.id} className="min-w-0 overflow-hidden">
              <div
                onClick={() => setExpandedId(isExpanded ? null : stage.id)}
                className="w-full p-3 flex items-center gap-3 text-right hover:bg-muted/30 transition-colors min-w-0 cursor-pointer"
              >
                {isManager && (
                  <Checkbox
                    checked={stage.status === "completed"}
                    onCheckedChange={() => onQuickToggle?.(stage)}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  />
                )}
                <div className={`w-2.5 h-2.5 rounded-full ${config.dot} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{stage.title}</span>
                    {stage.is_summary_quiz && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">מסכם</span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{CATEGORY_LABELS[stage.category] || stage.category}</span>
                    {stage.mentor_name && (
                      <>
                        <span>·</span>
                        <span className="truncate">חונך: {stage.mentor_name}</span>
                      </>
                    )}
                  </div>
                </div>
                {stage.quiz_score != null && (
                  <div className="shrink-0 text-center">
                    <p className="text-xs text-muted-foreground">ציון</p>
                    <p className={`text-sm font-bold ${stage.quiz_score >= 8 ? "text-green-600" : "text-red-600"}`}>
                      {stage.quiz_score}
                    </p>
                  </div>
                )}
                {isExpanded ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t space-y-3 min-w-0">
                  {stage.learning_goals && stage.learning_goals.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">מטרות למידה</p>
                      <ul className="list-disc pr-4 space-y-0.5">
                        {stage.learning_goals.map((g, i) => (
                          <li key={i} className="text-xs text-muted-foreground">{g}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(() => {
                    const tplStage = ONBOARDING_TEMPLATE.stages.find((s) => s.template_stage_id === stage.template_stage_id);
                    if (!tplStage?.learning_content_md) return null;
                    return (
                      <details className="text-xs">
                        <summary className="cursor-pointer font-semibold text-muted-foreground">חומר למידה</summary>
                        <div className="mt-2 prose prose-sm max-w-none bg-muted/20 rounded-lg p-2 overflow-x-auto">
                          <ReactMarkdown>{tplStage.learning_content_md}</ReactMarkdown>
                        </div>
                      </details>
                    );
                  })()}

                  {stage.requires_mentor_first_session && !stage.first_session_done && (
                    <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 rounded-lg p-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      נדרש מפגש ראשון עם החונך לפני תרגול עצמאי
                      {isManager && (
                        <Button size="sm" variant="outline" className="h-6 text-xs mr-auto" onClick={() => onFirstSession?.(stage)}>
                          סמן כבוצע
                        </Button>
                      )}
                    </div>
                  )}

                  {isManager && managers.length > 0 && (
                    <div className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg p-2">
                      <UserCog className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground shrink-0">חונך מקבל התראות:</span>
                      <select
                        value={stage.mentor_user_id || ""}
                        onChange={(e) => onMentorAssign?.(stage, e.target.value)}
                        className="flex-1 h-7 text-xs rounded-md border border-input bg-transparent px-2 min-w-0"
                      >
                        <option value="">— ברירת מחדל (כל המנהלים) —</option>
                        {managers.map((m) => (
                          <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {stage.employee_notes && (
                    <div className="text-xs bg-muted/40 rounded-lg p-2">
                      <p className="font-semibold mb-0.5">הערות העובדת</p>
                      <p className="text-muted-foreground">{stage.employee_notes}</p>
                    </div>
                  )}

                  {stage.manager_notes && (
                    <div className="text-xs bg-blue-50 rounded-lg p-2">
                      <p className="font-semibold mb-0.5">הערות חונך/מנהל</p>
                      <p className="text-muted-foreground">{stage.manager_notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {canTakeQuiz && (
                      <Button size="sm" onClick={() => onQuizStart?.(stage)} className="gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        {stage.status === "quiz_pending" || stage.status === "failed" ? "המשך מבדק" : "התחל מבדק"}
                      </Button>
                    )}
                    {stage.status === "completed" && (
                      <div className="flex items-center gap-1.5 text-xs text-green-600">
                        <CheckCircle className="w-3.5 h-3.5" /> שלב הושלם
                      </div>
                    )}
                    {stage.quiz_attempts > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {stage.quiz_attempts} ניסיונות
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}