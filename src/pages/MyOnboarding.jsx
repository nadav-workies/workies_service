import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Loader2, GraduationCap } from "lucide-react";
import UnitList from "@/components/onboarding/UnitList";
import UnitView from "@/components/onboarding/UnitView";
import OnboardingHelpButton from "@/components/onboarding/OnboardingHelpButton";
import QuizRunner from "@/components/onboarding/QuizRunner";
import { TRACK_STATUS_CONFIG } from "@/lib/onboardingTemplate";
import { calculateProgress, calculateAverageScore } from "@/lib/onboardingUtils";

export default function MyOnboarding() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizStage, setQuizStage] = useState(null);
  const [activeUnitId, setActiveUnitId] = useState(null);
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
  const { data: attempts = [] } = useQuery({
    queryKey: ["my-attempts", onboardingId],
    queryFn: () => base44.entities.QuizAttempt.filter({ onboarding_id: onboardingId }, "-submitted_at", 100),
    enabled: !!onboardingId,
  });

  const sortedStages = [...stages].sort((a, b) => (a.order_number || 0) - (b.order_number || 0));

  useEffect(() => {
    if (activeUnitId === null && sortedStages.length > 0) {
      const firstActive = sortedStages.find((s) => s.status !== "completed");
      setActiveUnitId(firstActive?.id || sortedStages[0].id);
    }
  }, [sortedStages, activeUnitId]);

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
  const avgScore = calculateAverageScore(attempts);
  const activeStage = sortedStages.find((s) => s.id === activeUnitId);
  const activeIndex = sortedStages.findIndex((s) => s.id === activeUnitId);
  const hasNextUnit = activeIndex >= 0 && activeIndex < sortedStages.length - 1;

  const handleTaskUpdate = async (task, updates) => {
    await base44.entities.PracticalTask.update(task.id, updates);
    queryClient.invalidateQueries({ queryKey: ["my-tasks", onboardingId] });
  };
  const handleQuizCompleted = async () => {
    refetchStages();
    queryClient.invalidateQueries({ queryKey: ["my-onboarding", user.id] });
  };
  const handleToggleLearningItem = async (stage, itemId) => {
    const current = stage.checked_learning_items || [];
    const updated = current.includes(itemId) ? current.filter((x) => x !== itemId) : [...current, itemId];
    await base44.entities.OnboardingStage.update(stage.id, { checked_learning_items: updated });
    refetchStages();
  };
  const handleNextUnit = () => {
    const next = sortedStages[activeIndex + 1];
    if (next) setActiveUnitId(next.id);
  };

  return (
    <div className="space-y-4 px-1 overflow-x-hidden" dir="rtl">
      <div>
        <h1 className="text-lg sm:text-xl font-bold">שלום, {user.full_name?.split(" ")[0]} 👋</h1>
        <p className="text-xs text-muted-foreground">{track.role_title}</p>
      </div>

      <Card className="p-3 min-w-0">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-xs text-muted-foreground">התקדמות</p><p className="text-lg font-bold">{progress}%</p></div>
          <div><p className="text-xs text-muted-foreground">יחידות</p><p className="text-lg font-bold">{track.completed_stages || 0}/{track.total_stages || 0}</p></div>
          <div>
            <p className="text-xs text-muted-foreground">ציון ממוצע</p>
            <p className="text-lg font-bold">{avgScore || "—"}</p>
          </div>
        </div>
      </Card>

      <UnitList stages={sortedStages} activeUnitId={activeUnitId} onSelectUnit={setActiveUnitId} />

      {activeStage && (
        <UnitView
          stage={activeStage}
          tasks={tasks}
          attempts={attempts}
          isManager={false}
          user={user}
          track={track}
          onQuizStart={setQuizStage}
          onTaskUpdate={handleTaskUpdate}
          onToggleLearningItem={handleToggleLearningItem}
          onNextUnit={handleNextUnit}
          hasNextUnit={hasNextUnit}
        />
      )}

      <OnboardingHelpButton />

      {quizStage && (
        <QuizRunner stage={quizStage} onboardingId={onboardingId} employee={user} user={user}
          onClose={() => setQuizStage(null)} onCompleted={handleQuizCompleted} />
      )}
    </div>
  );
}