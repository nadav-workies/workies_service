import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Eye } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import UnitList from "@/components/onboarding/UnitList";
import UnitView from "@/components/onboarding/UnitView";
import HistoryPanel from "@/components/onboarding/HistoryPanel";
import QuizRunner from "@/components/onboarding/QuizRunner";
import OnboardingHelpButton from "@/components/onboarding/OnboardingHelpButton";
import OnboardingAIAssistant from "@/components/onboarding/OnboardingAIAssistant";
import OnboardingLinkManager from "@/components/onboarding/OnboardingLinkManager";
import { TRACK_STATUS_CONFIG } from "@/lib/onboardingTemplate";
import { calculateProgress, calculateAverageScore, refreshTrackStats, logAudit } from "@/lib/onboardingUtils";
import { isManagerOrAdmin } from "@/lib/permissions";

export default function OnboardingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizStage, setQuizStage] = useState(null);
  const [activeUnitId, setActiveUnitId] = useState(null);
  const [viewAsUser, setViewAsUser] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const { data: track } = useQuery({
    queryKey: ["onboarding-track", id],
    queryFn: () => base44.entities.EmployeeOnboarding.get(id),
    enabled: !!id,
  });
  const { data: stages = [], refetch: refetchStages } = useQuery({
    queryKey: ["onboarding-stages", id],
    queryFn: () => base44.entities.OnboardingStage.filter({ onboarding_id: id }, "order_number", 50),
    enabled: !!id,
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["onboarding-tasks", id],
    queryFn: () => base44.entities.PracticalTask.filter({ onboarding_id: id }, "due_date", 100),
    enabled: !!id,
  });
  const { data: attempts = [] } = useQuery({
    queryKey: ["onboarding-attempts", id],
    queryFn: () => base44.entities.QuizAttempt.filter({ onboarding_id: id }, "-submitted_at", 100),
    enabled: !!id,
  });
  const { data: meetings = [] } = useQuery({
    queryKey: ["onboarding-meetings", id],
    queryFn: () => base44.entities.ReviewMeeting.filter({ onboarding_id: id }, "day_number", 50),
    enabled: !!id,
  });
  const { data: logs = [] } = useQuery({
    queryKey: ["onboarding-logs", id],
    queryFn: () => base44.entities.OnboardingAuditLog.filter({ onboarding_id: id }, "-created_date", 100),
    enabled: !!id,
  });
  const { data: managers = [] } = useQuery({
    queryKey: ["onboarding-managers"],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter((u) => u.role === "admin" || u.role === "manager");
    },
  });

  const sortedStages = [...stages].sort((a, b) => (a.order_number || 0) - (b.order_number || 0));

  useEffect(() => {
    if (activeUnitId === null && sortedStages.length > 0) {
      const firstActive = sortedStages.find((s) => s.status !== "completed");
      setActiveUnitId(firstActive?.id || sortedStages[0].id);
    }
  }, [sortedStages, activeUnitId]);

  if (loading || !user) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!track) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const isManager = isManagerOrAdmin(user) && !viewAsUser;
  const progress = calculateProgress(stages);
  const avgScore = calculateAverageScore(attempts);
  const activeStage = sortedStages.find((s) => s.id === activeUnitId);
  const activeIndex = sortedStages.findIndex((s) => s.id === activeUnitId);
  const hasNextUnit = activeIndex >= 0 && activeIndex < sortedStages.length - 1;

  const handleTaskUpdate = async (task, updates) => {
    await base44.entities.PracticalTask.update(task.id, updates);
    queryClient.invalidateQueries({ queryKey: ["onboarding-tasks", id] });
  };
  const handleFirstSession = async (stage) => {
    await base44.entities.OnboardingStage.update(stage.id, { first_session_done: true });
    await logAudit(id, track.employee_id, track.employee_name, stage.id, stage.title, user?.full_name || user?.email, "סימון מפגש ראשון עם חונך כבוצע");
    refetchStages();
  };
  const handleQuizCompleted = async () => {
    refetchStages();
    queryClient.invalidateQueries({ queryKey: ["onboarding-attempts", id] });
    const updatedStages = await base44.entities.OnboardingStage.filter({ onboarding_id: id }, "order_number", 50);
    await refreshTrackStats(id, updatedStages);
    queryClient.invalidateQueries({ queryKey: ["onboarding-track", id] });
    queryClient.invalidateQueries({ queryKey: ["onboarding-tracks"] });
  };
  const handleReopenStage = async (stage) => {
    await base44.entities.OnboardingStage.update(stage.id, { status: "available", quiz_attempts: 0 });
    await logAudit(id, track.employee_id, track.employee_name, stage.id, stage.title, user?.full_name || user?.email, `פתיחת יחידה מחדש: ${stage.title}`, stage.status, "available");
    refetchStages();
  };
  const handleMentorAssign = async (stage, mentorUserId) => {
    const mentor = managers.find((m) => m.id === mentorUserId);
    const updates = { mentor_user_id: mentorUserId || null };
    if (mentor) updates.mentor_name = mentor.full_name || mentor.email;
    await base44.entities.OnboardingStage.update(stage.id, updates);
    await logAudit(id, track.employee_id, track.employee_name, stage.id, stage.title, user?.full_name || user?.email, `שיוך חונך: ${mentor ? (mentor.full_name || mentor.email) : "ברירת מחדל"}`);
    refetchStages();
  };
  const handleQuickToggle = async (stage) => {
    const newStatus = stage.status === "completed" ? "available" : "completed";
    const updates = { status: newStatus };
    if (newStatus === "completed") updates.completed_at = new Date().toISOString();
    await base44.entities.OnboardingStage.update(stage.id, updates);
    await logAudit(id, track.employee_id, track.employee_name, stage.id, stage.title, user?.full_name || user?.email, `${newStatus === "completed" ? "סימון יחידה כהושלמה" : "ביטול השלמה"}: ${stage.title}`, stage.status, newStatus);
    refetchStages();
    const updatedStages = await base44.entities.OnboardingStage.filter({ onboarding_id: id }, "order_number", 50);
    await refreshTrackStats(id, updatedStages);
    queryClient.invalidateQueries({ queryKey: ["onboarding-track", id] });
    queryClient.invalidateQueries({ queryKey: ["onboarding-tracks"] });
  };
  const handleToggleLearningItem = async (stage, itemId) => {
    const current = stage.checked_learning_items || [];
    const updated = current.includes(itemId) ? current.filter((x) => x !== itemId) : [...current, itemId];
    await base44.entities.OnboardingStage.update(stage.id, { checked_learning_items: updated });
    refetchStages();
  };
  const handleUpdateStage = async (stage, updates) => {
    await base44.entities.OnboardingStage.update(stage.id, updates);
    refetchStages();
  };
  const handleNextUnit = () => {
    const next = sortedStages[activeIndex + 1];
    if (next) setActiveUnitId(next.id);
  };

  return (
    <div className="space-y-4 px-1 overflow-x-hidden" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2 min-w-0">
        <Button variant="ghost" size="sm" onClick={() => navigate("/onboarding")} className="gap-1 shrink-0">
          <ArrowRight className="w-4 h-4" /> חזרה
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold truncate">{track.employee_name}</h1>
          <p className="text-xs text-muted-foreground">{track.role_title} · {track.template_name}</p>
        </div>
        {isManagerOrAdmin(user) && (
          <Button size="sm" variant={viewAsUser ? "default" : "outline"} onClick={() => setViewAsUser(!viewAsUser)} className="gap-1 shrink-0">
            <Eye className="w-3.5 h-3.5" /> {viewAsUser ? "חזור לניהול" : "צפה כמשתמש"}
          </Button>
        )}
      </div>

      {/* Metrics */}
      <Card className="p-3 min-w-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">התקדמות</p>
            <p className="text-lg font-bold">{progress}%</p>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mt-1">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div><p className="text-xs text-muted-foreground">ציון ממוצע</p><p className="text-lg font-bold">{avgScore || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">יחידות</p><p className="text-lg font-bold">{track.completed_stages || 0}/{track.total_stages || 0}</p></div>
          <div>
            <p className="text-xs text-muted-foreground">סטטוס</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(TRACK_STATUS_CONFIG[track.status] || {}).color || "bg-gray-100"}`}>
              {(TRACK_STATUS_CONFIG[track.status] || {}).label || track.status}
            </span>
          </div>
        </div>
      </Card>

      {/* Link Manager */}
      {isManagerOrAdmin(user) && <OnboardingLinkManager track={track} onPreview={() => setViewAsUser(true)} />}

      {/* AI Assistant */}
      <OnboardingAIAssistant track={track} stages={stages} isManager={isManager} />

      {/* Unit List */}
      <UnitList stages={sortedStages} activeUnitId={activeUnitId} onSelectUnit={setActiveUnitId} />

      {/* Active Unit View */}
      {activeStage && (
        <UnitView
          stage={activeStage}
          tasks={tasks}
          attempts={attempts}
          isManager={isManager}
          user={user}
          track={track}
          onQuizStart={setQuizStage}
          onFirstSession={handleFirstSession}
          managers={managers}
          onMentorAssign={handleMentorAssign}
          onQuickToggle={handleQuickToggle}
          onTaskUpdate={handleTaskUpdate}
          onToggleLearningItem={handleToggleLearningItem}
          onUpdateStage={handleUpdateStage}
          onNextUnit={handleNextUnit}
          hasNextUnit={hasNextUnit}
          onReopenStage={handleReopenStage}
        />
      )}

      {/* Help Button */}
      <OnboardingHelpButton />

      {/* History & Control (manager only) */}
      {isManagerOrAdmin(user) && !viewAsUser && (
        <HistoryPanel attempts={attempts} logs={logs} meetings={meetings} />
      )}

      {/* Quiz Runner */}
      {quizStage && (
        <QuizRunner stage={quizStage} onboardingId={id}
          employee={{ id: track.employee_id, full_name: track.employee_name }}
          user={user} onClose={() => setQuizStage(null)} onCompleted={handleQuizCompleted} />
      )}
    </div>
  );
}