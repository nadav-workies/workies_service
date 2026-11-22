import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { escapeHtml } from '../../shared/security.ts';
import { sendLoggedEmail } from '../../shared/messageLog.ts';

// Catering order link for event customers.
// Public actions (by link token): load, submit.  Staff actions: approve.
// Prices are always recomputed here from the catalog; the browser's numbers are never trusted.

const SALES_RECIPIENTS = ['sp2577@gmail.com']; // Sally (sales) - same address the lead emails use
const APP_URL = 'https://service.workies.co.il';
const EDITABLE = ['link_created', 'submitted'];
const DELIVERY_NAME = 'משלוח';
const isDelivery = (it) => String(it?.name || '').trim() === DELIVERY_NAME;
const money = (n) => `₪${Number(n || 0).toLocaleString('he-IL', { maximumFractionDigits: 2 })}`;
const clean = (v, max) => String(v ?? '').trim().slice(0, max);

function publicOrder(o) {
  return {
    order_number: o.order_number, status: o.status, company: o.company, contact_name: o.contact_name,
    contact_phone: o.contact_phone, contact_email: o.contact_email, event_name: o.event_name, event_date: o.event_date,
    event_time: o.event_time, time_slot: o.time_slot, guests_count: o.guests_count, location: o.location,
    message_to_customer: o.message_to_customer, lines: o.lines || [], total: o.total || 0,
    customer_notes: o.customer_notes, dietary_notes: o.dietary_notes, submitted_at: o.submitted_at, approved_at: o.approved_at,
  };
}

async function loadCatalog(db) {
  const [suppliers, menus, items] = await Promise.all([
    db.CateringSupplier.filter({ is_active: true }, 'sort_order', 200),
    db.CateringMenu.filter({ is_active: true }, 'sort_order', 1000),
    db.CateringMenuItem.filter({ is_active: true }, 'sort_order', 5000),
  ]);
  const supIds = new Set(suppliers.map((s) => s.id));
  const liveMenus = menus.filter((m) => supIds.has(m.supplier_id));
  const menuIds = new Set(liveMenus.map((m) => m.id));
  const liveItems = items.filter((i) => menuIds.has(i.menu_id));
  return { suppliers, menus: liveMenus, items: liveItems };
}

function catalogForCustomer({ suppliers, menus, items }) {
  const deliveryBySupplier = {};
  for (const it of items) if (isDelivery(it)) {
    const cur = deliveryBySupplier[it.supplier_id];
    if (cur === undefined || Number(it.price) < cur) deliveryBySupplier[it.supplier_id] = Number(it.price) || 0;
  }
  return suppliers.map((s) => ({
    id: s.id, name: s.name, kashrut_label: s.kashrut_label || '', is_kosher: s.is_kosher !== false,
    description: s.description || '', logo_url: s.logo_url || '', delivery_fee: deliveryBySupplier[s.id] ?? null,
    menus: menus.filter((m) => m.supplier_id === s.id).map((m) => ({
      id: m.id, name: m.name, description: m.description || '', pricing_model: m.pricing_model, offering_type: m.offering_type,
      is_kosher: m.is_kosher !== false, price_per_diner: m.price_per_diner ?? null, min_diners: m.min_diners ?? null,
      diner_menu: m.offering_type === 'PERSONAL_DISHES' ? m.diner_menu || null : null,
      items: items.filter((i) => i.menu_id === m.id && !isDelivery(i)).map((i) => ({
        id: i.id, name: i.name, category: i.category, category_label: i.category_label || '', dietary_tags: i.dietary_tags || [],
        price: Number(i.price) || 0, unit_type: i.unit_type || 'item', min_quantity: i.min_quantity ?? null, max_quantity: i.max_quantity ?? null,
      })),
    })),
  })).filter((s) => s.menus.length);
}

