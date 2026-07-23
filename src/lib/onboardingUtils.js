import { base44 } from "@/api/base44Client";
import { ONBOARDING_TEMPLATE } from "./onboardingTemplate";

// ─── Initialize a full onboarding track for an employee ──────────
export async function initOnboardingTrack(employee, startDate, user) {
  const plannedEndDate = addDays(startDate, 13); // ~2 weeks

  const track = await base44.entities.EmployeeOnboarding.create({
    employee_id: employee.id,
    employee_name: employee.full_name,
    employee_email: employee.email,
    role_title: ONBOARDING_TEMPLATE.role_title,
    template_name: ONBOARDING_TEMPLATE.name,
    start_date: startDate,
    planned_end_date: plannedEndDate,
    current_manager_name: ONBOARDING_TEMPLATE.current_manager_name,
    future_manager_name: ONBOARDING_TEMPLATE.future_manager_name,
    status: "active",
    total_stages: ONBOARDING_TEMPLATE.stages.length + 1,
    completed_stages: 0,
    failed_quizzes: 0,
  });

  // ── Stages ─────────────────────────────────────────────────────
  const stageRecords = ONBOARDING_TEMPLATE.stages.map((s, i) => ({
    onboarding_id: track.id,
    employee_id: employee.id,
    employee_name: employee.full_name,
    template_stage_id: s.template_stage_id,
    title: s.title,
    category: s.category,
    day_number: s.day_number,
    order_number: s.order_number,
    mentor_name: s.mentor_name,
    requires_mentor_first_session: s.requires_mentor_first_session,
    first_session_done: false,
    status: i === 0 ? "available" : "not_started",
    planned_date: addDays(startDate, Math.ceil(s.day_number / 2) - 1),
    learning_goals: s.learning_goals,
  }));

  // Summary quiz stage
  stageRecords.push({
    onboarding_id: track.id,
    employee_id: employee.id,
    employee_name: employee.full_name,
    template_stage_id: "summary",
    title: ONBOARDING_TEMPLATE.summary_quiz.title,
    category: "review",
    day_number: 10,
    order_number: 99,
    mentor_name: ONBOARDING_TEMPLATE.current_manager_name,
    requires_mentor_first_session: false,
    first_session_done: false,
    status: "not_started",
    is_summary_quiz: true,
  });

  const createdStages = await base44.entities.OnboardingStage.bulkCreate(stageRecords);

  // ── Practical Tasks ────────────────────────────────────────────
  const taskRecords = [];
  ONBOARDING_TEMPLATE.stages.forEach((s) => {
    const stage = createdStages.find((cs) => cs.template_stage_id === s.template_stage_id);
    s.practical_tasks?.forEach((t) => {
      taskRecords.push({
        onboarding_id: track.id,
        stage_id: stage.id,
        employee_id: employee.id,
        employee_name: employee.full_name,
        stage_title: s.title,
        title: t.title,
        instructions: t.instructions,
        task_type: t.task_type,
        status: "pending",
        due_date: addDays(startDate, Math.ceil(s.day_number / 2) - 1),
      });
    });
  });
  if (taskRecords.length > 0) {
    await base44.entities.PracticalTask.bulkCreate(taskRecords);
  }

  // ── Review Meetings ────────────────────────────────────────────
  const meetingRecords = ONBOARDING_TEMPLATE.review_meetings.map((rm) => ({
    onboarding_id: track.id,
    employee_id: employee.id,
    employee_name: employee.full_name,
    review_type: rm.review_type,
    label: rm.label,
    day_number: rm.day_number,
    scheduled_at: addDays(startDate, rm.day_number - 1),
    manager_name: ONBOARDING_TEMPLATE.current_manager_name,
    status: "scheduled",
  }));
  await base44.entities.ReviewMeeting.bulkCreate(meetingRecords);

  // ── Audit Log ──────────────────────────────────────────────────
  await base44.entities.OnboardingAuditLog.create({
    onboarding_id: track.id,
    employee_id: employee.id,
    employee_name: employee.full_name,
    actor_name: user?.full_name || user?.email || "מנהל",
    action: "יצירת מסלול חפיפה",
    new_value: `סטטוס: פעיל, תאריך התחלה: ${startDate}`,
  });

  return track;
}

// ─── Helpers ─────────────────────────────────────────────────────
export function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function calculateProgress(stages) {
  if (!stages || stages.length === 0) return 0;
  const completed = stages.filter((s) => s.status === "completed").length;
  return Math.round((completed / stages.length) * 100);
}

export function calculateAverageScore(attempts) {
  if (!attempts || attempts.length === 0) return 0;
  const stageScores = {};
  attempts.forEach((a) => {
    if (!stageScores[a.stage_id] || a.score_1_to_10 > stageScores[a.stage_id]) {
      stageScores[a.stage_id] = a.score_1_to_10;
    }
  });
  const scores = Object.values(stageScores);
  if (scores.length === 0) return 0;
  return Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10;
}

export async function logAudit(onboardingId, employeeId, employeeName, stageId, stageTitle, actorName, action, oldValue, newValue) {
  await base44.entities.OnboardingAuditLog.create({
    onboarding_id: onboardingId,
    employee_id: employeeId,
    employee_name: employeeName,
    stage_id: stageId || null,
    stage_title: stageTitle || "",
    actor_name: actorName,
    action,
    old_value: oldValue || null,
    new_value: newValue || null,
  });
}

export async function refreshTrackStats(trackId, stages) {
  const completed = stages.filter((s) => s.status === "completed").length;
  const progress = Math.round((completed / stages.length) * 100);
  await base44.entities.EmployeeOnboarding.update(trackId, {
    completed_stages: completed,
    progress_percent: progress,
    current_day: Math.max(...stages.filter(s => s.status !== "not_started").map(s => s.day_number), 0),
  });
}