import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─── Template renderer ────────────────────────────────────────────
function renderTemplate(template, ticket) {
  if (!template) return '';
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => ticket[key] ?? '');
}

// ─── Build HTML email ─────────────────────────────────────────────
function buildHtml(body) {
  return `<div dir="rtl" style="font-family:'Heebo',Arial,sans-serif;max-width:560px;margin:auto;color:#1a1a2e;">
    <div style="background:#0f172a;padding:16px 24px;border-radius:8px 8px 0 0;">
      <span style="color:#f97316;font-weight:bold;font-size:18px;">Workies</span>
      <span style="color:#94a3b8;font-size:12px;margin-right:8px;">קריאות שירות</span>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
      <p style="line-height:1.8;white-space:pre-line;">${body}</p>
    </div>
    <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:8px;">Workies AIO | מערכת קריאות שירות</p>
  </div>`;
}

// ─── Notification log ─────────────────────────────────────────────
async function createLog(base44, payload) {
  return base44.asServiceRole.entities.NotificationLog.create({
    ...payload,
    sent_at: new Date().toISOString(),
  });
}

async function logSkipped(base44, { key, ticket, reason, recipientType }) {
  return createLog(base44, {
    ticket_id: ticket?.id || '',
    ticket_number: ticket?.ticket_number || '',
    notification_key: key,
    recipient_email: '',
    recipient_type: recipientType,
    subject: '',
    status: 'skipped',
    error_message: reason,
  });
}

// ─── Get notification setting by key ─────────────────────────────
async function getSetting(base44, key) {
  const results = await base44.asServiceRole.entities.NotificationSetting.filter({ key });
  return results[0] || null;
}

// ─── Send one email and log it ────────────────────────────────────
async function sendAndLog(base44, { key, toEmail, subject, bodyHtml, ticket, recipientType }) {
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: toEmail,
      subject,
      body: bodyHtml,
      is_html: true,
    });
    await createLog(base44, {
      ticket_id: ticket?.id || '',
      ticket_number: ticket?.ticket_number || '',
      notification_key: key,
      recipient_email: toEmail,
      recipient_type: recipientType,
      subject,
      status: 'sent',
    });
    return true;
  } catch (err) {
    await createLog(base44, {
      ticket_id: ticket?.id || '',
      ticket_number: ticket?.ticket_number || '',
      notification_key: key,
      recipient_email: toEmail,
      recipient_type: recipientType,
      subject,
      status: 'failed',
      error_message: err.message,
    });
    return false;
  }
}

// ─── Feedback token + link ────────────────────────────────────────
function getAppBaseUrl(req) {
  const origin = req.headers.get('origin');
  if (origin) return origin;
  const host = req.headers.get('host');
  if (host) return `https://${host}`;
  return '';
}

async function ensureFeedbackFields(base44, ticket, req) {
  const token = ticket.feedback_token || crypto.randomUUID();
  const baseUrl = getAppBaseUrl(req);
  const feedbackLink = ticket.feedback_link || `${baseUrl}/feedback/${token}`;
  const updates = { feedback_token: token, feedback_link: feedbackLink };
  await base44.asServiceRole.entities.ServiceTicket.update(ticket.id, updates);
  return { ...ticket, ...updates };
}

