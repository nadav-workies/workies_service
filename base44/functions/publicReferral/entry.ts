import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

const CAMPAIGN_END = new Date('2026-10-15T23:59:59+03:00');

function clean(val, max) {
  return String(val ?? '').trim().slice(0, max);
}

function normPhone(val) {
  return String(val || '').replace(/\D/g, '').replace(/^972/, '0');
}

function ticketNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `WK-${y}${m}${d}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    if (new Date() > CAMPAIGN_END) {
      return Response.json({ error: 'המבצע הסתיים ולא ניתן לשלוח המלצות חדשות' }, { status: 400 });
    }

    const referrer_name = clean(body.referrer_name, 100);
    const referrer_phone = clean(body.referrer_phone, 30);
    const referrer_email = clean(body.referrer_email, 150).toLowerCase();
    const friend_name = clean(body.friend_name, 100);
    const friend_phone = clean(body.friend_phone, 30);
    const details = clean(body.details, 2000);

    if (!referrer_name || normPhone(referrer_phone).length < 9 || !friend_name || normPhone(friend_phone).length < 9) {
      return Response.json({ error: 'נא למלא שם וטלפון תקינים לממליץ/ה ולחבר/ה' }, { status: 400 });
    }
    if (!body.terms_accepted) {
      return Response.json({ error: 'יש לאשר את תקנון המבצע' }, { status: 400 });
    }

    // Match referrer to an active tenant (by email, then phone)
    const tenants = await base44.asServiceRole.entities.RoomTenant.filter({ customer_status: 'active' }, '-created_date', 2000);
    const rp = normPhone(referrer_phone);
    const tenant = (referrer_email && tenants.find(t => (t.email || '').toLowerCase() === referrer_email))
      || tenants.find(t => normPhone(t.phone) === rp) || null;

    const now = new Date();
    const referrerRoom = tenant?.room_number ? `${tenant.room_label || tenant.room_number} (${tenant.room_number})` : '';

    const ticket = await base44.asServiceRole.entities.ServiceTicket.create({
      ticket_number: ticketNumber(),
      ticket_type: 'חבר מביא חבר',
      request_type: 'חבר מביא חבר',
      customer_name: tenant?.customer_name ? `${referrer_name} — ${tenant.customer_name}` : referrer_name,
      phone: referrer_phone,
      email: referrer_email,
      issue_description: `חבר מביא חבר: ${friend_name} (${friend_phone})`,
      notes: details,
      area: 'אחר',
      priority: 'רגילה',
      location_type: tenant?.room_number ? 'room' : 'none',
      room_number: tenant?.room_number || null,
      room_label: tenant?.room_label || null,
      room_area: tenant?.room_area || null,
      status: 'פתוחה',
      opened_at: now.toISOString(),
      opened_at_ms: now.getTime(),
      sla_breached: false,
      source_system: 'Base44-ServiceTickets',
      aio_ready: true,
      created_by_name: referrer_name,
      update_history: [{ date: now.toISOString(), action: 'קריאה נפתחה — חבר מביא חבר (קישור ציבורי)', user: referrer_name, note: '' }],
    });

    await base44.asServiceRole.entities.Referral.create({
      friend_name, friend_phone, details,
      friend_phone_normalized: normPhone(friend_phone),
      referrer_name, referrer_phone, referrer_email,
      referrer_room: referrerRoom,
      referrer_is_tenant: !!tenant,
      matched_tenant_id: tenant?.id || '',
      source: 'public_link',
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      terms_accepted: true,
      status: 'new',
      status_history: [{ date: now.toISOString(), status: 'new', user: referrer_name, note: 'ההמלצה נשלחה מהקישור הציבורי' }],
    });

    return Response.json({ success: true, ticket_number: ticket.ticket_number });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}