import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { campaignIsActive } from '../../shared/campaignValidity.ts';
import { notifyNewLead } from '../../shared/leadNotify.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { campaign, name: rawName, phone: rawPhone } = body;
    const entity = { office: 'DailyOfficeLead', podcast: 'PodcastLead', workies_ai: 'WorkiesAILead', hr_meetup: 'HRMeetupLead' }[campaign];
    if (!entity) return Response.json({ error: 'קמפיין לא תקין' }, { status: 400 });
    if (!await campaignIsActive(base44, campaign)) return Response.json({ error: 'ההרשמה הסתיימה' }, { status: 400 });
    const name = String(rawName || '').trim().slice(0, 100);
    const phone = String(rawPhone || '').trim().slice(0, 30);
    if (!name || !/^\+?[\d\s()-]+$/.test(phone) || phone.replace(/\D/g, '').length < 9) return Response.json({ error: 'יש למלא שם וטלפון תקינים' }, { status: 400 });
    if (campaign === 'hr_meetup') {
      const email = String(body.email || '').trim().slice(0, 150);
      const organization = String(body.organization || '').trim().slice(0, 150);
      const job_title = String(body.job_title || '').trim().slice(0, 150);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !organization || !job_title) return Response.json({ error: 'יש למלא את כל השדות.' }, { status: 400 });
      const lead = await base44.asServiceRole.entities.HRMeetupLead.create({ name, phone, email, organization, job_title, status: 'new' });
      await notifyNewLead(base44, 'HR מחוץ לשגרה', { 'שם': name, 'טלפון': phone, 'מייל': email, 'ארגון': organization, 'תפקיד': job_title });
      const res = await base44.asServiceRole.integrations.Core.SendEmail({ to: email, template_name: 'HRMeetupConfirmation', variables: { first_name: name.split(' ')[0] }, category: 'transactional', from_name: 'Workies' }).catch((e) => ({ success: false, message: e.message }));
      if (res?.success === false) console.error('hr confirmation failed', res.message || res.reason);
      else await base44.asServiceRole.entities.HRMeetupLead.update(lead.id, { confirmation_sent: true });
      return Response.json({ success: true });
    }
    if (campaign === 'workies_ai') {
      const email = String(body.email || '').trim().slice(0, 150);
      const business_name = String(body.business_name || '').trim().slice(0, 150);
      const session = String(body.session || '');
      const session_date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.session_date || '')) ? String(body.session_date) : '';
      if ((email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || !business_name || !['01', '02', '03', '04', '05', '06'].includes(session) || body.terms_accepted !== true) return Response.json({ error: 'יש למלא את כל השדות ולאשר את תנאי ההשתתפות.' }, { status: 400 });
      await base44.asServiceRole.entities.WorkiesAILead.create({ name, phone, ...(email ? { email } : {}), business_name, session, ...(session_date ? { session_date } : {}), terms_accepted: true, status: 'new' });
      await notifyNewLead(base44, 'Workies AI', { 'שם': name, 'טלפון': phone, 'מייל': email, 'שם העסק': business_name, 'תאריך מפגש': session_date });
      return Response.json({ success: true });
    }
    await base44.asServiceRole.entities[entity].create({ name, phone, status: 'new' });
    await notifyNewLead(base44, campaign === 'office' ? 'התנסות במשרד יומי' : 'התנסות באולפן הפודקאסט', { 'שם': name, 'טלפון': phone });
    return Response.json({ success: true });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}