// ─── Default notification settings ───────────────────────────────
const DEFAULT_NOTIFICATION_SETTINGS = [
  { key: 'user_ticket_created', label: 'קריאתך נרשמה', recipient_type: 'user', enabled: true, subject_template: 'קריאתך נרשמה | Workies', body_template: 'שלום {{created_by_name}},\n\nקריאת השירות שלך נרשמה בהצלחה.\n\nמספר קריאה: {{ticket_number}}\nסוג קריאה: {{ticket_type}}\nמיקום: {{room_label}}\nסטטוס: {{status}}\n\nנעדכן אותך בהמשך הטיפול.\n\nצוות Workies', send_once: true },
  { key: 'manager_ticket_created', label: 'קריאה חדשה נפתחה', recipient_type: 'managers', enabled: true, subject_template: 'קריאת שירות חדשה נפתחה | Workies', body_template: 'נפתחה קריאת שירות חדשה.\n\nמספר קריאה: {{ticket_number}}\nלקוח: {{customer_name}}\nמיקום: {{room_label}}\nסוג קריאה: {{ticket_type}}\nדחיפות: {{priority}}\nסטטוס: {{status}}\n\nיש להיכנס למערכת להמשך טיפול.', send_once: true },
  { key: 'manager_urgent_ticket_created', label: 'קריאה דחופה נפתחה', recipient_type: 'managers', enabled: true, subject_template: 'קריאת שירות דחופה נפתחה | Workies', body_template: 'נפתחה קריאת שירות בדחיפות גבוהה.\n\nמספר קריאה: {{ticket_number}}\nלקוח: {{customer_name}}\nמיקום: {{room_label}}\nסוג קריאה: {{ticket_type}}\nדחיפות: {{priority}}\nSLA: {{sla_label}}\n\nנדרש טיפול מיידי.', send_once: true },
  { key: 'user_ticket_assigned', label: 'הקריאה שויכה לטיפול', recipient_type: 'user', enabled: true, subject_template: 'קריאת השירות שלך שויכה לטיפול | Workies', body_template: 'שלום {{created_by_name}},\n\nקריאת השירות שלך שויכה לטיפול.\n\nמספר קריאה: {{ticket_number}}\nאחראי טיפול: {{assigned_to}}\nסטטוס: {{status}}\n\nצוות Workies', send_once: false },
  { key: 'user_ticket_status_in_progress', label: 'הקריאה בטיפול', recipient_type: 'user', enabled: true, subject_template: 'קריאת השירות שלך בטיפול | Workies', body_template: 'שלום {{created_by_name}},\n\nקריאת השירות שלך נמצאת כעת בטיפול.\n\nמספר קריאה: {{ticket_number}}\nסוג קריאה: {{ticket_type}}\nסטטוס: {{status}}\n\nצוות Workies', send_once: false },
  { key: 'user_ticket_waiting', label: 'הקריאה ממתינה', recipient_type: 'user', enabled: true, subject_template: 'עדכון לגבי קריאת השירות שלך | Workies', body_template: 'שלום {{created_by_name}},\n\nקריאת השירות שלך נמצאת כרגע בהמתנה.\n\nמספר קריאה: {{ticket_number}}\nסטטוס: {{status}}\n\nניתן להיכנס למערכת ולהוסיף מידע במידת הצורך.\n\nצוות Workies', send_once: false },
  { key: 'user_ticket_resolved', label: 'הקריאה טופלה', recipient_type: 'user', enabled: true, subject_template: 'קריאת השירות שלך טופלה | Workies', body_template: 'שלום {{created_by_name}},\n\nקריאת השירות שלך סומנה כטופלה.\n\nמספר קריאה: {{ticket_number}}\nסיכום טיפול: {{resolution_summary}}\n\nצוות Workies', send_once: false },
  { key: 'user_ticket_closed', label: 'הקריאה נסגרה', recipient_type: 'user', enabled: true, subject_template: 'קריאת השירות שלך נסגרה | Workies', body_template: 'שלום {{created_by_name}},\n\nקריאת השירות שלך נסגרה.\n\nמספר קריאה: {{ticket_number}}\nסיכום טיפול: {{resolution_summary}}\n\nתודה,\nצוות Workies', send_once: true },
  { key: 'user_service_feedback_request', label: 'בקשת דירוג חוויית שירות', recipient_type: 'user', enabled: true, subject_template: 'נשמח לדירוג חוויית השירות שלך | Workies', body_template: 'שלום {{created_by_name}},\n\nקריאת השירות שלך נסגרה.\nנשמח אם תדרג בקצרה את חוויית השירות שקיבלת.\n\nהדירוג הוא בטווח 1 עד 10:\n10 = מעל לציפיות\n5 = סביר\n1 = טעון שיפור\n\nלמילוי הסקר:\n{{feedback_link}}\n\nתודה,\nצוות Workies', send_once: true },
  { key: 'manager_low_service_rating', label: 'התראת דירוג שירות נמוך', recipient_type: 'managers', enabled: true, subject_template: 'דירוג שירות נמוך התקבל | Workies', body_template: 'התקבל דירוג שירות נמוך עבור קריאת שירות.\n\nמספר קריאה: {{ticket_number}}\nלקוח: {{customer_name}}\nדירוג: {{feedback_rating}}\nהערה: {{feedback_comment}}\n\nנדרש מעקב מנהל.', send_once: true },
  { key: 'user_google_review_request', label: 'בקשת דירוג Google', recipient_type: 'user', enabled: true, subject_template: 'נשמח לדירוג שלך ב־Google | Workies', body_template: 'שלום {{created_by_name}},\n\nלפני מספר ימים סגרנו את קריאת השירות שלך.\nאם חוויית השירות הייתה טובה, נשמח לדירוג קצר ב־Google:\n\nhttps://g.page/r/CfHCiTs_vTSMEBM/review\n\nתודה,\nצוות Workies', reminder_minutes: 4320, send_once: true },
  { key: 'manager_sla_reminder', label: 'תזכורת לפני חריגת SLA', recipient_type: 'managers', enabled: true, subject_template: 'תזכורת SLA לפני חריגה | Workies', body_template: 'קריאת שירות מתקרבת לחריגת SLA.\n\nמספר קריאה: {{ticket_number}}\nלקוח: {{customer_name}}\nמיקום: {{room_label}}\nסוג קריאה: {{ticket_type}}\nמועד יעד: {{sla_deadline}}\n\nנדרש טיפול מיידי.', send_once: true },
  { key: 'manager_sla_breached', label: 'חריגת SLA', recipient_type: 'managers', enabled: true, subject_template: 'חריגת SLA בקריאת שירות | Workies', body_template: 'קריאת שירות חרגה מזמן ה־SLA.\n\nמספר קריאה: {{ticket_number}}\nלקוח: {{customer_name}}\nמיקום: {{room_label}}\nסוג קריאה: {{ticket_type}}\nסטטוס: {{status}}\n\nנדרש טיפול מנהל.', send_once: true },
];

