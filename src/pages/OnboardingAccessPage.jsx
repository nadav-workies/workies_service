import { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Lock } from "lucide-react";
import { useParams } from "react-router-dom";
import DayNavigator from "@/components/onboarding/DayNavigator";
import DayView from "@/components/onboarding/DayView";
import OnboardingHelpButton from "@/components/onboarding/OnboardingHelpButton";
import QuizRunner from "@/components/onboarding/QuizRunner";
import { TRACK_STATUS_CONFIG } from "@/lib/onboardingTemplate";
import { calculateProgress } from "@/lib/onboardingUtils";

export default function OnboardingAccessPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState(null);
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
    const interval = setInterval(fetchData, 30000); // poll for manager updates
    return () => clearInterval(interval);
  }, [fetchData]);

  const stages = data?.stages || [];
  const dailyPlans = data?.dailyPlans || [];
  const tasks = data?.tasks || [];
  const meetings = data?.meetings || [];
  const attempts = data?.attempts || [];
  const track = data?.track;

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
      return {
        day,
        completed,
        total: dayStages.length,
        date: plan?.planned_date,
        status: plan?.status || (completed === dayStages.length && dayStages.length > 0 ? "completed" : completed > 0 ? "active" : "available"),
      };
    });
  }, [stages, dailyPlans]);

  useEffect(() => {
    if (activeDay === null && dayGroups.length > 0) {
      const firstActive = dayGroups.find((g) => g.status !== "completed");
      setActiveDay(firstActive?.day || dayGroups[0].day);
    }
  }, [dayGroups, activeDay]);

  const handleToggleLearningItem = async (stage, itemId) => {
    const current = stage.checked_learning_items || [];
    const updated = current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId];
    // optimistic update
    setData((prev) => ({
      ...prev,
      stages: prev.stages.map((s) => s.id === stage.id ? { ...s, checked_learning_items: updated } : s),
    }));
    try {
      await base44.functions.invoke("onboardingAccess", {
        action: "toggleLearningItem",
        token,
        stage_id: stage.id,
        item_id: itemId,
      });
    } catch {
      fetchData(); // revert on error
    }
  };

  const handleTaskUpdate = async (task, updates) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => t.id === task.id ? { ...t, ...updates } : t),
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

  const handleFinishDay = async (dayNumber, summary) => {
    setData((prev) => ({
      ...prev,
      dailyPlans: prev.dailyPlans.map((p) => p.day_number === dayNumber ? { ...p, status: "completed" } : p),
    }));
    try {
      await base44.functions.invoke("onboardingAccess", {
        action: "finishDay",
        token,
        day_number: dayNumber,
        summary,
      });
    } catch {
      fetchData();
    }
  };

  const handleNextDay = () => {
    const nextGroup = dayGroups.find((g) => g.day > activeDay);
    if (nextGroup) setActiveDay(nextGroup.day);
  };

  const handleQuizSubmit = async (quizData) => {
    const res = await base44.functions.invoke("onboardingAccess", {
      action: "submitQuiz",
      token,
      ...quizData,
      max_attempts: 3,
    });
    if (res.data?.ok) {
      fetchData(); // refresh to get updated stage status
    }
  };

  const handleQuizCompleted = () => {
    fetchData();
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
  const activePlan = dailyPlans.find((p) => p.day_number === activeDay);
  const employee = { id: data.employee_id, full_name: data.employee_name };

  return (
    <div className="max-w-3xl mx-auto min-h-screen bg-background p-3 sm:p-4" dir="rtl">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold">שלום, {data.employee_name?.split(" ")[0]} 👋</h1>
          <p className="text-xs text-muted-foreground">{track.role_title} · יום {track.current_day || 1} מתוך 10</p>
        </div>

        <Card className="p-3">
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
              user={employee}
              track={track}
              onQuizStart={setQuizStage}
              onTaskUpdate={handleTaskUpdate}
              onMeetingComplete={() => {}}
              onFinishDay={handleFinishDay}
              onNextDay={handleNextDay}
              onToggleLearningItem={handleToggleLearningItem}
            />
          </>
        )}

        <OnboardingHelpButton />

        {quizStage && (
          <QuizRunner
            stage={quizStage}
            onboardingId={data.onboarding_id}
            employee={employee}
            user={employee}
            onClose={() => setQuizStage(null)}
            onCompleted={handleQuizCompleted}
            submitOverride={handleQuizSubmit}
          />
        )}
      </div>
    </div>
  );
}