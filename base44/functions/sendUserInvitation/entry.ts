import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function buildHtml(userName: string, registerUrl: string) {
  return `<div dir="rtl" style="font-family:'Heebo',Arial,sans-serif;max-width:560px;margin:auto;color:#1a1a2e;">
    <div style="background:#0f172a;padding:16px 24px;border-radius:8px 8px 0 0;">
      <span style="color:#f97316;font-weight:bold;font-size:18px;">Workies</span>
      <span style="color:#94a3b8;font-size:12px;margin-right:8px;">קריאות שירות</span>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
      <h2 style="margin:0 0 16px;">שלום ${userName}!</h2>
      <p style="line-height:1.8;">הוזמנת להצטרף למערכת קריאות השירות של Workies.</p>
      <p style="line-height:1.8;">במערכת תוכל/י לפתוח קריאות שירות, לעקוב אחר סטטוס הטיפול ולקבל עדכונים בזמן אמת.</p>
      <p style="line-height:1.8;">להשלמת ההרשמה, לחצ/י על הכפתור:</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${registerUrl}" style="background:#f97316;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">הרשמה למערכת</a>
      </div>
      <p style="line-height:1.8;font-size:13px;color:#64748b;">או העתק/י את הקישור:<br/>${registerUrl}</p>
    </div>
    <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:8px;">Workies AIO | מערכת קריאות שירות</p>
  </div>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { imported_user_id } = await req.json();
    if (!imported_user_id) {
      return Response.json({ error: 'imported_user_id is required' }, { status: 400 });
    }

    const importedUser = await base44.asServiceRole.entities.ImportedUser.get(imported_user_id);
    if (!importedUser) {
      return Response.json({ error: 'Imported user not found' }, { status: 404 });
    }
    if (importedUser.registered) {
      return Response.json({ error: 'משתמש זה כבר נרשם למערכת' }, { status: 400 });
    }

    // Build register URL from request origin
    const origin = new URL(req.url).origin;
    const registerUrl = `${origin}/register`;

    const userName = importedUser.full_name || importedUser.email;
    const subject = 'הזמנה להצטרף למערכת קריאות השירות של Workies';

    let status = 'failed';
    let errorMsg: string | null = null;
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: importedUser.email,
        subject,
        body: buildHtml(userName, registerUrl),
        is_html: true,
      });
      status = 'sent';
    } catch (err) {
      errorMsg = err.message;
    }

    // Update imported user invitation tracking
    await base44.asServiceRole.entities.ImportedUser.update(imported_user_id, {
      invited_at: new Date().toISOString(),
      invite_count: (importedUser.invite_count || 0) + 1,
    });

    // Log notification
    await base44.asServiceRole.entities.NotificationLog.create({
      ticket_id: '',
      ticket_number: '',
      notification_key: 'user_invitation',
      recipient_email: importedUser.email,
      recipient_type: 'user',
      subject,
      status,
      sent_at: new Date().toISOString(),
      ...(errorMsg && { error_message: errorMsg }),
    });

    if (status === 'failed') {
      return Response.json({ ok: false, error: errorMsg || 'Failed to send email' }, { status: 500 });
    }

    return Response.json({ ok: true, status, email: importedUser.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});