import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ─── Calculate yesterday & day-before ranges (local Israel time) ───
    const now = new Date();
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const yesterdayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    const yesterdayStartMs = yesterdayStart.getTime();
    const yesterdayEndMs   = yesterdayEnd.getTime();

    const dayBeforeStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 0, 0, 0, 0);
    const dayBeforeEnd     = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 23, 59, 59, 999);
    const dayBeforeStartMs = dayBeforeStart.getTime();
    const dayBeforeEndMs   = dayBeforeEnd.getTime();

    const yesterdayLabel = `${String(yesterdayStart.getDate()).padStart(2,"0")}/${String(yesterdayStart.getMonth()+1).padStart(2,"0")}/${yesterdayStart.getFullYear()}`;
    const dayBeforeLabel = `${String(dayBeforeStart.getDate()).padStart(2,"0")}/${String(dayBeforeStart.getMonth()+1).padStart(2,"0")}/${dayBeforeStart.getFullYear()}`;

    // ─── 1. Fetch data ───────────────────────────────────────────────
    const [tickets, allUsers, surveyResponses, serviceFeedbacks, inspections] = await Promise.all([
      base44.asServiceRole.entities.ServiceTicket.list("-created_date", 1000),
      base44.asServiceRole.entities.User.list("-created_date", 500),
      base44.asServiceRole.entities.SurveyResponse.list("-submitted_at", 500),
      base44.asServiceRole.entities.ServiceFeedback.list("-submitted_at", 500),
      base44.asServiceRole.entities.CleaningInspection.list("-created_at", 500),
    ]);

    // ─── Helper: filter by ms range ──────────────────────────────────
    const inRange = (ms, startMs, endMs) => ms && ms >= startMs && ms <= endMs;

    const getOpenedMs = (t) => {
      if (t.opened_at_ms) return Number(t.opened_at_ms);
      if (t.opened_at) return new Date(t.opened_at).getTime();
      if (t.created_date) return new Date(t.created_date).getTime();
      return null;
    };
    const getClosedMs = (t) => t.closed_at ? new Date(t.closed_at).getTime() : null;
    const getCreatedMs = (r) => r.created_date ? new Date(r.created_date).getTime() : null;
    const getSubmittedMs = (r) => r.submitted_at ? new Date(r.submitted_at).getTime() : null;
    const getInspectionDateMs = (i) => i.created_at ? new Date(i.created_at).getTime() : null;

    // ─── 2. SLA stats ───────────────────────────────────────────────
    const isLive = (t) => !t.archived && !t.is_test_data && !t.exclude_from_metrics;

    const openedYesterday = tickets.filter(t => isLive(t) && inRange(getOpenedMs(t), yesterdayStartMs, yesterdayEndMs));
    const openedDayBefore = tickets.filter(t => isLive(t) && inRange(getOpenedMs(t), dayBeforeStartMs, dayBeforeEndMs));

    const closedYesterday = tickets.filter(t => isLive(t) && inRange(getClosedMs(t), yesterdayStartMs, yesterdayEndMs));
    const closedDayBefore = tickets.filter(t => isLive(t) && inRange(getClosedMs(t), dayBeforeStartMs, dayBeforeEndMs));

    // Breached = closed tickets where closed_at > sla_deadline
    const breachedYesterday = closedYesterday.filter(t => {
      const dlMs = Number(t.sla_deadline_ms) || (t.sla_deadline ? new Date(t.sla_deadline).getTime() : null);
      const clMs = getClosedMs(t);
      return dlMs && clMs && clMs > dlMs;
    });
    const breachedDayBefore = closedDayBefore.filter(t => {
      const dlMs = Number(t.sla_deadline_ms) || (t.sla_deadline ? new Date(t.sla_deadline).getTime() : null);
      const clMs = getClosedMs(t);
      return dlMs && clMs && clMs > dlMs;
    });

    const onTimeYesterday = closedYesterday.length - breachedYesterday.length;
    const onTimeDayBefore = closedDayBefore.length - breachedDayBefore.length;

    const complianceYesterday = closedYesterday.length > 0
      ? Math.round((onTimeYesterday / closedYesterday.length) * 100)
      : null;
    const complianceDayBefore = closedDayBefore.length > 0
      ? Math.round((onTimeDayBefore / closedDayBefore.length) * 100)
      : null;

    // Open tickets count (still open, regardless of date)
    const openNow = tickets.filter(t => isLive(t) && t.status !== "נסגרה").length;

    // Improvement arrows
    const diffArrow = (yesterday, dayBefore) => {
      if (yesterday == null || dayBefore == null || yesterday === dayBefore) return "←→";
      return yesterday > dayBefore ? "↑" : "↓";
    };
    const diffColor = (yesterday, dayBefore) => {
      if (yesterday == null || dayBefore == null || yesterday === dayBefore) return "#888";
      return yesterday > dayBefore ? "#22c55e" : "#ef4444";
    };

    // ─── 3. New users ────────────────────────────────────────────────
    const newUsersYesterday = allUsers.filter(u => inRange(getCreatedMs(u), yesterdayStartMs, yesterdayEndMs));
    const newUsersDayBefore = allUsers.filter(u => inRange(getCreatedMs(u), dayBeforeStartMs, dayBeforeEndMs));

    // ─── 4. Survey responses ─────────────────────────────────────────
    const allResponsesRaw = [...surveyResponses, ...serviceFeedbacks.map(f => ({
      ticket_id: f.ticket_id, ticket_number: f.ticket_number,
      customer_name: f.customer_name || "", rating: f.rating,
      comment: f.comment || "", submitted_at: f.submitted_at,
    }))];

    const responsesYesterday = allResponsesRaw.filter(r => inRange(getSubmittedMs(r), yesterdayStartMs, yesterdayEndMs));
    const responsesDayBefore = allResponsesRaw.filter(r => inRange(getSubmittedMs(r), dayBeforeStartMs, dayBeforeEndMs));

    const ratedYesterday = responsesYesterday.filter(r => Number(r.rating) > 0);
    const ratedDayBefore = responsesDayBefore.filter(r => Number(r.rating) > 0);

    const avgRatingYesterday = ratedYesterday.length > 0
      ? (ratedYesterday.reduce((s, r) => s + Number(r.rating), 0) / ratedYesterday.length).toFixed(1)
      : null;
    const avgRatingDayBefore = ratedDayBefore.length > 0
      ? (ratedDayBefore.reduce((s, r) => s + Number(r.rating), 0) / ratedDayBefore.length).toFixed(1)
      : null;

    // ─── 5. Cleaning inspections (bathrooms only) ────────────────────
    const bathroomAreas = ["שירותים", "חלל ציבורי"];
    const bathroomInspectionsYesterday = inspections.filter(i =>
      bathroomAreas.includes(i.area) && inRange(getInspectionDateMs(i), yesterdayStartMs, yesterdayEndMs)
    );
    const bathroomInspectionsDayBefore = inspections.filter(i =>
      bathroomAreas.includes(i.area) && inRange(getInspectionDateMs(i), dayBeforeStartMs, dayBeforeEndMs)
    );

    const avgCleanYesterday = bathroomInspectionsYesterday.length > 0
      ? (bathroomInspectionsYesterday.reduce((s, i) => s + Number(i.cleanliness_rating || 0), 0) / bathroomInspectionsYesterday.length).toFixed(1)
      : null;
    const avgCleanDayBefore = bathroomInspectionsDayBefore.length > 0
      ? (bathroomInspectionsDayBefore.reduce((s, i) => s + Number(i.cleanliness_rating || 0), 0) / bathroomInspectionsDayBefore.length).toFixed(1)
      : null;

    // ─── 6. Build HTML email ─────────────────────────────────────────
    const metricRow = (label, yesterdayVal, dayBeforeVal, unit = "") => {
      const arrow = diffArrow(yesterdayVal, dayBeforeVal);
      const color = diffColor(yesterdayVal, dayBeforeVal);
      const yVal = yesterdayVal != null ? yesterdayVal : "—";
      const dVal = dayBeforeVal != null ? dayBeforeVal : "—";
      return `<tr>
        <td style="padding:8px 12px;text-align:right;font-weight:600;">${label}</td>
        <td style="padding:8px 12px;text-align:center;">${yVal}${unit}</td>
        <td style="padding:8px 12px;text-align:center;">${dVal}${unit}</td>
        <td style="padding:8px 12px;text-align:center;color:${color};font-size:18px;">${arrow}</td>
      </tr>`;
    };

    const sectionHtml = (title, rowsHtml) => `
      <div style="margin-bottom:20px;">
        <h3 style="margin:0 0 8px;color:#333;font-size:16px;">${title}</h3>
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background:#f97316;color:#fff;">
              <th style="padding:8px 12px;text-align:right;">מדד</th>
              <th style="padding:8px 12px;text-align:center;">אתמו�ל ${yesterdayLabel}</th>
              <th style="padding:8px 12px;text-align:center;">שלשום ${dayBeforeLabel}</th>
              <th style="padding:8px 12px;text-align:center;">מגמה</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>`;

    // SLA section
    const slaRows = [
      metricRow("קריאות שנפתחו", openedYesterday.length, openedDayBefore.length),
      metricRow("קריאות שטופלו (נסגרו)", closedYesterday.length, closedDayBefore.length),
      metricRow("חריגות SLA", breachedYesterday.length, breachedDayBefore.length),
      metricRow("אחוז עמידה ב-SLA", complianceYesterday, complianceDayBefore, "%"),
      metricRow("קריאות פתוחות כרגע", openNow, null),
    ].join("");

    // Users section
    const usersRows = [
      metricRow("משתמשים חדשים", newUsersYesterday.length, newUsersDayBefore.length),
      metricRow("סה\"כ משתמשים במערכת", allUsers.length, null),
    ].join("");

    // Surveys section
    const surveysRows = [
      metricRow("משובים שהתקבלו", responsesYesterday.length, responsesDayBefore.length),
      metricRow("דירוג ממוצע", avgRatingYesterday, avgRatingDayBefore, "/10"),
      metricRow("מתוכם מדורגים", ratedYesterday.length, ratedDayBefore.length),
    ].join("");

    // Cleaning section
    const cleanRows = [
      metricRow("בקרות ניקיון (שירותים)", bathroomInspectionsYesterday.length, bathroomInspectionsDayBefore.length),
      metricRow("דירוג ניקיון ממוצע", avgCleanYesterday, avgCleanDayBefore, "/10"),
    ].join("");

    // Survey detail rows
    let surveyDetailHtml = "";
    if (ratedYesterday.length > 0) {
      surveyDetailHtml = `
        <div style="margin-bottom:15px;">
          <h4 style="margin:0 0 4px;color:#555;font-size:14px;">פירוט משובים מאתמול:</h4>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            ${ratedYesterday.map(r => `
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:4px 8px;">${r.ticket_number || "—"}</td>
                <td style="padding:4px 8px;">${r.customer_name || "—"}</td>
                <td style="padding:4px 8px;font-weight:bold;color:${Number(r.rating) >= 9 ? '#22c55e' : Number(r.rating) <= 5 ? '#ef4444' : '#f97316'};">${r.rating}/10</td>
                <td style="padding:4px 8px;color:#666;">${r.comment || "—"}</td>
              </tr>`).join("")}
          </table>
        </div>`;
    }

    const fullHtml = `
      <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5;">
        <div style="text-align:center;margin-bottom:20px;">
          <h2 style="margin:0;color:#f97316;">📊 סיכום יומי — ${yesterdayLabel}</h2>
          <p style="margin:4px 0 0;color:#888;font-size:12px;">דוח אוטומטי למנהלים · ${now.toLocaleDateString("he-IL")} ${now.toLocaleTimeString("he-IL", {hour:"2-digit", minute:"2-digit"})}</p>
        </div>

        ${sectionHtml("📋 מדדי SLA", slaRows)}
        ${sectionHtml("👥 משתמשים", usersRows)}
        ${sectionHtml("⭐ סקרי שביעות רצון", surveysRows)}
        ${surveyDetailHtml}
        ${sectionHtml("🧹 בקרת ניקיון — חדרי שירותים", cleanRows)}

        <div style="text-align:center;margin-top:20px;color:#aaa;font-size:11px;">
          דוח זה נשלח אוטומטית בכל בוקר. לשינוי ההגדרות, פנה למנהל המערכת.
        </div>
      </div>`;

    // ─── 7. Send to managers ─────────────────────────────────────────
    const managers = allUsers.filter(u => (u.role === "manager" || u.role === "admin") && u.email && !u.disabled);
    const recipients = [];

    for (const mgr of managers) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: mgr.email,
          subject: `📊 סיכום יומי — ${yesterdayLabel}`,
          body: fullHtml,
        });
        recipients.push(mgr.email);
      } catch (e) {
        console.error(`Failed to send to ${mgr.email}:`, e.message);
      }
    }

    return Response.json({
      ok: true,
      date: yesterdayLabel,
      recipients: recipients.length,
      managerEmails: recipients,
      summary: {
        opened: openedYesterday.length,
        closed: closedYesterday.length,
        breached: breachedYesterday.length,
        compliance: complianceYesterday,
        openNow,
        newUsers: newUsersYesterday.length,
        surveyResponses: responsesYesterday.length,
        avgRating: avgRatingYesterday,
        bathroomInspections: bathroomInspectionsYesterday.length,
        avgCleanRating: avgCleanYesterday,
      },
    });
  } catch (err) {
    return Response.json({ ok: false, error: err?.message || "unknown error" }, { status: 500 });
  }
});