import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const read = (name) => { try { return String(secrets.get(name) || '').trim(); } catch { return ''; } };

// Checks the AIO connection with the stored key. Never returns the key or any customer data:
// only the HTTP result, how many records came back and their field names.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'manager'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const url = read('AIO_API_URL'), key = read('AIO_API_KEY');
    const missing = [!url && 'AIO_API_URL', !key && 'AIO_API_KEY'].filter(Boolean);
    if (missing.length) return Response.json({ configured: false, missing });
    const checked_at = new Date().toISOString();
    if (!/^https:\/\//i.test(url)) return Response.json({ configured: true, ok: false, reason: 'invalid_url', checked_at });

    const host = new URL(url).host;
    let res;
    try {
      res = await fetch(url, {
        headers: { Authorization: `Bearer ${key}`, 'x-api-key': key, Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      return Response.json({ configured: true, ok: false, reason: 'unreachable', host, checked_at });
    }
    const body = res.ok ? await res.json().catch(() => null) : null;
    const list = Array.isArray(body) ? body : Object.values(body || {}).find(Array.isArray);
    const first = list?.[0];
    return Response.json({
      configured: true, ok: res.ok, status: res.status, host, checked_at,
      json: body !== null,
      records: list ? list.length : null,
      fields: first && typeof first === 'object' ? Object.keys(first).slice(0, 30) : [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}