async function ensureDefaultNotificationSettings(base44) {
  for (const item of DEFAULT_NOTIFICATION_SETTINGS) {
    const existing = await base44.asServiceRole.entities.NotificationSetting.filter({ key: item.key });
    if (!existing || existing.length === 0) {
      await base44.asServiceRole.entities.NotificationSetting.create(item);
    }
  }
}

// ─── Default survey template ──────────────────────────────────────
async function ensureDefaultSurveyTemplate(base44) {
  const existing = await base44.asServiceRole.entities.SurveyTemplate.filter({ key: 'service_ticket_feedback' });
  if (!existing || existing.length === 0) {
    await base44.asServiceRole.entities.SurveyTemplate.create({
      key: 'service_ticket_feedback',
      name: 'סקר חוויית שירות לאחר טיפול בקריאה',
      description: 'סקר קצר לדירוג חוויית השירות לאחר סגירת קריאת שירות',
      is_active: true,
      trigger_event: 'ticket_closed',
      questions: [
        { question_id: 'service_rating', label: 'איך היית מדרג את חוויית השירות שקיבלת?', type: 'rating_1_10', required: true, order: 1, help_text: '10 = מעל לציפיות, 5 = סביר, 1 = טעון שיפור' },
        { question_id: 'service_comment', label: 'נשמח לשמוע בקצרה מה עבד טוב או מה כדאי לשפר', type: 'text', required: false, order: 2, help_text: 'שדה זה אינו חובה' },
      ],
    });
  }
}

