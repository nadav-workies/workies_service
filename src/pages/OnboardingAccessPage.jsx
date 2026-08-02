import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";
import { useParams } from "react-router-dom";
import UnitList from "@/components/onboarding/UnitList";
import UnitView from "@/components/onboarding/UnitView";
import OnboardingHelpButton from "@/components/onboarding/OnboardingHelpButton";
import QuizRunner from "@/components/onboarding/QuizRunner";
import { TRACK_STATUS_CONFIG } from "@/lib/onboardingTemplate";
import { calculateProgress, calculateAverageScore } from "@/lib/onboardingUtils";

export default function OnboardingAccessPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeUnitId, setActiveUnitId] = useState(null);
  const [quizStage, setQuizStage] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("onboardingAccess", {
        action: "validate",
        token,
      });
      if (res.data?.ok) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.data?.error || "invalid_token");
      }
    } catch {
      setError("fetch_error");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const stages = data?.stages || [];
  const tasks = data?.tasks || [];
  const attempts = data?.attempts || [];
  const track = data?.track;

  const sortedStages = [...stages].sort((a, b) => (a.order_number || 0) - (b.order_number || 0));

  useEffect(() => {
    if (activeUnitId === null && sortedStages.length > 0) {
      const firstActive = sortedStages.find((s) => s.status !== "completed");
      setActiveUnitId(firstActive?.id || sortedStages[0].id);
    }
  }, [sortedStages, activeUnitId]);

  const handleToggleLearningItem = async (stage, itemId) => {
    const current = stage.checked_learning_items || [];
    const updated = current.includes(itemId) ? current.filter((x) => x !== itemId) : [...current, itemId];
    setData((prev) => ({
      ...prev,
      stages: prev.stages.map((s) => (s.id === stage.id ? { ...s, checked_learning_items: updated } : s)),
    }));
    try {
      await base44.functions.invoke("onboardingAccess", {
        action: "toggleLearningItem",
        token,
        stage_id: stage.id,
        item_id: itemId,
      });
    } catch {
      fetchData();
    }
  };

  const handleTaskUpdate = async (task, updates) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === task.id ? { ...t, ...updates } : t)),
    }));
    try {
      await base44.functions.invoke("onboardingAccess", {
        action: "updateTask",
        token,
        task_id: task.id,
        ...updates,
      });
    } catch {
      fetchData();
    }
  };

  const handleQuizSubmit = async (quizData) => {
    await base44.functions.invoke("onboardingAccess", {
      action: "submitQuiz",
      token,
      ...quizData,
      max_attempts: 3,
    });
    fetchData();
  };

  const handleNextUnit = () => {
    const activeIndex = sortedStages.findIndex((s) => s.id === activeUnitId);
    const next = sortedStages[activeIndex + 1];
    if (next) setActiveUnitId(next.id);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-4" dir="rtl">
        <Card className="p-8 text-center max-w-sm">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold mb-1">הקישור אינו תקין</p>
          <p className="text-sm text-muted-foreground">
            {error === "expired" ? "תוקף הקישור פג. נא לפנות למנהל לקבלת קישור חדש." : "לא ניתן לגשת למסלול דרך קישור זה."}
          </p>
        </Card>
      </div>
    );
  }

  if (!track) return null;

  const progress = calculateProgress(stages);
  const avgScore = calculateAverageScore(attempts);
  const activeStage = sortedStages.find((s) => s.id === activeUnitId);
  const activeIndex = sortedStages.findIndex((s) => s.id === activeUnitId);
  const hasNextUnit = activeIndex >= 0 && activeIndex < sortedStages.length - 1;
  const employee = { id: data.employee_id, full_name: data.employee_name };

  return (
    <div className="max-w-3xl mx-auto min-h-screen bg-background p-3 sm:p-4" dir="rtl">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold">שלום, {data.employee_name?.split(" ")[0]} 👋</h1>
          <p className="text-xs text-muted-foreground">{track.role_title}</p>
        </div>

        <Card className="p-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-xs text-muted-foreground">התקדמות</p><p className="text-lg font-bold">{progress}%</p></div>
            <div><p className="text-xs text-muted-foreground">יחידות</p><p className="text-lg font-bold">{track.completed_stages || 0}/{track.total_stages || 0}</p></div>
            <div><p className="text-xs text-muted-foreground">ציון ממוצע</p><p className="text-lg font-bold">{avgScore || "—"}</p></div>
          </div>
        </Card>

        <UnitList stages={sortedStages} activeUnitId={activeUnitId} onSelectUnit={setActiveUnitId} />

        {activeStage && (
          <UnitView
            stage={activeStage}
            tasks={tasks}
            attempts={attempts}
            isManager={false}
            user={employee}
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
          <QuizRunner
            stage={quizStage}
            onboardingId={data.onboarding_id}
            employee={employee}
            user={employee}
            onClose={() => setQuizStage(null)}
            onCompleted={fetchData}
            submitOverride={handleQuizSubmit}
          />
        )}
      </div>
    </div>
  );
}