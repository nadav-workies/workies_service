import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { ticket, type } = await req.json();

  // Get all managers and admins
  const allUsers = await base44.asServiceRole.entities.User.list();
  const managers = allUsers.filter(u => u.role === 'admin' || u.role === 'manager');

  if (!managers.length) {
    return Response.json({ sent: 0, message: 'אין מנהלים להתרעה' });
  }

  const subjects = {
    urgent: `קריאת שירות דחופה נפתחה | ${ticket.ticket_number} | Workies AIO`,
    warning: `תזכורת SLA לפני חריגה | ${ticket.ticket_number} | Workies AIO`,
    breach: `חריגת SLA בקריאת שירות | ${ticket.ticket_number} | Workies AIO`,
  };

  const bodiesHtml = {
    urgent: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color:#f97316;">⚠️ קריאת שירות דחופה נפתחה</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px;font-weight:bold;">מספר קריאה</td><td>${ticket.ticket_number}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">לקוח</td><td>${ticket.customer_name}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">חדר</td><td>${ticket.room_number}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">טלפון</td><td>${ticket.phone}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">סוג קריאה</td><td>${ticket.ticket_type || '—'}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">מהות התקלה</td><td>${ticket.issue_description}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">אזור</td><td>${ticket.area}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">דחיפות</td><td>${ticket.priority}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">יעד SLA</td><td>${ticket.sla_label || '—'}</td></tr>
        </table>
        <p style="margin-top:20px;"><strong>נדרש: כניסה למערכת ושיוך / טיפול בקריאה.</strong></p>
      </div>`,
    warning: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color:#f59e0b;">⏰ קריאה מתקרבת לחריגת SLA</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px;font-weight:bold;">מספר קריאה</td><td>${ticket.ticket_number}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">לקוח</td><td>${ticket.customer_name}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">חדר</td><td>${ticket.room_number}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">סוג קריאה</td><td>${ticket.ticket_type || '—'}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">SLA</td><td>${ticket.sla_label || '—'}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">אחראי טיפול</td><td>${ticket.assigned_to || 'לא שויך'}</td></tr>
        </table>
        <p style="margin-top:20px;"><strong>נדרש: בדיקת סטטוס טיפול ועדכון הקריאה.</strong></p>
      </div>`,
    breach: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color:#ef4444;">🚨 קריאת שירות חרגה מ-SLA</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px;font-weight:bold;">מספר קריאה</td><td>${ticket.ticket_number}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">לקוח</td><td>${ticket.customer_name}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">חדר</td><td>${ticket.room_number}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">סוג קריאה</td><td>${ticket.ticket_type || '—'}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">SLA שהוגדר</td><td>${ticket.sla_label || '—'}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">סטטוס נוכחי</td><td>${ticket.status}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">אחראי טיפול</td><td>${ticket.assigned_to || 'לא שויך'}</td></tr>
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