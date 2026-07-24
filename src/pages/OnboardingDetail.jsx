import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, LayoutGrid, CalendarDays, Eye } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import DayNavigator from "@/components/onboarding/DayNavigator";
import DayView from "@/components/onboarding/DayView";
import AdditionalInfoPanel from "@/components/onboarding/AdditionalInfoPanel";
import PracticalTaskList from "@/components/onboarding/PracticalTaskList";
import ReviewMeetingList from "@/components/onboarding/ReviewMeetingList";
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
  const [activeDay, setActiveDay] = useState(null);
  const [managerView, setManagerView] = useState("days");
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
  const { data: dailyPlans = [] } = useQuery({
    queryKey: ["onboarding-daily-plans", id],
    queryFn: () => base44.entities.DailyLearningPlan.filter({ onboarding_id: id }, "day_number", 50),
    enabled: !!id,
  });
  const { data: attempts = [] } = useQuery({
    queryKey: ["onboarding-attempts", id],
    queryFn: () => base44.entities.QuizAttempt.filter({ onboarding_id: id }, "-submitted_at", 100),
    enabled: !!id,
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["onboarding-tasks", id],
    queryFn: () => base44.entities.PracticalTask.filter({ onboarding_id: id }, "due_date", 100),
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
  if (!track) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const isManager = isManagerOrAdmin(user);
  const progress = calculateProgress(stages);
  const avgScore = calculateAverageScore(attempts);

  const handleTaskUpdate = async (task, updates) => {
    await base44.entities.PracticalTask.update(task.id, updates);
    queryClient.invalidateQueries({ queryKey: ["onboarding-tasks", id] });
  };
  const handleMeetingComplete = async (meeting, updates) => {
    await base44.entities.ReviewMeeting.update(meeting.id, updates);
    queryClient.invalidateQueries({ queryKey: ["onboarding-meetings", id] });
    await logAudit(id, track.employee_id, track.employee_name, null, null, user?.full_name || user?.email, `תיעוד שיחת בקרה: ${meeting.label}`, null, updates.manager_summary);
  };
  const handleFirstSession = async (stage) => {
    await base44.entities.OnboardingStage.update(stage.id, { first_session_done: true, status: stage.status === "not_started" ? "available" : stage.status });
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
    await logAudit(id, track.employee_id, track.employee_name, stage.id, stage.title, user?.full_name || user?.email, `פתיחת שלב מחדש: ${stage.title}`, stage.status, "available");
    refetchStages();
  };
  const handleMentorAssign = async (stage, mentorUserId) => {
    const mentor = managers.find((m) => m.id === mentorUserId);
    const updates = { mentor_user_id: mentorUserId || null };
    if (mentor) updates.mentor_name = mentor.full_name || mentor.email;
    await base44.entities.OnboardingStage.update(stage.id, updates);
    await logAudit(id, track.employee_id, track.employee_name, stage.id, stage.title, user?.full_name || user?.email, `שיוך חונך לשלב: ${mentor ? (mentor.full_name || mentor.email) : 'ברירת מחדל'}`, null, mentorUserId || 'כל המנהלים');
    refetchStages();
  };
  const handleQuickToggle = async (stage) => {
    const newStatus = stage.status === "completed" ? "available" : "completed";
    const updates = { status: newStatus };
    if (newStatus === "completed") updates.completed_at = new Date().toISOString();
    await base44.entities.OnboardingStage.update(stage.id, updates);
    await logAudit(id, track.employee_id, track.employee_name, stage.id, stage.title, user?.full_name || user?.email, `${newStatus === "completed" ? "סימון שלב כהושלם" : "ביטול סימון השלמה"}: ${stage.title}`, stage.status, newStatus);
    refetchStages();
    const updatedStages = await base44.entities.OnboardingStage.filter({ onboarding_id: id }, "order_number", 50);
    await refreshTrackStats(id, updatedStages);
    queryClient.invalidateQueries({ queryKey: ["onboarding-track", id] });
    queryClient.invalidateQueries({ queryKey: ["onboarding-tracks"] });
  };
  const handleFinishDay = async (dayNumber, summary) => {
    const plan = dailyPlans.find(p => p.day_number === dayNumber);
    if (plan) {
      await base44.entities.DailyLearningPlan.update(plan.id, { status: "completed" });
    }
    const summaryText = [summary.learned, summary.did, summary.unclear, summary.help, summary.note].filter(Boolean).join(" | ");
    await logAudit(id, track.employee_id, track.employee_name, null, `יום ${dayNumber}`, user?.full_name || user?.email,
      `סיום יום ${dayNumber}${summaryText ? ` — סיכום: ${summaryText}` : ""}`);
    queryClient.invalidateQueries({ queryKey: ["onboarding-daily-plans", id] });
    queryClient.invalidateQueries({ queryKey: ["onboarding-logs", id] });
  };
  const handleToggleLearningItem = async (stage, itemId) => {
    const current = stage.checked_learning_items || [];
    const updated = current.includes(itemId) ? current.filter(id => id !== itemId) : [...current, itemId];
    await base44.entities.OnboardingStage.update(stage.id, { checked_learning_items: updated });
    refetchStages();
  };
  const handleNextDay = () => {
    const nextGroup = dayGroups.find(g => g.day > activeDay);
    if (nextGroup) setActiveDay(nextGroup.day);
  };

  const categoryMap = {};
  stages.forEach((s) => {
    if (!categoryMap[s.category]) categoryMap[s.category] = { total: 0, completed: 0, scores: [] };
    categoryMap[s.category].total++;
    if (s.status === "completed") categoryMap[s.category].completed++;
    if (s.quiz_score != null) categoryMap[s.category].scores.push(s.quiz_score);
  });

  const activeGroup = dayGroups.find(g => g.day === activeDay);
  const activePlan = dailyPlans.find(p => p.day_number === activeDay);
  const showDayView = viewAsUser || managerView === "days" || !isManager;

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
        {isManager && (
          <div className="flex gap-1 shrink-0">
            {!viewAsUser && (
              <>
                <Button size="sm" variant={managerView === "days" ? "default" : "outline"} onClick={() => setManagerView("days")} className="gap-1">
                  <CalendarDays className="w-3.5 h-3.5" /> ימים
                </Button>
                <Button size="sm" variant={managerView === "admin" ? "default" : "outline"} onClick={() => setManagerView("admin")} className="gap-1">
                  <LayoutGrid className="w-3.5 h-3.5" /> ניהול
                </Button>
              </>
            )}
            <Button size="sm" variant={viewAsUser ? "default" : "outline"} onClick={() => setViewAsUser(!viewAsUser)} className="gap-1">
              <Eye className="w-3.5 h-3.5" /> {viewAsUser ? "חזור לניהול" : "צפה כמשתמש"}
            </Button>
          </div>
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
          <div><p className="text-xs text-muted-foreground">שלבים</p><p className="text-lg font-bold">{track.completed_stages || 0}/{track.total_stages || 0}</p></div>
          <div>
            <p className="text-xs text-muted-foreground">סטטוס</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(TRACK_STATUS_CONFIG[track.status] || {}).color || "bg-gray-100"}`}>
              {(TRACK_STATUS_CONFIG[track.status] || {}).label || track.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 pt-2 border-t text-xs text-muted-foreground flex-wrap">
          <span>תחילה: {track.start_date}</span><span>·</span>
          <span>סיום מתוכנן: {track.planned_end_date}</span><span>·</span>
          <span>מנהל: {track.current_manager_name}</span>
        </div>
      </Card>

      {/* Link Manager */}
      {isManager && <OnboardingLinkManager track={track} onPreview={() => setViewAsUser(true)} />}

      {/* AI Assistant */}
      <OnboardingAIAssistant track={track} stages={stages} isManager={isManager} />

      {/* Day View (default) */}
      {showDayView && activeGroup && (
        <>
          <DayNavigator dayGroups={dayGroups} activeDay={activeDay} onSelectDay={setActiveDay} />
          <DayView
            day={activeDay}
            stages={stages}
            tasks={tasks}
            meetings={meetings}
            attempts={attempts}
            dailyPlan={activePlan}
            isManager={isManager}
            user={user}
            track={track}
            onQuizStart={setQuizStage}
            onFirstSession={handleFirstSession}
            managers={managers}
            onMentorAssign={handleMentorAssign}
            onQuickToggle={handleQuickToggle}
            onTaskUpdate={handleTaskUpdate}
            onMeetingComplete={handleMeetingComplete}
            onFinishDay={handleFinishDay}
            onNextDay={handleNextDay}
            onReopenStage={handleReopenStage}
            viewAsUser={viewAsUser}
            onToggleLearningItem={handleToggleLearningItem}
          />
        </>
      )}

      {/* Day View: Additional Info */}
      {showDayView && !viewAsUser && (
        <AdditionalInfoPanel categoryMap={categoryMap} attempts={attempts} logs={logs} />
      )}

      {/* Manager Admin View */}
      {!showDayView && isManager && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold mb-2">כל המשימות</h3>
            <PracticalTaskList tasks={tasks} onUpdate={handleTaskUpdate} isManager={isManager} />
          </div>
          <div>
            <h3 className="text-sm font-bold mb-2">כל השיחות</h3>
            <ReviewMeetingList meetings={meetings} onComplete={handleMeetingComplete} user={user} />
          </div>
          <AdditionalInfoPanel categoryMap={categoryMap} attempts={attempts} logs={logs} defaultOpen={true} />
        </div>
      )}

      {/* Help Button */}
      <OnboardingHelpButton />

      {/* Quiz Runner */}
      {quizStage && (
        <QuizRunner stage={quizStage} onboardingId={id}
          employee={{ id: track.employee_id, full_name: track.employee_name }}
          user={user} onClose={() => setQuizStage(null)} onCompleted={handleQuizCompleted} />
      )}
    </div>
  );
}