import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Loader2, GraduationCap, Clock, AlertCircle } from "lucide-react";
import DayNavigator from "@/components/onboarding/DayNavigator";
import DayView from "@/components/onboarding/DayView";
import OnboardingHelpButton from "@/components/onboarding/OnboardingHelpButton";
import QuizRunner from "@/components/onboarding/QuizRunner";
import { TRACK_STATUS_CONFIG } from "@/lib/onboardingTemplate";
import { calculateProgress } from "@/lib/onboardingUtils";
import { logAudit } from "@/lib/onboardingUtils";

export default function MyOnboarding() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizStage, setQuizStage] = useState(null);
  const [activeDay, setActiveDay] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const { data: tracks = [] } = useQuery({
    queryKey: ["my-onboarding", user?.id],
    queryFn: () => base44.entities.EmployeeOnboarding.filter({ employee_id: user.id }, "-created_date", 10),
    enabled: !!user?.id,
  });

  const track = tracks[0];
  const onboardingId = track?.id;

  const { data: stages = [], refetch: refetchStages } = useQuery({
    queryKey: ["my-stages", onboardingId],
    queryFn: () => base44.entities.OnboardingStage.filter({ onboarding_id: onboardingId }, "order_number", 50),
    enabled: !!onboardingId,
  });
  const { data: dailyPlans = [] } = useQuery({
    queryKey: ["my-daily-plans", onboardingId],
    queryFn: () => base44.entities.DailyLearningPlan.filter({ onboarding_id: onboardingId }, "day_number", 50),
    enabled: !!onboardingId,
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["my-tasks", onboardingId],
    queryFn: () => base44.entities.PracticalTask.filter({ onboarding_id: onboardingId }, "due_date", 100),
    enabled: !!onboardingId,
  });
  const { data: meetings = [] } = useQuery({
    queryKey: ["my-meetings", onboardingId],
    queryFn: () => base44.entities.ReviewMeeting.filter({ onboarding_id: onboardingId }, "day_number", 50),
    enabled: !!onboardingId,
  });
  const { data: attempts = [] } = useQuery({
    queryKey: ["my-attempts", onboardingId],
    queryFn: () => base44.entities.QuizAttempt.filter({ onboarding_id: onboardingId }, "-submitted_at", 100),
    enabled: !!onboardingId,
  });

  const dayGroups = useMemo(() => {
    const groups = {};
    stages.forEach((s) => {
      const day = s.day_number || 0;
      if (!groups[day]) groups[day] = [];
      groups[day].push(s);
    });
    return Object.keys(groups).map(Number).sort((a, b) => a - b).map((day) => {
      const dayStages = groups[day];
      const completed = dayStages.filter((s) => s.status === "completed").length;
      const plan = dailyPlans.find((p) => p.day_number === day);
      const stageIds = new Set(dayStages.map(s => s.id));
      const dayTasks = tasks.filter(t => stageIds.has(t.stage_id));
      const overdueTasks = dayTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length;
      return {
        day,
        completed,
        total: dayStages.length,
        date: plan?.planned_date,
        status: plan?.status || (completed === dayStages.length && dayStages.length > 0 ? "completed" : completed > 0 ? "active" : "available"),
        overdueTasks,
      };
    });
  }, [stages, dailyPlans, tasks]);

  useEffect(() => {
    if (activeDay === null && dayGroups.length > 0) {
      const firstActive = dayGroups.find(g => g.status !== "completed");
      setActiveDay(firstActive?.day || dayGroups[0].day);
    }
  }, [dayGroups, activeDay]);

  if (loading || !user) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  if (!track) {
    return (
      <div className="space-y-4 px-1 overflow-x-hidden" dir="rtl">
        <Card className="p-8 text-center">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold mb-1">אין מסלול חפיפה פעיל</p>
          <p className="text-sm text-muted-foreground">כאשר יוקצה לך מסלול חפיפה, הוא יופיע כאן.</p>
        </Card>
      </div>
    );
  }

  const progress = calculateProgress(stages);
  const upcomingMeeting = meetings.find((m) => m.status === "scheduled");
  const openTasks = tasks.filter((t) => t.status !== "done");
  const pendingQuizzes = stages.filter((s) => ["available", "quiz_pending", "failed"].includes(s.status));

  const handleTaskUpdate = async (task, updates) => {
    await base44.entities.PracticalTask.update(task.id, updates);
    queryClient.invalidateQueries({ queryKey: ["my-tasks", onboardingId] });
  };
  const handleQuizCompleted = async () => {
    refetchStages();
    queryClient.invalidateQueries({ queryKey: ["my-onboarding", user.id] });
  };
  const handleMeetingComplete = async (meeting, updates) => {
    await base44.entities.ReviewMeeting.update(meeting.id, updates);
    queryClient.invalidateQueries({ queryKey: ["my-meetings", onboardingId] });
  };
  const handleFinishDay = async (dayNumber, summary) => {
    const plan = dailyPlans.find(p => p.day_number === dayNumber);
    if (plan) {
      await base44.entities.DailyLearningPlan.update(plan.id, { status: "completed" });
    }
    const summaryText = [summary.learned, summary.did, summary.unclear, summary.help, summary.note].filter(Boolean).join(" | ");
    await logAudit(onboardingId, user.id, user.full_name || user.email, null, `יום ${dayNumber}`, user.full_name || user.email,
      `סיום יום ${dayNumber}${summaryText ? ` — סיכום: ${summaryText}` : ""}`);
    queryClient.invalidateQueries({ queryKey: ["my-daily-plans", onboardingId] });
  };
  const handleNextDay = () => {
    const nextGroup = dayGroups.find(g => g.day > activeDay);
    if (nextGroup) setActiveDay(nextGroup.day);
  };

  const activePlan = dailyPlans.find(p => p.day_number === activeDay);

  return (
    <div className="space-y-4 px-1 overflow-x-hidden" dir="rtl">
      <div>
        <h1 className="text-lg sm:text-xl font-bold">שלום, {user.full_name?.split(" ")[0]} 👋</h1>
        <p className="text-xs text-muted-foreground">{track.role_title} · יום {track.current_day || 1} מתוך 10</p>
      </div>

      <Card className="p-3 min-w-0">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-xs text-muted-foreground">התקדמות</p><p className="text-lg font-bold">{progress}%</p></div>
          <div><p className="text-xs text-muted-foreground">שלבים</p><p className="text-lg font-bold">{track.completed_stages || 0}/{track.total_stages || 0}</p></div>
          <div>
            <p className="text-xs text-muted-foreground">סטטוס</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${(TRACK_STATUS_CONFIG[track.status] || {}).color}`}>
              {(TRACK_STATUS_CONFIG[track.status] || {}).label}
            </span>
          </div>
        </div>
      </Card>

      {(pendingQuizzes.length > 0 || openTasks.length > 0 || upcomingMeeting) && (
        <Card className="p-3 border-primary/20 bg-primary/5 min-w-0">
          <p className="text-sm font-semibold mb-2">מה נדרש היום</p>
          <div className="space-y-1.5">
            {pendingQuizzes.slice(0, 3).map((s) => (
              <button key={s.id} onClick={() => setQuizStage(s)}
                className="flex items-center gap-2 text-sm text-primary hover:underline w-full text-right min-w-0">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">מבדק: {s.title}</span>
              </button>
            ))}
            {openTasks.slice(0, 3).map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">משימה: {t.title}</span>
              </div>
            ))}
            {upcomingMeeting && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">שיחת בקרה: {upcomingMeeting.label}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {dayGroups.length > 0 && (
        <>
          <DayNavigator dayGroups={dayGroups} activeDay={activeDay} onSelectDay={setActiveDay} />
          <DayView
            day={activeDay}
            stages={stages}
            tasks={tasks}
            meetings={meetings}
            attempts={attempts}
            dailyPlan={activePlan}
            isManager={false}
            user={user}
            track={track}
            onQuizStart={setQuizStage}
            onTaskUpdate={handleTaskUpdate}
            onMeetingComplete={handleMeetingComplete}
            onFinishDay={handleFinishDay}
            onNextDay={handleNextDay}
          />
        </>
      )}

      <OnboardingHelpButton />

      {quizStage && (
        <QuizRunner stage={quizStage} onboardingId={onboardingId} employee={user} user={user}
          onClose={() => setQuizStage(null)} onCompleted={handleQuizCompleted} />
      )}
    </div>
  );
}