import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { EMAIL_CAMPAIGNS, campaignSettings, eventVariables, hebrewDate } from '../../shared/campaignEmails.ts';
import { sendLoggedEmail } from '../../shared/messageLog.ts';
import { validLeadEmail } from '../../shared/leadEmail.ts';

const SITE = 'https://service.workies.co.il';
const LEAD_ROLES = ['sales_manager', 'operations_manager', 'collections_manager'];
const CHOICES = ['attending', 'not_attending'];
const canManage = (u) => ['admin', 'manager'].includes(u?.role) || LEAD_ROLES.includes(u?.internal_role);
const validToken = (t) => typeof t === 'string' && /^[0-9a-f-]{36}$/i.test(t);
const rsvpUrl = (campaign, token) => `${SITE}/rsvp?c=${campaign}&t=${token}`;

async function ensureToken(entity, lead) {
  if (lead.rsvp_token) return lead.rsvp_token;
  const token = crypto.randomUUID();
  await entity.update(lead.id, { rsvp_token: token });
  return token;
}

// RSVP for event landing pages.
// Public (by the lead's own random code): get, respond. Lead managers: link, send.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const def = EMAIL_CAMPAIGNS[body.campaign];
    if (!def) return Response.json({ error: 'Unknown campaign' }, { status: 400 });
    const entity = base44.asServiceRole.entities[def.entity];

    if (body.action === 'get' || body.action === 'respond') {
      if (!validToken(body.token)) return Response.json({ error: 'Invalid link' }, { status: 404 });
      const { items } = await entity.filter({ rsvp_token: body.token }, { limit: 1 });
      const lead = items[0];
      if (!lead || lead.rsvp_token !== body.token) return Response.json({ error: 'Invalid link' }, { status: 404 });
      if (body.action === 'respond') {
        if (!CHOICES.includes(body.choice)) return Response.json({ error: 'Invalid choice' }, { status: 400 });
        await entity.update(lead.id, { rsvp_status: body.choice, rsvp_at: new Date().toISOString(), rsvp_source: 'link', rsvp_by: lead.name || '' });
        return Response.json({ rsvp_status: body.choice });
      }
      const s = await campaignSettings(base44, body.campaign);
      return Response.json({
        first_name: String(lead.name || '').trim().split(' ')[0],
        event_name: s.event_name, event_date: hebrewDate(s.event_date), event_time: s.event_time,
        event_location: s.event_location, rsvp_status: lead.rsvp_status || '',
      });
    }

    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canManage(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (!['link', 'send'].includes(body.action)) return Response.json({ error: 'Unknown action' }, { status: 400 });
    if (!body.lead_id) return Response.json({ error: 'lead_id is required' }, { status: 400 });
    const lead = await entity.get(body.lead_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!lead) return Response.json({ error: 'Not found' }, { status: 404 });

    const token = await ensureToken(entity, lead);
    const url = rsvpUrl(body.campaign, token);
    if (body.action === 'link') return Response.json({ url });

    if (!validLeadEmail(lead.email)) return Response.json({ error: 'לנרשם/ת אין כתובת מייל תקינה' }, { status: 400 });
    const s = await campaignSettings(base44, body.campaign);
    let res;
    try {
      res = await sendLoggedEmail(base44, {
        source: body.campaign === 'hr_meetup' ? 'hr_meetup' : 'leads',
        key: `rsvp_request_${body.campaign}`,
        to: lead.email, template_name: 'EventRsvpRequest', category: 'transactional', from_name: 'Workies',
        variables: { ...eventVariables(s, lead.name), rsvp_url: url },
      });
    } catch (e) {
      res = { success: false, reason: e.message };
    }
    const sent = res?.success !== false;
    await entity.update(lead.id, { rsvp_requested_at: new Date().toISOString(), rsvp_request_status: sent ? 'sent' : 'failed' });
    return Response.json({ sent, reason: sent ? '' : (res.reason || res.message || '') });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}