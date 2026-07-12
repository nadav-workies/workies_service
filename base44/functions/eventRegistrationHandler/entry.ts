import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function normalizeEmail(val) {
  return String(val || '').trim().toLowerCase();
}

function normalizePhone(val) {
  let p = String(val || '').replace(/[^\d]/g, '');
  if (p.startsWith('00972')) p = '972' + p.slice(5);
  else if (p.startsWith('972')) { /* already intl */ }
  else if (p.startsWith('0')) p = '972' + p.slice(1);
  return p;
}

function formatDateForGCal(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function buildGcalLink(event, startDateTime, endDateTime) {
  const location = `${event.location_name}, ${event.location_address}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.event_name)}&dates=${formatDateForGCal(startDateTime)}/${formatDateForGCal(endDateTime)}&details=${encodeURIComponent(event.event_description || '')}&location=${encodeURIComponent(location)}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;

    // ─── Public: get active event + capacity ─────────────────────
    if (action === 'get_active_event') {
      const events = await base44.asServiceRole.entities.WorkiesEvent.filter({ is_active: true, status: 'active' });
      const activeEvent = events[0];
      if (!activeEvent) return Response.json({ event: null });

      const registrations = await base44.asServiceRole.entities.EventRegistration.filter({ event_id: activeEvent.id });
      const activeRegs = registrations.filter(r => r.registration_status !== 'cancelled');
      const totalParticipants = activeRegs.reduce((sum, r) => sum + (Number(r.participants_count) || 0) + (Number(r.children_count) || 0), 0);
      const capacity = Number(activeEvent.capacity) || 80;
      const remaining = Math.max(0, capacity - totalParticipants);
      const waitlist = registrations.filter(r => r.registration_status === 'waitlist').length;

      return Response.json({
        event: {
          id: activeEvent.id,
          event_name: activeEvent.event_name,
          event_description: activeEvent.event_description,
          event_date: activeEvent.event_date,
          arrival_time: activeEvent.arrival_time,
          event_start_time: activeEvent.event_start_time,
          location_name: activeEvent.location_name,
          location_address: activeEvent.location_address,
          capacity,
        },
        total_participants: totalParticipants,
        remaining_capacity: remaining,
        waitlist_count: waitlist,
      });
    }

    // ─── Public: submit registration ─────────────────────────────
    if (action === 'submit_registration') {
      const { event_id, full_name, phone, email, participants_count, children_count, notes } = body;

      if (!event_id || !full_name || !phone || !email || !participants_count) {
        return Response.json({ error: 'חסרים שדות חובה' }, { status: 400 });
      }

      const pCount = Number(participants_count) || 1;
      const cCount = Number(children_count) || 0;
      if (pCount < 1) return Response.json({ error: 'כמות משתתפים חייבת להיות לפחות 1' }, { status: 400 });
      if (cCount < 0) return Response.json({ error: 'כמות ילדים לא יכולה להיות שלילית' }, { status: 400 });

      const events = await base44.asServiceRole.entities.WorkiesEvent.filter({ id: event_id });
      const event = events[0];
      if (!event || !event.is_active || event.status !== 'active') {
        return Response.json({ error: 'האירוע אינו פעיל או אינו קיים' }, { status: 400 });
      }

      // Capacity check
      const registrations = await base44.asServiceRole.entities.EventRegistration.filter({ event_id });
      const activeRegs = registrations.filter(r => r.registration_status !== 'cancelled');
      const currentCount = activeRegs.reduce((sum, r) => sum + (Number(r.participants_count) || 0) + (Number(r.children_count) || 0), 0);
      const totalNew = pCount + cCount;
      const capacity = Number(event.capacity) || 80;
      const isFull = currentCount + totalNew > capacity;
      const registrationStatus = isFull ? 'waitlist' : 'registered';

      // Match tenant by email or phone
      const tenants = await base44.asServiceRole.entities.RoomTenant.filter({ matched_room: true }, '-created_date', 2000);
      const normEmail = normalizeEmail(email);
      const normPhone = normalizePhone(phone);

      let matchedTenant = null;
      let matchedBy = 'none';

      if (normEmail) {
        for (const t of tenants) {
          if (normalizeEmail(t.email) === normEmail) {
            matchedTenant = t;
            matchedBy = 'email';
            break;
          }
        }
      }
      if (!matchedTenant && normPhone) {
        for (const t of tenants) {
          if (normalizePhone(t.phone) === normPhone) {
            matchedTenant = t;
            matchedBy = 'phone';
            break;
          }
        }
      }

      // Create registration
      const registration = await base44.asServiceRole.entities.EventRegistration.create({
        event_id,
        event_name: event.event_name,
        full_name,
        phone,
        email,
        participants_count: pCount,
        children_count: cCount,
        is_active_tenant: !!matchedTenant,
        matched_tenant_id: matchedTenant?.id || null,
        matched_by: matchedBy,
        company_name: matchedTenant?.customer_name || null,
        room_code: matchedTenant?.room_code || null,
        room_number: matchedTenant?.room_number || null,
        registration_status: registrationStatus,
        notes: notes || null,
        registered_at: new Date().toISOString(),
        source_system: 'workies_events',
        aio_ready: true,
      });

      // Build calendar links
      const arrivalTime = event.arrival_time || '10:00';
      const startDateTime = new Date(`${event.event_date}T${arrivalTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);
      const gcalLink = buildGcalLink(event, startDateTime, endDateTime);

      // Send confirmation email
      const emailBody = `<div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
  <h2>הרשמתך התקבלה</h2>
  <p>שלום ${full_name},</p>
  <p>נרשמת בהצלחה לאירוע:</p>
  <ul>
    <li><strong>אירוע:</strong> ${event.event_name}</li>
    <li><strong>תאריך:</strong> ${event.event_date}</li>
    <li><strong>שעת הגעה:</strong> ${event.arrival_time}</li>
    <li><strong>מיקום:</strong> ${event.location_name}, ${event.location_address}</li>
    <li><strong>כמות משתתפים:</strong> ${pCount}</li>
    <li><strong>כמות ילדים:</strong> ${cCount}</li>
  </ul>
  ${isFull ? '<p style="color: #f97316;"><strong>שים לב: האירוע מלא. נרשמת לרשימת המתנה. ניצור איתך קשר אם יתפנה מקום.</strong></p>' : ''}
  <p><a href="${gcalLink}" style="display: inline-block; background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">📅 הוסף ליומן</a></p>
  <p>נתראה ב־Workies!</p>
</div>`;

      let emailSent = false;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: 'הרשמתך לאירוע Workies התקבלה',
          body: emailBody,
        });
        emailSent = true;
        await base44.asServiceRole.entities.EventRegistration.update(registration.id, { confirmation_email_sent: true });
      } catch (e) { /* email failed but registration saved */ }

      return Response.json({
        success: true,
        registration_id: registration.id,
        status: registrationStatus,
        is_full: isFull,
        is_active_tenant: !!matchedTenant,
        email_sent: emailSent,
        gcal_link: gcalLink,
        event: {
          event_name: event.event_name,
          event_date: event.event_date,
          arrival_time: event.arrival_time,
          location_name: event.location_name,
          location_address: event.location_address,
          event_description: event.event_description,
        },
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});