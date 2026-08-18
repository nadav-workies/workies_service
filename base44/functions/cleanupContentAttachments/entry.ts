import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Removes attachments from content items whose content date passed more than 30 days ago.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    let cleaned = 0;
    let skip = 0;
    const pageSize = 200;

    while (true) {
      const page = await base44.asServiceRole.entities.WeeklyContentIdea.list('-created_date', pageSize, skip);
      if (!page || page.length === 0) break;

      for (const item of page) {
        if (!Array.isArray(item.attachments) || item.attachments.length === 0) continue;
        const dateStr = item.planned_date || item.week_start_date || (item.updated_date || '').slice(0, 10);
        if (!dateStr) continue;
        const contentDate = new Date(dateStr + 'T00:00:00Z');
        if (isNaN(contentDate.getTime())) continue;
        if (contentDate < cutoff) {
          await base44.asServiceRole.entities.WeeklyContentIdea.update(item.id, { attachments: [] });
          cleaned++;
        }
      }

      if (page.length < pageSize) break;
      skip += pageSize;
    }

    return Response.json({ ok: true, cleaned });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}