// Rebuilds the order lines from the catalog. Returns { lines, total } or throws a customer-facing error.
function priceLines(requested, catalog) {
  const supById = new Map(catalog.suppliers.map((s) => [s.id, s]));
  const menuById = new Map(catalog.menus.map((m) => [m.id, m]));
  const itemById = new Map(catalog.items.map((i) => [i.id, i]));
  const lines = [];
  const usedSuppliers = new Set();
  for (const r of (Array.isArray(requested) ? requested : []).slice(0, 200)) {
    const qty = Math.floor(Number(r?.quantity));
    if (!Number.isFinite(qty) || qty <= 0) continue;
    if (qty > 5000) throw new Error('כמות לא סבירה באחת השורות');
    const menu = menuById.get(r?.menu_id);
    if (!menu) throw new Error('אחד הפריטים כבר לא זמין. רעננו את העמוד ונסו שוב.');
    const sup = supById.get(menu.supplier_id);
    const note = clean(r?.note, 300);
    if (menu.pricing_model === 'per_person') {
      if (menu.min_diners && qty < menu.min_diners) throw new Error(`בתפריט "${menu.name}" יש מינימום ${menu.min_diners} סועדים`);
      const unit = Number(menu.price_per_diner) || 0;
      lines.push({ line_id: crypto.randomUUID(), supplier_id: sup.id, supplier_name: sup.name, menu_id: menu.id, menu_name: menu.name,
        item_id: '', item_name: `${menu.name} · לסועד`, pricing_model: 'per_person', unit_price: unit, quantity: qty, line_total: +(unit * qty).toFixed(2), note });
    } else {
      const item = itemById.get(r?.item_id);
      if (!item || item.menu_id !== menu.id || isDelivery(item)) throw new Error('אחד הפריטים כבר לא זמין. רעננו את העמוד ונסו שוב.');
      if (item.min_quantity && qty < item.min_quantity) throw new Error(`"${item.name}": מינימום ${item.min_quantity}`);
      if (item.max_quantity && qty > item.max_quantity) throw new Error(`"${item.name}": מקסימום ${item.max_quantity}`);
      const unit = Number(item.price) || 0;
      lines.push({ line_id: crypto.randomUUID(), supplier_id: sup.id, supplier_name: sup.name, menu_id: menu.id, menu_name: menu.name,
        item_id: item.id, item_name: item.name, pricing_model: 'itemized', unit_price: unit, quantity: qty, line_total: +(unit * qty).toFixed(2), note });
    }
    usedSuppliers.add(sup.id);
  }
  // One delivery line per supplier that has a delivery item in its catalog
  for (const supId of usedSuppliers) {
    const fees = catalog.items.filter((i) => i.supplier_id === supId && isDelivery(i));
    if (!fees.length) continue;
    const fee = fees.reduce((a, b) => (Number(a.price) <= Number(b.price) ? a : b));
    const menu = menuById.get(fee.menu_id);
    const sup = supById.get(supId);
    const unit = Number(fee.price) || 0;
    lines.push({ line_id: crypto.randomUUID(), supplier_id: supId, supplier_name: sup.name, menu_id: fee.menu_id, menu_name: menu?.name || '',
      item_id: fee.id, item_name: DELIVERY_NAME, pricing_model: 'delivery', unit_price: unit, quantity: 1, line_total: unit, note: '' });
  }
  const total = +lines.reduce((s, l) => s + l.line_total, 0).toFixed(2);
  return { lines, total };
}

function linesTable(lines) {
  const rows = lines.map((l) => `<tr>
    <td style="padding:6px 10px;border-bottom:1px solid #eee">${escapeHtml(l.supplier_name)}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #eee">${escapeHtml(l.item_name)}${l.note ? `<br><span style="color:#6a7181;font-size:12px">${escapeHtml(l.note)}</span>` : ''}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">${l.quantity}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #eee">${money(l.line_total)}</td></tr>`).join('');
  return `<table style="border-collapse:collapse;width:100%;font-size:14px"><tr style="background:#f7f7f7">
    <th style="padding:6px 10px;text-align:right">ספק</th><th style="padding:6px 10px;text-align:right">פריט</th>
    <th style="padding:6px 10px">כמות</th><th style="padding:6px 10px;text-align:right">סה"כ</th></tr>${rows}</table>`;
}

const wrap = (title, inner) => `<div dir="rtl" style="font-family:Heebo,Arial,sans-serif;color:#14181f;max-width:640px">
  <h2 style="color:#f97015;margin:0 0 10px">${escapeHtml(title)}</h2>${inner}</div>`;

async function notifySales(base44, order) {
  const subject = `הזמנת הסעדה חדשה לאישור: ${order.company || order.contact_name || ''} · ${order.order_number}`;
  const body = wrap('הזמנת הסעדה ממתינה לאישור', `
    <p style="margin:0 0 6px"><b>${escapeHtml(order.company || '')}</b> · ${escapeHtml(order.event_name || '')}</p>
    <p style="margin:0 0 12px;color:#6a7181">${escapeHtml(order.event_date || '')} ${escapeHtml(order.event_time || '')} · ${escapeHtml(String(order.guests_count || ''))} משתתפים · איש קשר: ${escapeHtml(order.contact_name || '')} ${escapeHtml(order.contact_phone || '')}</p>
    ${linesTable(order.lines)}
    <p style="font-size:16px;margin:12px 0"><b>סה"כ: ${money(order.total)}</b></p>
    ${order.dietary_notes ? `<p><b>תזונה ואלרגיות:</b> ${escapeHtml(order.dietary_notes)}</p>` : ''}
    ${order.customer_notes ? `<p><b>הערות:</b> ${escapeHtml(order.customer_notes)}</p>` : ''}
    <p style="margin-top:16px"><a href="${APP_URL}/catering" style="color:#f97015">לבדיקה ואישור במערכת</a></p>`);
  await Promise.all(SALES_RECIPIENTS.map((to) => sendLoggedEmail(base44, {
    source: 'catering', key: 'catering_order_submitted', recipientType: 'managers', to, subject, body,
    from_name: 'Workies הסעדה', category: 'transactional',
  }).catch((e) => console.error('catering sales email failed', e.message))));
}

