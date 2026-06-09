import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const token = body.token;
    const rating = Number(body.rating);
    const comment = body.comment || "";

    if (!token) {
      return Response.json({ ok: false, error: "missing token" }, { status: 400 });
    }

    if (!rating || rating < 1 || rating > 10) {
      return Response.json({ ok: false, error: "rating must be between 1 and 10" }, { status: 400 });
    }

    const tickets = await base44.asServiceRole.entities.ServiceTicket.filter({ feedback_token: token });
    const ticket = tickets?.[0];

    if (!ticket) {
      return Response.json({ ok: false, error: "ticket not found" }, { status: 404 });
    }

    if (ticket.feedback_submitted === true) {
      return Response.json({ ok: false, error: "feedback already submitted" }, { status: 409 });
    }

    const submittedAt = new Date().toISOString();
    const requiresFollowup = rating <= 5;

    // Step 1: Create SurveyResponse
    const surveyResponse = await base44.asServiceRole.entities.SurveyResponse.create({
      survey_template_key: "service_ticket_feedback",
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number || "",
      feedback_token: token,
      customer_name: ticket.customer_name || "",
      customer_email: ticket.created_by || "",
      room_number: ticket.room_number || null,
      room_label: ticket.room_label || null,
      ticket_type: ticket.ticket_type || "",
      assigned_to: ticket.assigned_to || "",
      rating,
      comment,
      submitted_at: submittedAt,
    });

    // Step 2: Update ServiceTicket (only after SurveyResponse succeeds)
    await base44.asServiceRole.entities.ServiceTicket.update(ticket.id, {
      feedback_submitted: true,
      feedback_rating: rating,
      feedback_comment: comment,
      feedback_submitted_at: submittedAt,
      requires_manager_followup: requiresFollowup,
      google_review_blocked_reason: requiresFollowup ? "דירוג שביעות רצון נמוך" : null,
    });

    // Step 3: Notify managers on low rating
    if (requiresFollowup) {
      base44.asServiceRole.functions.invoke("ticketNotifications", {
        action: "low_rating_alert",
        ticket: { ...ticket, feedback_rating: rating, feedback_comment: comment },
        rating,
        comment,
      }).catch(() => {});
    }

    return Response.json({
      ok: true,
      survey_response_id: surveyResponse.id,
      ticket_id: ticket.id,
      rating,
    });
  } catch (err) {
    return Response.json({ ok: false, error: err?.message || "unknown error" }, { status: 500 });
  }
});