import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { sendLoggedEmail } from '../../shared/messageLog.ts';
import { EMAIL_CAMPAIGNS, campaignSettings, eventVariables } from '../../shared/campaignEmails.ts';

const KINDS = { 3: { kind: 'three_days', template: 'EventReminderThreeDays' }, 1: { kind: 'one_day', template: 'EventReminderTomorrow' } };

async function pageAll(entity, query) {
  const out = [];
  let cursor = null;
  do {
    const page = await entity.filter(query, { sort: '-created_date', limit: 200, ...(cursor ? { cursor } : {}) });
    out.push(...page.items);
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return out;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const today = body.date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
    const db = base44.asServiceRole.entities;
    const report = [];

    for (const campaign of Object.keys(EMAIL_CAMPAIGNS)) {
      const s = await campaignSettings(base44, campaign);
      if (s.page_type !== 'event' || !s.reminders || !s.event_date) continue;
      const days = Math.round((Date.parse(s.event_date) - Date.parse(today)) / 86400000);
      const reminder = KINDS[days];
      if (!reminder) continue;
      const key = `event_reminder_${reminder.kind}_${campaign}`;
      const done = new Set((await pageAll(db.NotificationLog, { notification_key: key, status: 'sent' })).map((l) => String(l.recipient_email).toLowerCase()));
      const seen = new Set();
      const pending = (await pageAll(db[s.entity], { status: { $ne: 'not_relevant' } })).filter((l) => {
        const email = String(l.email || '').trim().toLowerCase();
        if (!email || done.has(email) || seen.has(email)) return false;
        seen.add(email);
        return true;
      });
      let sent = 0, failed = 0;
      for (let i = 0; i < pending.length; i += 6) {
        const results = await Promise.allSettled(pending.slice(i, i + 6).map(async (lead) => {
          const res = await sendLoggedEmail(base44, { source: campaign === 'hr_meetup' ? 'hr_meetup' : 'events', key,
            to: lead.email.trim(), template_name: reminder.template, category: 'transactional', from_name: 'Workies',
            variables: eventVariables(s, lead.name) });
          if (res?.success === false) throw new Error(res.reason || res.message);
        }));
        results.forEach((r) => { if (r.status === 'fulfilled') sent++; else { failed++; console.error('reminder failed', campaign, r.reason?.message); } });
      }
      report.push({ campaign, reminder: reminder.kind, sent, failed });
    }
    return Response.json({ today, report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}