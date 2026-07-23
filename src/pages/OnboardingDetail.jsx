import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, RotateCcw } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import StageTimeline from "@/components/onboarding/StageTimeline";
import QuizRunner from "@/components/onboarding/QuizRunner";
import PracticalTaskList from "@/components/onboarding/PracticalTaskList";
import ReviewMeetingList from "@/components/onboarding/ReviewMeetingList";
import AuditLogList from "@/components/onboarding/AuditLogList";
import { TRACK_STATUS_CONFIG, CATEGORY_LABELS } from "@/lib/onboardingTemplate";
import { calculateProgress, calculateAverageScore, refreshTrackStats, logAudit } from "@/lib/onboardingUtils";
import { isManagerOrAdmin } from "@/lib/permissions";

export default function OnboardingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizStage, setQuizStage] = useState(null);
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

  const categoryMap = {};
  stages.forEach((s) => {
    if (!categoryMap[s.category]) categoryMap[s.category] = { total: 0, completed: 0, scores: [] };
    categoryMap[s.category].total++;
    if (s.status === "completed") categoryMap[s.category].completed++;
    if (s.quiz_score != null) categoryMap[s.category].scores.push(s.quiz_score);
  });

  return (
    <div className="space-y-4 px-1 overflow-x-hidden" dir="rtl">
      <div className="flex items-center gap-2 min-w-0">
        <Button variant="ghost" size="sm" onClick={() => navigate("/onboarding")} className="gap-1 shrink-0">
          <ArrowRight className="w-4 h-4" /> חזרה
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold truncate">{track.employee_name}</h1>
          <p className="text-xs text-muted-foreground">{track.role_title} · {track.template_name}</p>
        </div>
      </div>

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

      <Tabs defaultValue="timeline">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="timeline">ציר זמן</TabsTrigger>
          <TabsTrigger value="map">מפת חפיפה</TabsTrigger>
          <TabsTrigger value="tasks">משימות</TabsTrigger>
          <TabsTrigger value="reviews">שיחות בקרה</TabsTrigger>
          <TabsTrigger value="quizzes">מבדקים</TabsTrigger>
          <TabsTrigger value="audit">יומן</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-3">
          <StageTimeline stages={stages} onQuizStart={setQuizStage} isManager={isManager} onFirstSession={handleFirstSession} />
          {isManager && stages.filter((s) => s.status === "completed" || s.status === "relearning").length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {stages.filter((s) => s.status === "completed" || s.status === "relearning").map((s) => (
                <Button key={s.id} size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleReopenStage(s)}>
                  <RotateCcw className="w-3 h-3" /> פתח מחדש: {s.title}
                </Button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="map" className="mt-3">
          <Card className="overflow-hidden min-w-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-right p-2">תחום</th>
                    <th className="text-center p-2">התקדמות</th>
                    <th className="text-center p-2">ציון</th>
                    <th className="text-center p-2">סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(categoryMap).map(([cat, data]) => {
                    const catAvg = data.scores.length > 0 ? Math.round(data.scores.reduce((s, v) => s + v, 0) / data.scores.length * 10) / 10 : null;
                    const pct = Math.round((data.completed / data.total) * 100);
                    return (
                      <tr key={cat} className="border-t">
                        <td className="p-2 font-medium">{CATEGORY_LABELS[cat] || cat}</td>
                        <td className="text-center p-2">{data.completed}/{data.total} ({pct}%)</td>
                        <td className="text-center p-2">{catAvg || "—"}</td>
                        <td className="text-center p-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${pct === 100 ? "bg-green-100 text-green-700" : pct > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                            {pct === 100 ? "הושלם" : pct > 0 ? "בתהליך" : "טרם התחיל"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-3">
          <PracticalTaskList tasks={tasks} onUpdate={handleTaskUpdate} isManager={isManager} />
        </TabsContent>

        <TabsContent value="reviews" className="mt-3">
          <ReviewMeetingList meetings={meetings} onComplete={handleMeetingComplete} user={user} />
        </TabsContent>

        <TabsContent value="quizzes" className="mt-3">
          <div className="space-y-2 min-w-0">
            {attempts.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">אין ניסיונות מבדק עדיין</Card>
            ) : (
              attempts.map((att) => (
                <Card key={att.id} className="p-3 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${att.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                      {att.score_1_to_10}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{att.stage_title}</p>
                      <p className="text-xs text-muted-foreground">ניסיון {att.attempt_number} · {att.correct_answers}/{att.total_questions} נכונות · {att.passed ? "עבר" : "נכשל"}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{att.submitted_at ? new Date(att.submitted_at).toLocaleDateString("he-IL") : ""}</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-3">
          <AuditLogList logs={logs} />
        </TabsContent>
      </Tabs>

      {quizStage && (
        <QuizRunner stage={quizStage} onboardingId={id}
          employee={{ id: track.employee_id, full_name: track.employee_name }}
          user={user} onClose={() => setQuizStage(null)} onCompleted={handleQuizCompleted} />
      )}
    </div>
  );
}