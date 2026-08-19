import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { escapeHtml } from '../../shared/security.ts';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { ticket, type } = await req.json();
  if (!ticket || typeof ticket !== 'object') {
    return Response.json({ error: 'missing ticket' }, { status: 400 });
  }

  // HTML-escape all ticket fields before interpolating into the email body
  const t = {};
  for (const [key, value] of Object.entries(ticket)) {
    t[key] = typeof value === 'string' ? escapeHtml(value) : value;
  }

  // Get all managers and admins
  const allUsers = await base44.asServiceRole.entities.User.list();
  const managers = allUsers.filter(u => u.role === 'admin' || u.role === 'manager');

  if (!managers.length) {
    return Response.json({ sent: 0, message: 'אין מנהלים להתרעה' });
  }

  const subjects = {
    urgent: `קריאת שירות דחופה נפתחה | ${t.ticket_number} | Workies AIO`,
    warning: `תזכורת SLA לפני חריגה | ${t.ticket_number} | Workies AIO`,
    breach: `חריגת SLA בקריאת שירות | ${t.ticket_number} | Workies AIO`,
  };

  const bodiesHtml = {
    urgent: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color:#f97316;">⚠️ קריאת שירות דחופה נפתחה</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px;font-weight:bold;">מספר קריאה</td><td>${t.ticket_number}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">לקוח</td><td>${t.customer_name}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">חדר</td><td>${t.room_number}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">טלפון</td><td>${t.phone}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">סוג קריאה</td><td>${t.ticket_type || '—'}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">מהות התקלה</td><td>${t.issue_description}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">אזור</td><td>${t.area}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">דחיפות</td><td>${t.priority}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">יעד SLA</td><td>${t.sla_label || '—'}</td></tr>
        </table>
        <p style="margin-top:20px;"><strong>נדרש: כניסה למערכת ושיוך / טיפול בקריאה.</strong></p>
      </div>`,
    warning: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color:#f59e0b;">⏰ קריאה מתקרבת לחריגת SLA</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px;font-weight:bold;">מספר קריאה</td><td>${t.ticket_number}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">לקוח</td><td>${t.customer_name}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">חדר</td><td>${t.room_number}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">סוג קריאה</td><td>${t.ticket_type || '—'}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">SLA</td><td>${t.sla_label || '—'}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">אחראי טיפול</td><td>${t.assigned_to || 'לא שויך'}</td></tr>
        </table>
        <p style="margin-top:20px;"><strong>נדרש: בדיקת סטטוס טיפול ועדכון הקריאה.</strong></p>
      </div>`,
    breach: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color:#ef4444;">🚨 קריאת שירות חרגה מ-SLA</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px;font-weight:bold;">מספר קריאה</td><td>${t.ticket_number}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">לקוח</td><td>${t.customer_name}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">חדר</td><td>${t.room_number}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">סוג קריאה</td><td>${t.ticket_type || '—'}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">SLA שהוגדר</td><td>${t.sla_label || '—'}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">סטטוס נוכחי</td><td>${t.status}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">אחראי טיפול</td><td>${t.assigned_to || 'לא שויך'}</td></tr>
        </table>
        <p style="margin-top:20px;"><strong>נדרש: טיפול מיידי, תיעוד סיבת חריגה ועדכון לקוח.</strong></p>
      </div>`,
  };

  const subject = subjects[type] || subjects.urgent;
  const bodyHtml = bodiesHtml[type] || bodiesHtml.urgent;

  let sent = 0;
  for (const manager of managers) {
    if (!manager.email) continue;
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: manager.email,
      subject,
      body: bodyHtml,
      is_html: true,
    });
    sent++;
  }

  return Response.json({ sent, managers: managers.map(m => m.email) });
});