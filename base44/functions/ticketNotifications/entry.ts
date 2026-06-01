import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Template renderer ────────────────────────────────────────────
function renderTemplate(template, ticket) {
  if (!template) return '';
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => ticket[key] ?? '');
}

// ─── Create a notification log entry ─────────────────────────────
async function createLog(base44, payload) {
  return base44.asServiceRole.entities.NotificationLog.create({
    ...payload,
    sent_at: new Date().toISOString(),
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
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      notification_key: key,
      recipient_email: toEmail,
      recipient_type: recipientType,
      subject,
      status: 'sent',
    });
    return true;
  } catch (err) {
    await createLog(base44, {
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
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

// ─── Build HTML from plain body template ─────────────────────────
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

// ─── Main handler ─────────────────────────────────────────────────
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { action, ticket, oldStatus, newStatus } = await req.json();

  if (!ticket || !action) {
    return Response.json({ error: 'missing action or ticket' }, { status: 400 });
  }

  const results = {};

  // ── Send to user ─────────────────────────────────────────────
  if (action === 'ticket_created') {
    const setting = await getSetting(base44, 'user_ticket_created');
    if (setting?.enabled && ticket.created_by) {
      const subject = renderTemplate(setting.subject_template, ticket);
      const body = renderTemplate(setting.body_template, ticket);
      const sent = await sendAndLog(base44, { key: 'user_ticket_created', toEmail: ticket.created_by, subject, bodyHtml: buildHtml(body), ticket, recipientType: 'user' });
      if (sent) {
        await base44.asServiceRole.entities.ServiceTicket.update(ticket.id, { user_created_email_sent: true });
      }
      results.user_created = sent;
    }

    // Also alert managers if urgent
    if (['גבוהה', 'קריטית'].includes(ticket.priority)) {
      const mgSetting = await getSetting(base44, 'manager_urgent_ticket_created');
      if (mgSetting?.enabled) {
        const allUsers = await base44.asServiceRole.entities.User.list();
        const managers = allUsers.filter(u => u.role === 'admin' || u.role === 'manager');
        let managerSent = false;
        for (const mgr of managers) {
          if (!mgr.email) continue;
          const subject = renderTemplate(mgSetting.subject_template, ticket);
          const body = renderTemplate(mgSetting.body_template, ticket);
          const sent = await sendAndLog(base44, { key: 'manager_urgent_ticket_created', toEmail: mgr.email, subject, bodyHtml: buildHtml(body), ticket, recipientType: 'managers' });
          if (sent) managerSent = true;
        }
        if (managerSent) {
          await base44.asServiceRole.entities.ServiceTicket.update(ticket.id, { manager_alert_sent: true });
        }
        results.managers_alerted = managerSent;
      }
    }
  }

  // ── Status change → notify user ──────────────────────────────
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
        if (sent) {
          await base44.asServiceRole.entities.ServiceTicket.update(ticket.id, { user_status_email_sent_at: new Date().toISOString() });
        }
        results.user_status_email = sent;
      }
    }
  }

  // ── SLA reminder/breach check ─────────────────────────────────
  if (action === 'check_sla') {
    const openTickets = await base44.asServiceRole.entities.ServiceTicket.filter({ status__ne: 'נסגרה' });
    const now = new Date();
    let reminders = 0, breaches = 0;

    const allUsers = await base44.asServiceRole.entities.User.list();
    const managers = allUsers.filter(u => u.role === 'admin' || u.role === 'manager');

    for (const t of openTickets) {
      // SLA reminder
      if (t.sla_warning_at && !t.sla_reminder_sent && new Date(t.sla_warning_at) <= now) {
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
          if (sent) {
            await base44.asServiceRole.entities.ServiceTicket.update(t.id, { sla_reminder_sent: true });
            reminders++;
          }
        }
      }

      // SLA breach
      if (t.sla_deadline && !t.sla_breach_alert_sent && new Date(t.sla_deadline) < now) {
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
          if (sent) {
            await base44.asServiceRole.entities.ServiceTicket.update(t.id, { sla_breach_alert_sent: true, sla_breached: true });
            breaches++;
          }
        }
      }
    }
    results.reminders_sent = reminders;
    results.breaches_sent = breaches;
  }

  return Response.json({ ok: true, action, results });
});