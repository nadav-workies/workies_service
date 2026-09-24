import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { roomsByNumber } from '../../shared/rooms.ts';

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

    const roomNumber = clean(body.referrer_room, 10);
    const isDesk = roomNumber === 'desk';
    const room = isDesk ? null : roomsByNumber.get(roomNumber);
    const friend_name = clean(body.friend_name, 100);
    const friend_phone = clean(body.friend_phone, 30);
    const details = clean(body.details, 2000);

    if ((!isDesk && !room) || !friend_name || normPhone(friend_phone).length < 9) {
      return Response.json({ error: 'נא לבחור משרד/עמדה ולמלא שם וטלפון תקינים של החבר/ה' }, { status: 400 });
    }
    if (!body.terms_accepted) {
      return Response.json({ error: 'יש לאשר את תקנון המבצע' }, { status: 400 });
    }

    // Match referrer to the active tenant of the selected office
    const tenants = room
      ? await base44.asServiceRole.entities.RoomTenant.filter({ customer_status: 'active', room_number: roomNumber }, '-created_date', 50)
      : [];
    const tenant = tenants.find(t => t.is_primary_contact !== false) || tenants[0] || null;

    const now = new Date();
    const referrerRoom = isDesk ? 'עמדה (ללא משרד)' : `${room.room_label} (${roomNumber})`;
    const referrer_name = tenant?.customer_name || (isDesk ? 'דייר/ת עמדה' : `דייר/ת משרד ${roomNumber}`);
    const referrer_phone = tenant?.phone || '';
    const referrer_email = tenant?.email || '';

    const ticket = await base44.asServiceRole.entities.ServiceTicket.create({
      ticket_number: ticketNumber(),
      ticket_type: 'חבר מביא חבר',
      request_type: 'חבר מביא חבר',
      customer_name: referrer_name,
      phone: referrer_phone,
      email: referrer_email,
      issue_description: `חבר מביא חבר: ${friend_name} (${friend_phone})`,
      notes: details,
      area: 'אחר',
      priority: 'רגילה',
      location_type: room ? 'room' : 'none',
      room_number: room ? roomNumber : null,
      room_label: room ? room.room_label : null,
      room_area: room ? room.room_area : null,
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