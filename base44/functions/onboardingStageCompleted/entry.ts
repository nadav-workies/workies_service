import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { escapeHtml } from '../../shared/security.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { event, data, old_data } = body;

    if (!data) {
      return Response.json({ skipped: true, reason: 'no data' });
    }

    if (data.status !== 'completed') {
      return Response.json({ skipped: true, reason: 'not completed' });
    }

    if (old_data && old_data.status === 'completed') {
      return Response.json({ skipped: true, reason: 'was already completed' });
    }

    // Security: never trust the request payload. Load the stage server-side and
    // verify it is genuinely completed — all email content and recipients are
    // derived from the server-side record only.
    const stageId = data.id || (event && event.entity_id) || '';
    if (!stageId) {
      return Response.json({ skipped: true, reason: 'no stage id' });
    }
    let stage = null;
    try {
      const stages = await base44.asServiceRole.entities.OnboardingStage.filter({ id: stageId });
      stage = stages[0] || null;
    } catch (_e) {
      stage = null;
    }
    if (!stage || stage.status !== 'completed') {
      return Response.json({ skipped: true, reason: 'stage not found or not completed' });
    }

    // Get the onboarding track for context (non-fatal if lookup fails)
    let onboarding = null;
    if (stage.onboarding_id) {
      try {
        const tracks = await base44.asServiceRole.entities.EmployeeOnboarding.filter({ id: stage.onboarding_id });
        onboarding = tracks[0] || null;
      } catch (_e) {
        // Continue without track context
      }
    }

    // Determine recipients: assigned mentor user first, otherwise all managers/admins
    let recipients = [];

    if (stage.mentor_user_id) {
      const mentorUsers = await base44.asServiceRole.entities.User.filter({ id: stage.mentor_user_id });
      if (mentorUsers[0] && mentorUsers[0].email) {
        recipients.push(mentorUsers[0]);
      }
    }

    if (!recipients.length) {
      const allUsers = await base44.asServiceRole.entities.User.list();
      recipients = allUsers.filter((u) => (u.role === 'admin' || u.role === 'manager') && u.email);
    }

    if (!recipients.length) {
      return Response.json({ sent: 0, reason: 'no recipients found' });
    }

    // All fields HTML-escaped before interpolation into the email body
    const employeeName = escapeHtml(stage.employee_name || (onboarding && onboarding.employee_name) || 'משתמש/ת');
    const stageTitle = escapeHtml(stage.title || 'שלב חפיפה');
    const quizScore = stage.quiz_score;
    const attempts = stage.quiz_attempts || 0;
    const dayNumber = stage.day_number;
    const category = escapeHtml(stage.category || '—');
    const mentorName = escapeHtml(stage.mentor_name || (onboarding && onboarding.current_manager_name) || '—');
    const roleTitle = escapeHtml((onboarding && onboarding.role_title) || '—');

    // Generate recommendations based on score and attempts
    const recommendations = [];

    if (quizScore != null) {
      if (quizScore >= 9) {
        recommendations.push('הופגנה הבנה מעולה של החומר. ניתן לעבור לשלב הבא בביטחון.');
      } else if (quizScore >= 8) {
        recommendations.push('המבדק הושלם בהצלחה. מומלץ לבדוק את התשובות השגויות ולוודא הבנה מלאה לפני מעבר הלאה.');
      } else if (quizScore >= 6) {
        recommendations.push('הבנה חלקית. מומלץ לתגבר את הנושאים שבהם נטעו לפני מעבר לשלב הבא.');
      } else {
        recommendations.push('ציון נמוך. נדרשת למידה חוזרת של החומר עם החונך לפני המשך.');
      }
    } else {
      recommendations.push('השלב הושלם ללא מבדק. מומלץ לוודא הבנה מעשית של התוכן.');
    }

    if (attempts >= 3) {
      recommendations.push('⚠️ בוצעו 3 ניסיונות. נדרשת למידה מחדש עם החונך לפני פתיחת המבדק מחדש.');
    }

    if (stage.requires_mentor_first_session && !stage.first_session_done) {
      recommendations.push('⚠️ השלב דורש מפגש ראשון עם החונך שטרם סומן כבוצע.');
    }

    recommendations.push('מומלץ לתעד שיחת סיכום ולבדוק מוכנות לשלב הבא.');

    const subject = 'סיום שלב חפיפה | ' + (stage.employee_name || 'משתמש/ת') + ' | ' + (stage.title || 'שלב חפיפה') + ' | Workies';

    // Build summary text outside template literal to avoid nesting issues
    const dayText = dayNumber ? ' (יום ' + dayNumber + ')' : '';
    const scoreText = quizScore != null ? ' ציון המבדק: ' + quizScore + ' מתוך 10 לאחר ' + attempts + ' ניסיונות.' : '';
    const summaryText = employeeName + ' השלים/ה את השלב "' + stageTitle + '"' + dayText + '.' + scoreText;

    const scoreRow = quizScore != null
      ? '<tr><td style="padding:6px;font-weight:bold;">ציון מבדק</td><td><strong style="color:' + (quizScore >= 8 ? '#16a34a' : '#ef4444') + ';">' + quizScore + '/10</strong></td></tr>'
      : '';

    const recsHtml = recommendations.map(function (r) {
      return '<li style="margin-bottom:6px;color:#374151;">' + r + '</li>';
    }).join('');

    const bodyHtml =
      '<div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: auto;">' +
        '<h2 style="color:#16a34a;">✅ הושלם שלב חפיפה</h2>' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<tr><td style="padding:6px;font-weight:bold;">שם</td><td>' + employeeName + '</td></tr>' +
          '<tr><td style="padding:6px;font-weight:bold;">תפקיד</td><td>' + roleTitle + '</td></tr>' +
          '<tr><td style="padding:6px;font-weight:bold;">שלב</td><td>' + stageTitle + '</td></tr>' +
          '<tr><td style="padding:6px;font-weight:bold;">יום</td><td>' + (dayNumber || '—') + '</td></tr>' +
          '<tr><td style="padding:6px;font-weight:bold;">קטגוריה</td><td>' + category + '</td></tr>' +
          '<tr><td style="padding:6px;font-weight:bold;">חונך</td><td>' + mentorName + '</td></tr>' +
          scoreRow +
          '<tr><td style="padding:6px;font-weight:bold;">ניסיונות מבדק</td><td>' + attempts + '</td></tr>' +
        '</table>' +
        '<div style="margin-top:20px;">' +
          '<h3 style="color:#1e40af;">סיכום</h3>' +
          '<p style="color:#374151;">' + summaryText + '</p>' +
        '</div>' +
        '<div style="margin-top:16px;">' +
          '<h3 style="color:#1e40af;">המלצות</h3>' +
          '<ul style="padding-right:20px;">' + recsHtml + '</ul>' +
        '</div>' +
        '<p style="margin-top:24px;color:#6b7280;font-size:12px;">הודעה אוטומטית ממודול קליטת עובד — Workies</p>' +
      '</div>';

    let sent = 0;
    for (const recipient of recipients) {
      if (!recipient.email) continue;
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipient.email,
        subject: subject,
        body: bodyHtml,
      });
      sent++;
    }

    // Log to audit trail
    if (stage.onboarding_id) {
      await base44.asServiceRole.entities.OnboardingAuditLog.create({
        onboarding_id: stage.onboarding_id,
        employee_id: stage.employee_id,
        employee_name: stage.employee_name,
        stage_id: stage.id,
        stage_title: stage.title || 'שלב חפיפה',
        actor_name: 'מערכת אוטומטית',
        action: 'סיום שלב — נשלח מייל סיכום והמלצות ל-' + sent + ' נמענים',
        old_value: (old_data && old_data.status) || '—',
        new_value: 'completed',
      });
    }

    return Response.json({ sent: sent, recipients: recipients.map(function (r) { return r.email; }) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}