async function notifyCustomer(base44, order, kind) {
  if (!order.contact_email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(order.contact_email)) return;
  const approved = kind === 'approved';
  const subject = approved ? `הזמנת ההסעדה שלכם אושרה · ${order.event_name || order.order_number}` : `קיבלנו את הזמנת ההסעדה · ${order.event_name || order.order_number}`;
  const intro = approved
    ? 'הזמנת ההסעדה לאירוע שלכם אושרה. נשמח לראותכם!'
    : 'תודה! קיבלנו את הזמנת ההסעדה. נציג Workies יעבור עליה ויחזור אליכם לאישור. עד האישור אפשר לעדכן את ההזמנה דרך אותו קישור.';
  const body = wrap(approved ? 'ההזמנה אושרה' : 'ההזמנה התקבלה', `
    <p>שלום ${escapeHtml(order.contact_name || '')},</p><p>${intro}</p>
    <p style="color:#6a7181">${escapeHtml(order.event_name || '')} · ${escapeHtml(order.event_date || '')} ${escapeHtml(order.event_time || '')}</p>
    ${linesTable(order.lines)}<p style="font-size:16px"><b>סה"כ: ${money(order.total)}</b></p>
    <p style="margin-top:16px;color:#6a7181">צוות Workies</p>`);
  await sendLoggedEmail(base44, { source: 'catering', key: approved ? 'catering_order_approved' : 'catering_order_received', recipientType: 'user',
    to: order.contact_email, subject, body, from_name: 'Workies', category: 'transactional' }).catch((e) => console.error('catering customer email failed', e.message));
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === 'approve') {
      const user = await base44.auth.me().catch(() => null);
      const staff = user && (['admin', 'manager'].includes(user.role) || ['sales_manager', 'operations_manager', 'collections_manager'].includes(user.internal_role));
      if (!staff) return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });
      const order = await db.CateringOrder.get(body.order_id).catch(() => null);
      if (!order) return Response.json({ ok: false, error: 'not found' }, { status: 404 });
      if (order.status !== 'submitted') return Response.json({ ok: false, error: 'אפשר לאשר רק הזמנה שהלקוח שלח' }, { status: 409 });
      const now = new Date().toISOString();
      const who = user.full_name || user.email;
      const updated = await db.CateringOrder.update(order.id, {
        status: 'approved', approved_at: now, approved_by: who,
        history: [...(order.history || []), { date: now, action: 'ההזמנה אושרה', user: who, note: body.notify_customer === false ? 'ללא מייל ללקוח' : 'נשלח מייל אישור ללקוח' }],
      });
      if (body.notify_customer !== false) await notifyCustomer(base44, { ...order, ...updated }, 'approved');
      return Response.json({ ok: true });
    }

    const token = clean(body?.token, 100);
    if (!token || token.length < 16) return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
    const [order] = await db.CateringOrder.filter({ token });
    if (!order || order.status === 'cancelled') return Response.json({ ok: false, error: 'not_found' }, { status: 404 });

    if (action === 'load') {
      const editable = EDITABLE.includes(order.status);
      const catalog = editable ? catalogForCustomer(await loadCatalog(db)) : [];
      return Response.json({ ok: true, editable, order: publicOrder(order), suppliers: catalog });
    }

    if (action === 'submit') {
      if (!EDITABLE.includes(order.status)) return Response.json({ ok: false, error: 'ההזמנה כבר אושרה ולא ניתן לשנות אותה. לשינויים פנו לנציג Workies.' }, { status: 409 });
      const contact_name = clean(body.contact_name, 150), contact_phone = clean(body.contact_phone, 30), contact_email = clean(body.contact_email, 150);
      if (!contact_name || !contact_phone) return Response.json({ ok: false, error: 'נא למלא שם וטלפון של איש הקשר' }, { status: 400 });
      let priced;
      try { priced = priceLines(body.lines, await loadCatalog(db)); }
      catch (e) { return Response.json({ ok: false, error: e.message }, { status: 400 }); }
      if (!priced.lines.length) return Response.json({ ok: false, error: 'ההזמנה ריקה. בחרו לפחות פריט אחד.' }, { status: 400 });
      const guests = Math.floor(Number(body.guests_count));
      const now = new Date().toISOString();
      const first = order.status === 'link_created';
      const data = {
        contact_name, contact_phone, contact_email,
        guests_count: Number.isFinite(guests) && guests > 0 ? guests : order.guests_count,
        customer_notes: clean(body.customer_notes, 2000), dietary_notes: clean(body.dietary_notes, 1000),
        lines: priced.lines, total: priced.total, status: 'submitted', submitted_at: now,
        history: [...(order.history || []), { date: now, action: first ? 'הלקוח שלח הזמנה' : 'הלקוח עדכן את ההזמנה', user: contact_name, note: money(priced.total) }],
      };
      const updated = await db.CateringOrder.update(order.id, data);
      const full = { ...order, ...data, ...updated };
      await Promise.all([notifySales(base44, full), notifyCustomer(base44, full, 'received')]);
      return Response.json({ ok: true, order: publicOrder(full) });
    }

    return Response.json({ ok: false, error: 'unknown action' }, { status: 400 });
  } catch (error) {
    console.error('cateringOrder failed', error?.message);
    return Response.json({ ok: false, error: 'אירעה שגיאה. נסו שוב בעוד רגע.' }, { status: 500 });
  }
}
