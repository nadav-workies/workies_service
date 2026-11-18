import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const TEMPLATES = ['MailingOffice', 'MailingEvent', 'MailingPodcast'];
const SITE = 'https://service.workies.co.il/';
const clip = (v, n) => String(v ?? '').trim().slice(0, n);

// Sends a test copy of a marketing template to the signed-in admin or manager only.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'manager'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    if (body.action !== 'test') return Response.json({ error: 'Unknown action' }, { status: 400 });
    if (!TEMPLATES.includes(body.template)) return Response.json({ error: 'תבנית לא מוכרת' }, { status: 400 });
    const v = body.variables || {};
    const cta_url = clip(v.cta_url, 300);
    if (!cta_url.startsWith(SITE)) return Response.json({ error: 'קישור הכפתור חייב להיות באתר Workies' }, { status: 400 });

    const res = await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      template_name: body.template,
      from_name: 'Workies',
      variables: {
        first_name: clip(user.full_name, 100).split(' ')[0] || 'שלום',
        headline: clip(v.headline, 120),
        subheadline: clip(v.subheadline, 200),
        body: clip(v.body, 1500),
        cta_label: clip(v.cta_label, 40),
        cta_url,
        event_date: clip(v.event_date, 60),
        event_time: clip(v.event_time, 60),
        event_location: clip(v.event_location, 200),
      },
    });
    if (res?.success === false) return Response.json({ sent: false, reason: res.reason || '', message: res.message || '' });
    return Response.json({ sent: true, to: user.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}