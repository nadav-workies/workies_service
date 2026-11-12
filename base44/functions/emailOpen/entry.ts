import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Public open-tracking pixel. The random tracking code in the email is the only key.
const GIF = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), (c) => c.charCodeAt(0));
const pixel = () => new Response(GIF, { headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' } });

export default async function(req) {
  try {
    const t = new URL(req.url).searchParams.get('t') || '';
    if (!/^[0-9a-f-]{36}$/i.test(t)) return pixel();
    const base44 = createClientFromRequest(req);
    const { items } = await base44.asServiceRole.entities.NotificationLog.filter({ tracking_id: t }, { limit: 1 });
    const log = items[0];
    if (log) {
      const now = new Date().toISOString();
      await base44.asServiceRole.entities.NotificationLog.update(log.id, { opened_at: log.opened_at || now, last_opened_at: now, open_count: (log.open_count || 0) + 1 });
    }
    return pixel();
  } catch (error) {
    console.error('email open tracking failed', error.message);
    return pixel();
  }
}