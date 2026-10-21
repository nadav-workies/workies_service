import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { campaignIsActive } from '../../shared/campaignValidity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { campaign, name: rawName, phone: rawPhone } = await req.json();
    const entity = { office: 'DailyOfficeLead', podcast: 'PodcastLead' }[campaign];
    if (!entity) return Response.json({ error: 'קמפיין לא תקין' }, { status: 400 });
    if (!await campaignIsActive(base44, campaign)) return Response.json({ error: 'ההרשמה הסתיימה' }, { status: 400 });
    const name = String(rawName || '').trim().slice(0, 100);
    const phone = String(rawPhone || '').trim().slice(0, 30);
    if (!name || !/^\+?[\d\s()-]+$/.test(phone) || phone.replace(/\D/g, '').length < 9) return Response.json({ error: 'יש למלא שם וטלפון תקינים' }, { status: 400 });
    await base44.asServiceRole.entities[entity].create({ name, phone, status: 'new' });
    return Response.json({ success: true });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}