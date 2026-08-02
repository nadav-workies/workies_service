import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown, ChevronUp, FileText, CheckCircle, Lock, AlertCircle,
  BookOpen, CheckSquare, Target,
} from "lucide-react";
import LearningChecklist from "@/components/onboarding/LearningChecklist";
import PracticalTaskList from "@/components/onboarding/PracticalTaskList";
import { STAGE_STATUS_CONFIG, CATEGORY_LABELS, ONBOARDING_TEMPLATE } from "@/lib/onboardingTemplate";

export default function UnitList({
  stages, tasks = [], attempts = [], isManager = false,
  onQuizStart, onTaskUpdate, onToggleLearningItem, onQuickToggle,
  onFirstSession, managers = [], onMentorAssign, onUpdateStage, onReopenStage,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const sortedStages = [...stages].sort((a, b) => (a.order_number || 0) - (b.order_number || 0));

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
        const isExpanded = expandedId === stage.id;

        const unitTasks = tasks.filter((t) => t.stage_id === stage.id);
        const unitAttempts = attempts.filter((a) => a.stage_id === stage.id);
        const isCompleted = stage.status === "completed";
        const canTakeQuiz = stage.status !== "completed" && stage.status !== "relearning";
        const requiredTasksDone = unitTasks.length > 0 && unitTasks.every((t) => t.status === "done");
        const noTasks = unitTasks.length === 0;
        const allItemsChecked = totalItems > 0 && completedItems === totalItems;
        const readyForQuiz = allItemsChecked && (noTasks || requiredTasksDone) &&
          (!stage.requires_mentor_first_session || stage.first_session_done);

        return (
          <Card key={stage.id} className="overflow-hidden min-w-0">
            {/* Card Header (clickable) */}
            <div
              className="w-full p-3 cursor-pointer hover:bg-muted/30 transition-colors min-w-0"
              onClick={() => setExpandedId(isExpanded ? null : stage.id)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-2.5 h-2.5 rounded-full ${config.dot} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{stage.title}</span>
                    {stage.is_summary_quiz && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">מסכם</span>
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
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" />
                  : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-3 pb-3 border-t space-y-3 min-w-0">
                {/* Learning Goals */}
                {stage.learning_goals?.length > 0 && (
                  <div className="pt-3">
                    <p className="text-xs font-bold mb-1 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-primary" /> מטרת היחידה
                    </p>
                    <ul className="list-disc pr-4 space-y-0.5 text-xs text-muted-foreground">
                      {stage.learning_goals.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>
                )}

                {/* Learning Checklist */}
                {tplStage?.learning_items?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-primary" /> צ׳קליסט נושאי למידה
                    </p>
                    <LearningChecklist
                      items={tplStage.learning_items}
                      checkedItems={stage.checked_learning_items || []}
                      onToggleItem={(itemId) => onToggleLearningItem?.(stage, itemId)}
                    />
                  </div>
                )}

                {/* Mentor session alert */}
                {stage.requires_mentor_first_session && !stage.first_session_done && (
                  <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 rounded-lg p-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    נדרש מפגש ראשון עם החונך
                    {isManager && (
                      <Button size="sm" variant="outline" className="h-6 text-xs mr-auto" onClick={() => onFirstSession?.(stage)}>
                        סמן כבוצע
                      </Button>
                    )}
                  </div>
                )}

                {/* Tasks */}
                {unitTasks.length > 0 && (
                  <div>
                    <p className="text-xs font-bold mb-1 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-primary" /> משימות היחידה
                    </p>
                    <PracticalTaskList tasks={unitTasks} onUpdate={onTaskUpdate} isManager={isManager} />
                  </div>
                )}

                {/* Quiz */}
                {tplStage?.quiz && (
                  <div>
                    <p className="text-xs font-bold mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" /> מבדק היחידה
                    </p>
                    <div className="text-xs text-muted-foreground space-y-0.5 mb-2">
                      <div className="flex justify-between"><span>שאלות:</span><span>{tplStage.quiz.questions.length}</span></div>
                      <div className="flex justify-between"><span>ציון מעבר:</span><span>{tplStage.quiz.passing_score}</span></div>
                      <div className="flex justify-between"><span>ניסיונות:</span><span>{stage.quiz_attempts || 0} / {tplStage.quiz.max_attempts}</span></div>
                      {stage.quiz_score != null && (
                        <div className="flex justify-between"><span>ציון אחרון:</span>
                          <span className={stage.quiz_score >= 8 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{stage.quiz_score}</span>
                        </div>
                      )}
                    </div>

                    {canTakeQuiz && !readyForQuiz && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>השלם את כל הסעיפים והמשימות לפני המבדק</span>
                      </div>
                    )}
                    {canTakeQuiz && readyForQuiz && (
                      <Button size="sm" onClick={() => onQuizStart?.(stage)} className="w-full gap-2">
                        <FileText className="w-3.5 h-3.5" /> {stage.status === "failed" ? "נסה שוב" : "התחל מבדק"}
                      </Button>
                    )}
                    {isCompleted && (
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600 py-1">
                        <CheckCircle className="w-4 h-4" /> <span className="font-medium">היחידה הושלמה</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Quiz attempts history */}
                {unitAttempts.length > 0 && (
                  <div className="space-y-1">
                    {unitAttempts.map((att) => (
                      <div key={att.id} className="flex items-center gap-2 text-xs p-1.5 rounded-lg bg-muted/30">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${att.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                          {att.score_1_to_10}
                        </div>
                        <span className="text-muted-foreground">ניסיון {att.attempt_number} · {att.passed ? "עבר" : "נכשל"}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Manager controls */}
                {isManager && (
                  <div className="flex gap-1.5 flex-wrap pt-1 border-t">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onQuickToggle?.(stage)}>
                      {isCompleted ? "בטל השלמה" : "סמן כהושלם"}
                    </Button>
                    {isCompleted && onReopenStage && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onReopenStage?.(stage)}>
                        פתח מחדש
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}