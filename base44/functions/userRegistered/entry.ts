import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Called from entity automation: payload has event + data
    const user = payload.data || payload.user;
    if (!user?.email) {
      return Response.json({ ok: false, reason: 'no user email' });
    }

    // Get notification setting
    const settings = await base44.asServiceRole.entities.NotificationSetting.filter({ key: 'user_registered' });
    const setting = settings[0];
    if (!setting?.enabled) {
      return Response.json({ ok: false, reason: 'notification disabled' });
    }

    const userName = user.full_name || user.email;
    const subject = setting.subject_template || 'ברוך הבא למערכת קריאות השירות של Workies';
    const body = (setting.body_template || '').replace('{{full_name}}', userName).replace('{{user_name}}', userName);

    let status = 'failed';
    let errorMsg = null;
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject,
        body: buildHtml(body),
        is_html: true,
      });
      status = 'sent';
    } catch (err) {
      errorMsg = err.message;
    }

    await base44.asServiceRole.entities.NotificationLog.create({
      ticket_id: '',
      ticket_number: '',
      notification_key: 'user_registered',
      recipient_email: user.email,
      recipient_type: 'user',
      subject,
      status,
      sent_at: new Date().toISOString(),
      ...(errorMsg && { error_message: errorMsg }),
    });

    return Response.json({ ok: true, status, email: user.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});