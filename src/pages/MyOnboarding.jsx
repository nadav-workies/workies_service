import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Loader2, GraduationCap, Clock, AlertCircle } from "lucide-react";
import StageTimeline from "@/components/onboarding/StageTimeline";
import QuizRunner from "@/components/onboarding/QuizRunner";
import PracticalTaskList from "@/components/onboarding/PracticalTaskList";
import { TRACK_STATUS_CONFIG } from "@/lib/onboardingTemplate";
import { calculateProgress } from "@/lib/onboardingUtils";

export default function MyOnboarding() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizStage, setQuizStage] = useState(null);
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

      <div>
        <h2 className="font-semibold text-sm mb-2">מפת החפיפה</h2>
        <StageTimeline stages={stages} onQuizStart={setQuizStage} />
      </div>

      {tasks.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-2">משימות מעשיות</h2>
          <PracticalTaskList tasks={tasks} onUpdate={handleTaskUpdate} />
        </div>
      )}

      {quizStage && (
        <QuizRunner stage={quizStage} onboardingId={onboardingId} employee={user} user={user}
          onClose={() => setQuizStage(null)} onCompleted={handleQuizCompleted} />
      )}
    </div>
  );
}