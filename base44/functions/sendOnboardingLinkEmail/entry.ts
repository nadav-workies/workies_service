import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { hashToken } from '../../shared/onboardingToken.ts';

// Emails an employee their personal onboarding link. Admin/manager only; the recipient is the track's
// own employee email and the link is rebuilt server-side from a verified active token.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'manager') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const token = String(body.token || '');
    if (!body.onboarding_id || !/^[a-f0-9]{64}$/.test(token)) return Response.json({ error: 'onboarding_id and token are required' }, { status: 400 });

    const track = await base44.asServiceRole.entities.EmployeeOnboarding.get(String(body.onboarding_id)).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!track) return Response.json({ error: 'Not found' }, { status: 404 });
    if (!track.employee_email) return Response.json({ error: 'אין כתובת מייל לעובדת' }, { status: 400 });

    const links = await base44.asServiceRole.entities.OnboardingAccessLink.filter({ onboarding_id: track.id, secure_token_hash: await hashToken(token), status: 'active' });
    if (!(links.items || links).length) return Response.json({ error: 'הקישור אינו פעיל' }, { status: 404 });

    const appUrl = req.headers.get('X-Base44-App-Url') || 'https://service.workies.co.il';
    const accessUrl = `${appUrl.replace(/\/$/, '')}/onboarding/access/${token}`;
    const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: track.employee_email,
      subject: 'מסלול החפיפה שלך ב־Workies',
      category: 'transactional',
      body: `שלום ${esc(track.employee_name)},<br><br>נפתח עבורך מסלול חפיפה אישי לתפקיד ${esc(track.role_title)}.<br><br>דרך הקישור ניתן לצפות בתוכנית היומית, ללמוד, לבצע משימות, להשלים מבדקים ולשלוח שאלות.<br><br><a href="${accessUrl}">לכניסה למסלול</a><br><br>ההתקדמות נשמרת ומסונכרנת ישירות עם מערכת Workies.<br><br>בהצלחה,<br>Workies`,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}