import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const REMINDERS = {
  '2026-11-21': { key: 'three_days', when: 'בעוד 3 ימים, ביום שלישי 24.11.2026' },
  '2026-11-23': { key: 'one_day', when: 'מחר, יום שלישי 24.11.2026' },
  '2026-11-24': { key: 'same_day', when: 'היום, יום שלישי 24.11.2026' },
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const today = body.date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
    const reminder = REMINDERS[today];
    if (!reminder) return Response.json({ skipped: true, today });

    const leads = await base44.asServiceRole.entities.HRMeetupLead.filter({ status: { $ne: 'not_relevant' } }, '-created_date', 1000);
    const pending = leads.filter((l) => l.email && !(l.reminders_sent || []).includes(reminder.key));
    let sent = 0, failed = 0;
    for (let i = 0; i < pending.length; i += 6) {
      const results = await Promise.allSettled(pending.slice(i, i + 6).map(async (lead) => {
        const res = await base44.asServiceRole.integrations.Core.SendEmail({
          to: lead.email, template_name: 'HRMeetupReminder', category: 'transactional', from_name: 'Workies',
          variables: { first_name: String(lead.name || '').split(' ')[0], when_text: reminder.when },
        });
        if (res?.success === false) throw new Error(res.reason || res.message);
        await base44.asServiceRole.entities.HRMeetupLead.update(lead.id, { reminders_sent: [...(lead.reminders_sent || []), reminder.key] });
      }));
      results.forEach((r) => { if (r.status === 'fulfilled') sent++; else { failed++; console.error('reminder failed', r.reason?.message); } });
    }
    return Response.json({ reminder: reminder.key, sent, failed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}