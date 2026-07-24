import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StageCard from "@/components/onboarding/StageCard";
import PracticalTaskList from "@/components/onboarding/PracticalTaskList";
import ReviewMeetingList from "@/components/onboarding/ReviewMeetingList";
import { BookOpen, CheckSquare, Users, FileText, ClipboardList, ChevronLeft, CheckCircle, Lock, RotateCcw } from "lucide-react";

function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
      <Icon className="w-4 h-4 text-primary" /> {children}
    </h3>
  );
}

export default function DayView({
  day, stages, tasks, meetings, attempts, dailyPlan,
  isManager, user, track,
  onQuizStart, onFirstSession, managers, onMentorAssign, onQuickToggle,
  onTaskUpdate, onMeetingComplete, onFinishDay, onNextDay, onReopenStage,
  viewAsUser, onToggleLearningItem
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [summary, setSummary] = useState({ learned: "", did: "", unclear: "", help: "", note: "" });
  const [saving, setSaving] = useState(false);

  const dayStages = stages.filter(s => s.day_number === day);
  const stageIds = new Set(dayStages.map(s => s.id));
  const dayTasks = tasks.filter(t => stageIds.has(t.stage_id));
  const dayMeetings = meetings.filter(m => m.day_number === day);
  const dayAttempts = attempts.filter(a => stageIds.has(a.stage_id));

  const completedStages = dayStages.filter(s => s.status === "completed").length;
  const totalStages = dayStages.length;
  const progress = totalStages > 0 ? Math.round(completedStages / totalStages * 100) : 0;
  const canFinishDay = totalStages > 0 && completedStages === totalStages;
  const dayPlanCompleted = dailyPlan?.status === "completed";

  const dayDate = dailyPlan?.planned_date || (track?.start_date
    ? new Date(new Date(track.start_date).getTime() + (day - 1) * 86400000).toISOString().split("T")[0]
    : null);

  const mentors = [...new Set(dayStages.map(s => s.mentor_name).filter(Boolean))];

  const handleFinishDay = async () => {
    if (!canFinishDay) return;
    setSaving(true);
    await onFinishDay?.(day, summary);
    setSaving(false);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Day Header */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h2 className="text-lg font-bold">יום {day}</h2>
            {dayDate && <p className="text-xs text-muted-foreground">{new Date(dayDate).toLocaleDateString("he-IL")}</p>}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            dayPlanCompleted ? "bg-green-100 text-green-700"
            : completedStages > 0 ? "bg-orange-100 text-orange-700"
            : "bg-gray-100 text-gray-600"
          }`}>
            {dayPlanCompleted ? "הושלם" : completedStages > 0 ? "בתהליך" : "טרם התחיל"}
          </span>
        </div>
        {dailyPlan?.title && <p className="text-sm font-medium mb-2">{dailyPlan.title}</p>}
        {mentors.length > 0 && <p className="text-xs text-muted-foreground mb-2">חונכים: {mentors.join(", ")}</p>}
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{completedStages} מתוך {totalStages} הושלמו · {progress}%</p>
      </Card>

      {/* Day Map */}
      {totalStages > 0 && (
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex items-center gap-1 min-w-min">
            {dayStages.map((s, i) => {
              const isDone = s.status === "completed";
              const isActive = s.status !== "not_started" && s.status !== "completed";
              return (
                <div key={s.id} className="flex items-center gap-1 shrink-0">
                  {i > 0 && <span className="text-muted-foreground text-xs">←</span>}
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-medium max-w-[100px] truncate ${
                    isDone ? "bg-green-100 text-green-700"
                    : isActive ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-500"
                  }`}>
                    {s.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Learning Units */}
      <div>
        <SectionTitle icon={BookOpen}>יחידות למידה</SectionTitle>
        <div className="space-y-2">
          {dayStages.map(stage => (
            <StageCard
              key={stage.id}
              stage={stage}
              isExpanded={expandedId === stage.id}
              onToggleExpand={() => setExpandedId(expandedId === stage.id ? null : stage.id)}
              isManager={isManager && !viewAsUser}
              onQuizStart={onQuizStart}
              onFirstSession={onFirstSession}
              managers={managers}
              onMentorAssign={onMentorAssign}
              onQuickToggle={onQuickToggle}
              onToggleLearningItem={onToggleLearningItem}
            />
          ))}
        </div>
      </div>

      {/* Tasks */}
      {dayTasks.length > 0 && (
        <div>
          <SectionTitle icon={CheckSquare}>משימות היום</SectionTitle>
          <PracticalTaskList tasks={dayTasks} onUpdate={onTaskUpdate} isManager={isManager} />
        </div>
      )}

      {/* Meetings */}
      {dayMeetings.length > 0 && (
        <div>
          <SectionTitle icon={Users}>פגישות ושיחות</SectionTitle>
          <ReviewMeetingList meetings={dayMeetings} onComplete={onMeetingComplete} user={user} />
        </div>
      )}

      {/* Quiz Attempts */}
      {dayAttempts.length > 0 && (
        <div>
          <SectionTitle icon={FileText}>מבדקי היום</SectionTitle>
          <div className="space-y-2">
            {dayAttempts.map(att => (
              <Card key={att.id} className="p-3 flex items-center gap-2 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${att.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                  {att.score_1_to_10}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{att.stage_title}</p>
                  <p className="text-xs text-muted-foreground">ניסיון {att.attempt_number} · {att.correct_answers}/{att.total_questions} נכונות · {att.passed ? "עבר" : "נכשל"}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Day Summary */}
      <div>
        <SectionTitle icon={ClipboardList}>סיכום היום</SectionTitle>
        <Card className="p-4 space-y-3">
          {[
            { key: "learned", label: "מה למדתי היום?" },
            { key: "did", label: "מה ביצעתי בפועל?" },
            { key: "unclear", label: "מה עדיין לא ברור לי?" },
            { key: "help", label: "במה אני צריכ/ה עזרה?" },
            { key: "note", label: "הערה לחונך או למנהל" },
          ].map(field => (
            <div key={field.key}>
              <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
              <Textarea
                value={summary[field.key]}
                onChange={e => setSummary(s => ({ ...s, [field.key]: e.target.value }))}
                className="mt-1"
                rows={2}
                disabled={dayPlanCompleted}
              />
            </div>
          ))}
        </Card>
      </div>

      {/* Finish Day / Next Day */}
      {dayPlanCompleted ? (
        <Card className="p-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">היום הושלם</span>
          </div>
          <Button onClick={onNextDay} className="gap-2">
            מעבר ליום הבא <ChevronLeft className="w-4 h-4" />
          </Button>
        </Card>
      ) : (
        <Card className={`p-4 ${!canFinishDay ? "opacity-60" : ""}`}>
          {!canFinishDay ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4 shrink-0" />
              <span>לא ניתן לסגור את היום לפני השלמת כל יחידות הלמידה ({completedStages}/{totalStages})</span>
            </div>
          ) : (
            <Button onClick={handleFinishDay} disabled={saving} className="w-full gap-2">
              <CheckCircle className="w-4 h-4" /> {saving ? "שומר..." : "סיום יום"}
            </Button>
          )}
        </Card>
      )}

      {/* Manager: Reopen completed stages */}
      {isManager && !viewAsUser && dayStages.some(s => s.status === "completed" || s.status === "relearning") && (
        <div className="flex gap-2 flex-wrap">
          {dayStages.filter(s => s.status === "completed" || s.status === "relearning").map(s => (
            <Button key={s.id} size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onReopenStage?.(s)}>
              <RotateCcw className="w-3 h-3" /> פתח מחדש: {s.title}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}