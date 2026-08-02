import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Target, BookOpen, CheckSquare, FileText, CheckCircle, ChevronLeft,
  AlertCircle, UserCog, Lock,
} from "lucide-react";
import LearningChecklist from "@/components/onboarding/LearningChecklist";
import PracticalTaskList from "@/components/onboarding/PracticalTaskList";
import { STAGE_STATUS_CONFIG, CATEGORY_LABELS, ONBOARDING_TEMPLATE } from "@/lib/onboardingTemplate";

function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
      <Icon className="w-4 h-4 text-primary" /> {children}
    </h3>
  );
}

export default function UnitView({
  stage, tasks, attempts, isManager, user, track,
  onQuizStart, onFirstSession, managers, onMentorAssign, onQuickToggle,
  onTaskUpdate, onToggleLearningItem, onNextUnit, hasNextUnit, onReopenStage, onUpdateStage,
}) {
  const [managerNote, setManagerNote] = useState(stage.manager_notes || "");

  if (!stage) return null;

  const tplStage = ONBOARDING_TEMPLATE.stages.find((s) => s.template_stage_id === stage.template_stage_id);
  const config = STAGE_STATUS_CONFIG[stage.status] || STAGE_STATUS_CONFIG.not_started;
  const unitTasks = tasks.filter((t) => t.stage_id === stage.id);
  const unitAttempts = attempts.filter((a) => a.stage_id === stage.id);
  const isCompleted = stage.status === "completed";
  const canTakeQuiz = stage.status !== "completed" && stage.status !== "relearning";

  const totalItems = tplStage?.learning_items?.length || 0;
  const completedItems = (stage.checked_learning_items || []).filter((id) =>
    tplStage?.learning_items?.some((i) => i.id === id)).length;
  const allItemsChecked = totalItems > 0 && completedItems === totalItems;
  const requiredTasksDone = unitTasks.length > 0 && unitTasks.every((t) => t.status === "done");
  const noTasks = unitTasks.length === 0;
  const readyForQuiz = allItemsChecked && (noTasks || requiredTasksDone) &&
    (!stage.requires_mentor_first_session || stage.first_session_done);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Unit Header */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h2 className="text-lg font-bold">{stage.title}</h2>
            <p className="text-xs text-muted-foreground">
              {CATEGORY_LABELS[stage.category] || stage.category}
              {stage.mentor_name && ` · חונך: ${stage.mentor_name}`}
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.color} shrink-0`}>
            {config.label}
          </span>
        </div>
        {totalItems > 0 && (
          <>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{completedItems} מתוך {totalItems} סעיפים הושלמו</p>
          </>
        )}
      </Card>

      {/* Learning Goals */}
      {stage.learning_goals?.length > 0 && (
        <div>
          <SectionTitle icon={Target}>מטרת היחידה</SectionTitle>
          <Card className="p-3">
            <ul className="list-disc pr-4 space-y-1 text-sm text-muted-foreground">
              {stage.learning_goals.map((g, i) => <li key={i}>{g}</li>)}
            </ul>
          </Card>
        </div>
      )}

      {/* Learning Checklist */}
      {tplStage?.learning_items?.length > 0 && (
        <div>
          <SectionTitle icon={BookOpen}>צ׳קליסט נושאי למידה</SectionTitle>
          <Card className="p-3">
            <LearningChecklist
              items={tplStage.learning_items}
              checkedItems={stage.checked_learning_items || []}
              onToggleItem={(itemId) => onToggleLearningItem?.(stage, itemId)}
            />
          </Card>
        </div>
      )}

      {/* Mentor first session alert */}
      {stage.requires_mentor_first_session && !stage.first_session_done && (
        <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 rounded-lg p-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          נדרש מפגש ראשון עם החונך לפני המבדק
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
          <SectionTitle icon={CheckSquare}>תרגול ומשימות מעשיות</SectionTitle>
          <PracticalTaskList tasks={unitTasks} onUpdate={onTaskUpdate} isManager={isManager} />
        </div>
      )}

      {/* Quiz */}
      <div>
        <SectionTitle icon={FileText}>מבדק היחידה</SectionTitle>
        <Card className="p-4 space-y-3">
          {tplStage?.quiz && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between"><span>מספר שאלות:</span><span className="font-medium">{tplStage.quiz.questions.length}</span></div>
              <div className="flex justify-between"><span>ציון מעבר:</span><span className="font-medium">{tplStage.quiz.passing_score}</span></div>
              <div className="flex justify-between"><span>ניסיונות:</span><span className="font-medium">{stage.quiz_attempts || 0} / {tplStage.quiz.max_attempts}</span></div>
              {stage.quiz_score != null && (
                <div className="flex justify-between"><span>ציון אחרון:</span>
                  <span className={stage.quiz_score >= 8 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{stage.quiz_score}</span>
                </div>
              )}
            </div>
          )}

          {canTakeQuiz && !readyForQuiz && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>יש להשלים את כל סעיפי הלמידה והמשימות לפני המבדק</span>
            </div>
          )}

          {canTakeQuiz && readyForQuiz && (
            <Button onClick={() => onQuizStart?.(stage)} className="w-full gap-2">
              <FileText className="w-4 h-4" /> {stage.status === "failed" ? "נסה שוב" : "התחל מבדק"}
            </Button>
          )}

          {isCompleted && (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" /> <span className="font-medium">היחידה הושלמה</span>
              </div>
              {hasNextUnit && (
                <Button onClick={onNextUnit} variant="outline" className="gap-2 w-full">
                  המשך ליחידה הבאה <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Quiz attempts history */}
      {unitAttempts.length > 0 && (
        <div className="space-y-2">
          {unitAttempts.map((att) => (
            <Card key={att.id} className="p-2 flex items-center gap-2 text-xs">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${att.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                {att.score_1_to_10}
              </div>
              <span className="text-muted-foreground">ניסיון {att.attempt_number} · {att.correct_answers}/{att.total_questions} נכונות · {att.passed ? "עבר" : "נכשל"}</span>
            </Card>
          ))}
        </div>
      )}

      {/* Manager controls */}
      {isManager && (
        <Card className="p-3 space-y-2">
          {managers.length > 0 && (
            <div className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg p-2">
              <UserCog className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground shrink-0">חונך מקבל התראות:</span>
              <select
                value={stage.mentor_user_id || ""}
                onChange={(e) => onMentorAssign?.(stage, e.target.value)}
                className="flex-1 h-7 text-xs rounded-md border border-input bg-transparent px-2 min-w-0"
              >
                <option value="">— ברירת מחדל —</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-1.5 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => onQuickToggle?.(stage)} className="h-7 text-xs gap-1">
              {isCompleted ? "בטל השלמה" : "סמן כהושלם"}
            </Button>
            {isCompleted && onReopenStage && (
              <Button size="sm" variant="ghost" onClick={() => onReopenStage?.(stage)} className="h-7 text-xs gap-1">
                פתח מחדש
              </Button>
            )}
          </div>
          <Textarea
            value={managerNote}
            onChange={(e) => setManagerNote(e.target.value)}
            placeholder="הערת מנהל/חונך..."
            className="text-xs min-h-[50px]"
            onBlur={() => {
              if (managerNote !== (stage.manager_notes || "")) {
                onUpdateStage?.(stage, { manager_notes: managerNote });
              }
            }}
          />
        </Card>
      )}
    </div>
  );
}