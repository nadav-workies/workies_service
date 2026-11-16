import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { upsertContacts } from '../../shared/mailContacts.ts';

const LEAD_SOURCES = {
  office: 'DailyOfficeLead',
  podcast: 'PodcastLead',
  workies_ai: 'WorkiesAILead',
  hr_meetup: 'HRMeetupLead',
  tenants: 'RoomTenant',
};

async function readAll(entity) {
  const out = [];
  let cursor = null;
  do {
    const page = await entity.filter({}, { limit: 500, ...(cursor ? { cursor } : {}) });
    out.push(...page.items);
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return out;
}

function toRows(source, records) {
  if (source === 'tenants') {
    return records.filter((r) => r.customer_status !== 'archived')
      .map((r) => ({ email: r.email, name: r.contact_name || r.customer_name, phone: r.phone, company: r.customer_name }));
  }
  return records.filter((r) => r.status !== 'not_relevant')
    .map((r) => ({ email: r.email, name: r.name, phone: r.phone, company: r.organization || r.business_name }));
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'manager'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const db = base44.asServiceRole.entities;

    if (body.action === 'sync') {
      const result = {};
      for (const [source, name] of Object.entries(LEAD_SOURCES)) {
        result[source] = await upsertContacts(db.MailContact, toRows(source, await readAll(db[name])), { source });
      }
      return Response.json({ result });
    }

    if (body.action === 'import') {
      if (user.role !== 'admin') return Response.json({ error: 'רק אדמין יכול לייבא' }, { status: 403 });
      const rows = Array.isArray(body.rows) ? body.rows : [];
      if (!rows.length) return Response.json({ error: 'אין שורות לייבוא' }, { status: 400 });
      if (rows.length > 2000) return Response.json({ error: 'עד 2,000 שורות בכל ייבוא' }, { status: 400 });
      const consent = body.consent === 'subscribed' ? 'subscribed' : 'pending';
      const tags = (Array.isArray(body.tags) ? body.tags : []).map((t) => String(t).trim().slice(0, 40)).filter(Boolean).slice(0, 10);
      let listId;
      if (body.list_id) {
        const list = await db.MailList.get(String(body.list_id)).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
        if (!list || list.type !== 'static') return Response.json({ error: 'רשימה לא נמצאה' }, { status: 404 });
        listId = list.id;
      }
      const result = await upsertContacts(db.MailContact, rows, { source: 'import', consent, tags, listId });
      await db.MailImport.create({
        file_name: String(body.file_name || 'קובץ').slice(0, 200),
        imported_by: user.full_name || user.email,
        consent,
        list_id: listId,
        ...result,
      });
      return Response.json({ result });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}