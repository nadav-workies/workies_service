import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

async function hashToken(token) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function validateAndTrack(base44, token) {
  const tokenHash = await hashToken(token);
  const links = await base44.asServiceRole.entities.OnboardingAccessLink.filter({
    secure_token_hash: tokenHash,
    status: "active",
  });
  const link = links?.[0];
  if (!link) return { error: "invalid_token", status: 404 };

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    await base44.asServiceRole.entities.OnboardingAccessLink.update(link.id, { status: "expired" });
    return { error: "expired", status: 403 };
  }

  await base44.asServiceRole.entities.OnboardingAccessLink.update(link.id, {
    last_access_at: new Date().toISOString(),
    access_count: (link.access_count || 0) + 1,
  });

  return { link };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const action = body.action;

    // ── Public actions (token-validated) ──────────────────────────
    if (action === "validate") {
      const result = await validateAndTrack(base44, body.token);
      if (result.error) return Response.json({ ok: false, error: result.error }, { status: result.status });
      const link = result.link;

      const [track, stages, dailyPlans, tasks, meetings, attempts] = await Promise.all([
        base44.asServiceRole.entities.EmployeeOnboarding.get(link.onboarding_id),
        base44.asServiceRole.entities.OnboardingStage.filter({ onboarding_id: link.onboarding_id }, "order_number", 50),
        base44.asServiceRole.entities.DailyLearningPlan.filter({ onboarding_id: link.onboarding_id }, "day_number", 50),
        base44.asServiceRole.entities.PracticalTask.filter({ onboarding_id: link.onboarding_id }, "due_date", 100),
        base44.asServiceRole.entities.ReviewMeeting.filter({ onboarding_id: link.onboarding_id }, "day_number", 50),
        base44.asServiceRole.entities.QuizAttempt.filter({ onboarding_id: link.onboarding_id }, "-submitted_at", 100),
      ]);

      return Response.json({
        ok: true,
        onboarding_id: link.onboarding_id,
        employee_id: link.employee_id,
        employee_name: link.employee_name,
        track,
        stages: stages || [],
        dailyPlans: dailyPlans || [],
        tasks: tasks || [],
        meetings: meetings || [],
        attempts: attempts || [],
      });
    }

    if (action === "toggleLearningItem") {
      const result = await validateAndTrack(base44, body.token);
      if (result.error) return Response.json({ ok: false, error: result.error }, { status: result.status });
      const link = result.link;

      const stage = await base44.asServiceRole.entities.OnboardingStage.get(body.stage_id);
      if (!stage || stage.onboarding_id !== link.onboarding_id)
        return Response.json({ ok: false, error: "not_found" }, { status: 404 });

      const current = stage.checked_learning_items || [];
      const itemId = body.item_id;
      const updated = current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId];
      await base44.asServiceRole.entities.OnboardingStage.update(stage.id, { checked_learning_items: updated });
      return Response.json({ ok: true, checked: updated.includes(itemId) });
    }

    if (action === "updateTask") {
      const result = await validateAndTrack(base44, body.token);
      if (result.error) return Response.json({ ok: false, error: result.error }, { status: result.status });
      const link = result.link;

      const task = await base44.asServiceRole.entities.PracticalTask.get(body.task_id);
      if (!task || task.onboarding_id !== link.onboarding_id)
        return Response.json({ ok: false, error: "not_found" }, { status: 404 });

      const updates = {};
      for (const key of ["status", "employee_comment"]) {
        if (body[key] !== undefined) updates[key] = body[key];
      }
      await base44.asServiceRole.entities.PracticalTask.update(task.id, updates);
      return Response.json({ ok: true });
    }

    if (action === "finishDay") {
      const result = await validateAndTrack(base44, body.token);
      if (result.error) return Response.json({ ok: false, error: result.error }, { status: result.status });
      const link = result.link;

      const plans = await base44.asServiceRole.entities.DailyLearningPlan.filter({
        onboarding_id: link.onboarding_id,
        day_number: body.day_number,
      });
      if (plans?.[0]) {
        await base44.asServiceRole.entities.DailyLearningPlan.update(plans[0].id, { status: "completed" });
      }

      const s = body.summary || {};
      const summaryText = [s.learned, s.did, s.unclear, s.help, s.note].filter(Boolean).join(" | ");
      await base44.asServiceRole.entities.OnboardingAuditLog.create({
        onboarding_id: link.onboarding_id,
        employee_id: link.employee_id,
        employee_name: link.employee_name,
        actor_name: link.employee_name,
        action: `סיום יום ${body.day_number}${summaryText ? ` — סיכום: ${summaryText}` : ""}`,
        stage_title: `יום ${body.day_number}`,
      });
      return Response.json({ ok: true });
    }

    if (action === "submitQuiz") {
      const result = await validateAndTrack(base44, body.token);
      if (result.error) return Response.json({ ok: false, error: result.error }, { status: result.status });
      const link = result.link;

      const stage = await base44.asServiceRole.entities.OnboardingStage.get(body.stage_id);
      if (!stage || stage.onboarding_id !== link.onboarding_id)
        return Response.json({ ok: false, error: "not_found" }, { status: 404 });

      const attemptNumber = (stage.quiz_attempts || 0) + 1;
      const passed = body.passed;
      const maxAttempts = body.max_attempts || 3;
      const newStatus = passed ? "completed" : (attemptNumber >= maxAttempts ? "relearning" : "failed");

      await base44.asServiceRole.entities.QuizAttempt.create({
        onboarding_id: link.onboarding_id,
        stage_id: stage.id,
        employee_id: link.employee_id,
        employee_name: link.employee_name,
        stage_title: stage.title,
        is_summary: stage.is_summary || false,
        attempt_number: attemptNumber,
        started_at: body.started_at,
        submitted_at: new Date().toISOString(),
        duration_seconds: body.duration_seconds,
        correct_answers: body.correct_answers,
        total_questions: body.total_questions,
        score_1_to_10: body.score_1_to_10,
        passed,
        answers: body.answers || [],
      });

      await base44.asServiceRole.entities.OnboardingStage.update(stage.id, {
        status: newStatus,
        quiz_score: body.score_1_to_10,
        quiz_attempts: attemptNumber,
        completed_at: passed ? new Date().toISOString() : null,
      });

      await base44.asServiceRole.entities.OnboardingAuditLog.create({
        onboarding_id: link.onboarding_id,
        employee_id: link.employee_id,
        employee_name: link.employee_name,
        stage_id: stage.id,
        stage_title: stage.title,
        actor_name: link.employee_name,
        action: `מבדק ${passed ? "עבר" : "נכשל"} — ציון ${body.score_1_to_10}`,
      });

      return Response.json({ ok: true, passed, status: newStatus, attemptNumber });
    }

    if (action === "submitClarification") {
      const result = await validateAndTrack(base44, body.token);
      if (result.error) return Response.json({ ok: false, error: result.error }, { status: result.status });
      const link = result.link;

      await base44.asServiceRole.entities.LearningClarificationRequest.create({
        onboarding_id: link.onboarding_id,
        employee_id: link.employee_id,
        employee_name: link.employee_name,
        learning_item_id: body.learning_item_id || "",
        learning_item_title: body.learning_item_title || "",
        stage_id: body.stage_id || "",
        day_number: body.day_number || null,
        question: body.question,
        request_type: body.request_type || "other",
        urgency: body.urgency || "normal",
        status: "submitted",
      });
      return Response.json({ ok: true });
    }

    // ── Manager-only actions ──────────────────────────────────────
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 403 });
    }

    if (action === "create") {
      // Revoke existing active links for this onboarding
      const existing = await base44.asServiceRole.entities.OnboardingAccessLink.filter({
        onboarding_id: body.onboarding_id,
        status: "active",
      });
      for (const old of existing || []) {
        await base44.asServiceRole.entities.OnboardingAccessLink.update(old.id, {
          status: "revoked",
          revoked_at: new Date().toISOString(),
        });
      }

      const token = generateToken();
      const tokenHash = await hashToken(token);
      const expiresAt = body.expires_at || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

      await base44.asServiceRole.entities.OnboardingAccessLink.create({
        onboarding_id: body.onboarding_id,
        employee_id: body.employee_id,
        employee_name: body.employee_name || "",
        secure_token_hash: tokenHash,
        status: "active",
        access_mode: "secure_link",
        created_by: user.email || user.id,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        access_count: 0,
        max_devices: body.max_devices || null,
      });

      return Response.json({ ok: true, token });
    }

    if (action === "revoke") {
      await base44.asServiceRole.entities.OnboardingAccessLink.update(body.link_id, {
        status: "revoked",
        revoked_at: new Date().toISOString(),
      });
      return Response.json({ ok: true });
    }

    if (action === "getStatus") {
      const links = await base44.asServiceRole.entities.OnboardingAccessLink.filter({
        onboarding_id: body.onboarding_id,
        status: "active",
      });
      return Response.json({ ok: true, link: links?.[0] || null });
    }

    return Response.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (err) {
    return Response.json({ ok: false, error: err?.message || "unknown error" }, { status: 500 });
  }
});