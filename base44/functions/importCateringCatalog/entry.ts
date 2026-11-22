import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

// Imports the catering suppliers catalog from AIO into CateringSupplier / CateringMenu / CateringMenuItem.
// Payload shape (compact AIO export): { key?, suppliers: [{ id, name, legal, cats: [{ id, name, ver, pm, ot, k, cp, ts, dm,
//   items: [{ id, n, c, cl, t, p, u, mn, mx, so }] }] }] }
// Supplier cost prices are never sent or stored here - only the client prices.
// Auth: a signed-in admin / manager / sales_manager, or the CATERING_IMPORT_KEY secret (used by the one-time browser import).
// Fields the team edits here (kashrut label, description, logo, display order, visibility) are kept on re-import.

const AIO_ORIGIN = 'https://workies-aio-docs-production.up.railway.app';
const STAFF_ROLES = ['admin', 'manager'];

const read = (name) => { try { return String(secrets.get(name) || '').trim(); } catch { return ''; } };
const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const CATS = ['STARTER', 'MAIN', 'DESSERT', 'DRINK'];

function cors(req) {
  const origin = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': origin === AIO_ORIGIN ? origin : AIO_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, x-import-key, authorization',
    'Vary': 'Origin',
  };
}

async function authorized(base44, req, body) {
  const key = read('CATERING_IMPORT_KEY');
  const given = req.headers.get('x-import-key') || body?.key || '';
  if (key && given && given === key) return 'import_key';
  const user = await base44.auth.me().catch(() => null);
  if (user && (STAFF_ROLES.includes(user.role) || user.internal_role === 'sales_manager')) return user.email || 'staff';
  return null;
}

export default async function (req) {
  const headers = cors(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  try {
    const base44 = createClientFromRequest(req);
    const text = await req.text();
    let body = null;
    try { body = JSON.parse(text); } catch { return Response.json({ ok: false, error: 'invalid json' }, { status: 400, headers }); }

    const by = await authorized(base44, req, body);
    if (!by) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers });

    const suppliers = Array.isArray(body?.suppliers) ? body.suppliers : null;
    if (!suppliers) return Response.json({ ok: false, error: 'missing suppliers' }, { status: 400, headers });

    const db = base44.asServiceRole.entities;
    const now = new Date().toISOString();
    const stats = { suppliers_created: 0, suppliers_updated: 0, menus_created: 0, menus_updated: 0, menus_hidden: 0, items_created: 0, items_updated: 0, items_hidden: 0 };

    const [allSuppliers, allMenus, allItems] = await Promise.all([
      db.CateringSupplier.list('-created_date', 500),
      db.CateringMenu.list('-created_date', 2000),
      db.CateringMenuItem.list('-created_date', 5000),
    ]);
    const supByAio = new Map(allSuppliers.filter((s) => s.aio_id).map((s) => [s.aio_id, s]));
    const menuByAio = new Map(allMenus.filter((m) => m.aio_id).map((m) => [m.aio_id, m]));
    const itemByAio = new Map(allItems.filter((i) => i.aio_id).map((i) => [i.aio_id, i]));

    for (const [sIdx, s] of suppliers.entries()) {
      if (!s?.id || !s?.name) continue;
      const cats = Array.isArray(s.cats) ? s.cats : [];
      const supData = { name: String(s.name).slice(0, 150), legal_name: String(s.legal || '').slice(0, 200), is_kosher: cats.length ? cats.some((c) => c.k) : true, synced_at: now };
      let sup = supByAio.get(s.id);
      if (sup) { await db.CateringSupplier.update(sup.id, supData); stats.suppliers_updated++; }
      else {
        sup = await db.CateringSupplier.create({ ...supData, aio_id: s.id, source: 'aio', is_active: true, sort_order: sIdx });
        stats.suppliers_created++;
      }

      const seenMenus = new Set();
      for (const [mIdx, c] of cats.entries()) {
        if (!c?.id) continue;
        seenMenus.add(c.id);
        const menuData = {
          supplier_id: sup.id, supplier_aio_id: s.id, name: String(c.name || '').slice(0, 200),
          pricing_model: c.pm === 'itemized' ? 'itemized' : 'per_person',
          offering_type: c.ot === 'PERSONAL_DISHES' ? 'PERSONAL_DISHES' : 'STANDARD',
          is_kosher: c.k !== false, price_per_diner: num(c.cp), time_slots: Array.isArray(c.ts) ? c.ts : [],
          diner_menu: c.dm && typeof c.dm === 'object' ? c.dm : null, version: num(c.ver), synced_at: now,
        };
        let menu = menuByAio.get(c.id);
        if (menu) { await db.CateringMenu.update(menu.id, menuData); stats.menus_updated++; }
        else {
          menu = await db.CateringMenu.create({ ...menuData, aio_id: c.id, source: 'aio', is_active: true, sort_order: mIdx });
          stats.menus_created++;
        }

        const items = Array.isArray(c.items) ? c.items : [];
        const seenItems = new Set();
        const toCreate = [];
        for (const it of items) {
          if (!it?.id || !it?.n) continue;
          seenItems.add(it.id);
          const itemData = {
            menu_id: menu.id, menu_aio_id: c.id, supplier_id: sup.id, name: String(it.n).slice(0, 300),
            category: CATS.includes(it.c) ? it.c : 'OTHER', category_label: it.cl ? String(it.cl).slice(0, 100) : '',
            dietary_tags: Array.isArray(it.t) ? it.t : [], price: num(it.p) ?? 0, unit_type: it.u || 'item',
            min_quantity: num(it.mn), max_quantity: num(it.mx), sort_order: num(it.so) ?? 0, is_active: true,
          };
          const existing = itemByAio.get(it.id);
          if (existing) { await db.CateringMenuItem.update(existing.id, itemData); stats.items_updated++; }
          else toCreate.push({ ...itemData, aio_id: it.id, source: 'aio' });
        }
        if (toCreate.length) { await db.CateringMenuItem.bulkCreate(toCreate); stats.items_created += toCreate.length; }
        for (const old of allItems) {
          if (old.source === 'aio' && old.menu_aio_id === c.id && old.is_active && !seenItems.has(old.aio_id)) {
            await db.CateringMenuItem.update(old.id, { is_active: false }); stats.items_hidden++;
          }
        }
      }
      for (const old of allMenus) {
        if (old.source === 'aio' && old.supplier_aio_id === s.id && old.is_active && !seenMenus.has(old.aio_id)) {
          await db.CateringMenu.update(old.id, { is_active: false }); stats.menus_hidden++;
        }
      }
    }

    console.log('catering import by', by, JSON.stringify(stats));
    return Response.json({ ok: true, imported_at: now, ...stats }, { headers });
  } catch (error) {
    console.error('catering import failed', error?.message);
    return Response.json({ ok: false, error: error?.message || 'unknown error' }, { status: 500, headers });
  }
}
