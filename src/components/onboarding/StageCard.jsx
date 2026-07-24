import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Clock, FileText, CheckCircle, AlertCircle, UserCog } from "lucide-react";
import { STAGE_STATUS_CONFIG, CATEGORY_LABELS, ONBOARDING_TEMPLATE } from "@/lib/onboardingTemplate";
import LearningChecklist from "@/components/onboarding/LearningChecklist";

export default function StageCard({ stage, isExpanded, onToggleExpand, isManager, onQuizStart, onFirstSession, managers = [], onMentorAssign, onQuickToggle, onToggleLearningItem }) {
  const config = STAGE_STATUS_CONFIG[stage.status] || STAGE_STATUS_CONFIG.not_started;
  const canTakeQuiz = stage.status !== "completed" && stage.status !== "relearning";

  return (
    <Card className="min-w-0 overflow-hidden">
      <div
        onClick={onToggleExpand}
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
            if (!tplStage?.learning_items?.length) return null;
            return (
              <LearningChecklist
                items={tplStage.learning_items}
                checkedItems={stage.checked_learning_items || []}
                onToggleItem={(itemId) => onToggleLearningItem?.(stage, itemId)}
              />
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
              <p className="font-semibold mb-0.5">הערות אישיות</p>
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
                <CheckCircle className="w-3.5 h-3.5" /> הושלם
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
}