// ─── Main handler ─────────────────────────────────────────────────
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const now = new Date();

  const { action, ticket, newStatus, rating, comment } = await req.json();

  if (!action) {
    return Response.json({ error: 'missing action' }, { status: 400 });
  }

  const ACTIONS_WITHOUT_TICKET = ['check_sla', 'check_post_closure', 'ensure_defaults'];
  if (!ticket && !ACTIONS_WITHOUT_TICKET.includes(action)) {
    return Response.json({ error: 'missing ticket' }, { status: 400 });
  }

  // Ensure defaults on every call
  await ensureDefaultNotificationSettings(base44);
  await ensureDefaultSurveyTemplate(base44);

  const results = {};

  // ── ensure_defaults ───────────────────────────────────────────
  if (action === 'ensure_defaults') {
    return Response.json({ ok: true, action, ensured: true });
  }

  // ── ticket_created ────────────────────────────────────────────
  if (action === 'ticket_created') {
    // 1. User email
    const userSetting = await getSetting(base44, 'user_ticket_created');
    if (userSetting?.enabled && ticket.created_by) {
      const subject = renderTemplate(userSetting.subject_template, ticket);
      const body = renderTemplate(userSetting.body_template, ticket);
      const sent = await sendAndLog(base44, { key: 'user_ticket_created', toEmail: ticket.created_by, subject, bodyHtml: buildHtml(body), ticket, recipientType: 'user' });
      if (sent) await base44.asServiceRole.entities.ServiceTicket.update(ticket.id, { user_created_email_sent: true });
      results.user_created = sent;
    } else {
      await logSkipped(base44, { key: 'user_ticket_created', ticket, reason: userSetting ? 'disabled or no email' : 'NotificationSetting missing', recipientType: 'user' });
      results.user_created = false;
    }

    // 2. Manager notification — every ticket
    const managerSetting = await getSetting(base44, 'manager_ticket_created');
    if (managerSetting?.enabled) {
      const allUsers = await base44.asServiceRole.entities.User.list();
      const managers = allUsers.filter(u => u.role === 'admin' || u.role === 'manager');
      let managerSent = false;
      for (const mgr of managers) {
        if (!mgr.email) continue;
        const subject = renderTemplate(managerSetting.subject_template, ticket);
        const body = renderTemplate(managerSetting.body_template, ticket);
        const sent = await sendAndLog(base44, { key: 'manager_ticket_created', toEmail: mgr.email, subject, bodyHtml: buildHtml(body), ticket, recipientType: 'managers' });
        if (sent) managerSent = true;
      }
      results.manager_ticket_created = managerSent;
    } else {
      await logSkipped(base44, { key: 'manager_ticket_created', ticket, reason: managerSetting ? 'disabled' : 'NotificationSetting missing', recipientType: 'managers' });
    }

    // 3. Urgent alert for high/critical
    if (['גבוהה', 'קריטית'].includes(ticket.priority)) {
      const urgentSetting = await getSetting(base44, 'manager_urgent_ticket_created');
      if (urgentSetting?.enabled) {
        const allUsers = await base44.asServiceRole.entities.User.list();
        const managers = allUsers.filter(u => u.role === 'admin' || u.role === 'manager');
        let urgentSent = false;
        for (const mgr of managers) {
          if (!mgr.email) continue;
          const subject = renderTemplate(urgentSetting.subject_template, ticket);
          const body = renderTemplate(urgentSetting.body_template, ticket);
          const sent = await sendAndLog(base44, { key: 'manager_urgent_ticket_created', toEmail: mgr.email, subject, bodyHtml: buildHtml(body), ticket, recipientType: 'managers' });
          if (sent) urgentSent = true;
        }
        if (urgentSent) await base44.asServiceRole.entities.ServiceTicket.update(ticket.id, { manager_alert_sent: true });
        results.managers_urgent = urgentSent;
      }
    }
  }

  // ── status_changed ────────────────────────────────────────────
  if (action === 'status_changed' && ticket.created_by) {
    const keyMap = {
      'שויכה לטיפול': 'user_ticket_assigned',
      'בטיפול': 'user_ticket_status_in_progress',
      'ממתינה': 'user_ticket_waiting',
      'טופלה': 'user_ticket_resolved',
      'נסגרה': 'user_ticket_closed',
    };
    const key = keyMap[newStatus];
    if (key) {
      const setting = await getSetting(base44, key);
      if (setting?.enabled) {
        const subject = renderTemplate(setting.subject_template, ticket);
        const body = renderTemplate(setting.body_template, ticket);
        const sent = await sendAndLog(base44, { key, toEmail: ticket.created_by, subject, bodyHtml: buildHtml(body), ticket, recipientType: 'user' });
        if (sent) await base44.asServiceRole.entities.ServiceTicket.update(ticket.id, { user_status_email_sent_at: new Date().toISOString() });
        results.user_status_email = sent;
      } else {
        await logSkipped(base44, { key, ticket, reason: setting ? 'disabled' : 'NotificationSetting missing', recipientType: 'user' });
      }
    }
  }

  // ── feedback_request ──────────────────────────────────────────
  if (action === 'feedback_request') {
    const setting = await getSetting(base44, 'user_service_feedback_request');
    if (!setting?.enabled) {
      await logSkipped(base44, { key: 'user_service_feedback_request', ticket, reason: setting ? 'disabled' : 'NotificationSetting missing', recipientType: 'user' });
      results.feedback_request = false;
    } else if (!ticket.created_by) {
      await logSkipped(base44, { key: 'user_service_feedback_request', ticket, reason: 'no created_by email', recipientType: 'user' });
      results.feedback_request = false;
    } else {
      const ticketWithFeedback = await ensureFeedbackFields(base44, ticket, req);
      if (!ticketWithFeedback.feedback_link) {
        await logSkipped(base44, { key: 'user_service_feedback_request', ticket, reason: 'feedback_link could not be generated', recipientType: 'user' });
        results.feedback_request = false;
      } else {
        const subject = renderTemplate(setting.subject_template, ticketWithFeedback);
        const body = renderTemplate(setting.body_template, ticketWithFeedback);
        const sent = await sendAndLog(base44, { key: 'user_service_feedback_request', toEmail: ticketWithFeedback.created_by, subject, bodyHtml: buildHtml(body), ticket: ticketWithFeedback, recipientType: 'user' });
        if (sent) await base44.asServiceRole.entities.ServiceTicket.update(ticket.id, { feedback_request_sent: true, feedback_request_sent_at: new Date().toISOString() });
        results.feedback_request = sent;
      }
    }
  }

  // ── low_rating_alert ──────────────────────────────────────────
  if (action === 'low_rating_alert') {
    const setting = await getSetting(base44, 'manager_low_service_rating');
    if (!setting?.enabled) {
      await logSkipped(base44, { key: 'manager_low_service_rating', ticket, reason: setting ? 'disabled' : 'NotificationSetting missing or disabled', recipientType: 'managers' });
      results.low_rating_alert = false;
    } else {
      const allUsers = await base44.asServiceRole.entities.User.list();
      const managers = allUsers.filter(u => u.role === 'admin' || u.role === 'manager');
      let sentAny = false;
      const ticketForEmail = { ...ticket, feedback_rating: rating || ticket.feedback_rating, feedback_comment: comment || ticket.feedback_comment };
      for (const mgr of managers) {
        if (!mgr.email) continue;
        const subject = renderTemplate(setting.subject_template, ticketForEmail);
        const body = renderTemplate(setting.body_template, ticketForEmail);
        const sent = await sendAndLog(base44, { key: 'manager_low_service_rating', toEmail: mgr.email, subject, bodyHtml: buildHtml(body), ticket: ticketForEmail, recipientType: 'managers' });
        if (sent) sentAny = true;
      }
      results.low_rating_alert = sentAny;
    }
  }

  // ── google_review_request ─────────────────────────────────────
  if (action === 'google_review_request') {
    const setting = await getSetting(base44, 'user_google_review_request');
    if (setting?.enabled && ticket.created_by) {
      const subject = renderTemplate(setting.subject_template, ticket);
      const body = renderTemplate(setting.body_template, ticket);
      const sent = await sendAndLog(base44, { key: 'user_google_review_request', toEmail: ticket.created_by, subject, bodyHtml: buildHtml(body), ticket, recipientType: 'user' });
      if (sent) await base44.asServiceRole.entities.ServiceTicket.update(ticket.id, { google_review_request_sent: true, google_review_request_sent_at: new Date().toISOString() });
      results.google_review = sent;
    } else {
      await logSkipped(base44, { key: 'user_google_review_request', ticket, reason: setting ? 'disabled or no email' : 'NotificationSetting missing', recipientType: 'user' });
      results.google_review = false;
    }
  }

  // ── check_post_closure ────────────────────────────────────────
  if (action === 'check_post_closure') {
    const closedTickets = await base44.asServiceRole.entities.ServiceTicket.filter({ status: 'נסגרה' });
    const nowMs = now.getTime();
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    let googleSent = 0;
    for (const t of closedTickets) {
      if (!t.closed_at || t.google_review_request_sent || !t.created_by) continue;
      if (t.requires_manager_followup || t.google_review_blocked_reason) continue;
      const closedMs = new Date(t.closed_at).getTime();
      if (nowMs - closedMs < THREE_DAYS) continue;
      const setting = await getSetting(base44, 'user_google_review_request');
      if (!setting?.enabled) continue;
      const subject = renderTemplate(setting.subject_template, t);
      const body = renderTemplate(setting.body_template, t);
      const sent = await sendAndLog(base44, { key: 'user_google_review_request', toEmail: t.created_by, subject, bodyHtml: buildHtml(body), ticket: t, recipientType: 'user' });
      if (sent) {
        await base44.asServiceRole.entities.ServiceTicket.update(t.id, { google_review_request_sent: true, google_review_request_sent_at: new Date().toISOString() });
        googleSent++;
      }
    }
    results.google_reviews_sent = googleSent;
  }

  // ── check_sla ─────────────────────────────────────────────────
  if (action === 'check_sla') {
    const openTickets = await base44.asServiceRole.entities.ServiceTicket.filter({ status__ne: 'נסגרה' });
    let reminders = 0, breaches = 0;
    const allUsers = await base44.asServiceRole.entities.User.list();
    const managers = allUsers.filter(u => u.role === 'admin' || u.role === 'manager');
    const nowMs = now.getTime();

    for (const t of openTickets) {
      const warningAtMs = t.sla_warning_at_ms ? Number(t.sla_warning_at_ms) : (t.sla_warning_at ? new Date(t.sla_warning_at).getTime() : null);
      const deadlineMs = t.sla_deadline_ms ? Number(t.sla_deadline_ms) : (t.sla_deadline ? new Date(t.sla_deadline).getTime() : null);

      if (warningAtMs && !t.sla_reminder_sent && warningAtMs <= nowMs) {
        const setting = await getSetting(base44, 'manager_sla_reminder');
        if (setting?.enabled) {
          let sent = false;
          for (const mgr of managers) {
            if (!mgr.email) continue;
            const subject = renderTemplate(setting.subject_template, t);
            const body = renderTemplate(setting.body_template, t);
            const ok = await sendAndLog(base44, { key: 'manager_sla_reminder', toEmail: mgr.email, subject, bodyHtml: buildHtml(body), ticket: t, recipientType: 'managers' });
            if (ok) sent = true;
          }
          if (sent) { await base44.asServiceRole.entities.ServiceTicket.update(t.id, { sla_reminder_sent: true }); reminders++; }
        }
      }

      if (deadlineMs && !t.sla_breach_alert_sent && deadlineMs < nowMs) {
        const setting = await getSetting(base44, 'manager_sla_breached');
        if (setting?.enabled) {
          let sent = false;
          for (const mgr of managers) {
            if (!mgr.email) continue;
            const subject = renderTemplate(setting.subject_template, t);
            const body = renderTemplate(setting.body_template, t);
            const ok = await sendAndLog(base44, { key: 'manager_sla_breached', toEmail: mgr.email, subject, bodyHtml: buildHtml(body), ticket: t, recipientType: 'managers' });
            if (ok) sent = true;
          }
          if (sent) { await base44.asServiceRole.entities.ServiceTicket.update(t.id, { sla_breach_alert_sent: true, sla_breached: true }); breaches++; }
        }
      }
    }
    results.reminders_sent = reminders;
    results.breaches_sent = breaches;
  }

  return Response.json({ ok: true, action, results });
});