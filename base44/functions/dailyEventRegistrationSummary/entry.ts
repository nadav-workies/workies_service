import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Find active event
    const events = await base44.asServiceRole.entities.WorkiesEvent.filter({ is_active: true, status: 'active' });
    const activeEvent = events[0];
    if (!activeEvent) {
      return Response.json({ message: 'אין אירוע פעיל כרגע' });
    }

    // Get all registrations for the active event
    const allRegistrations = await base44.asServiceRole.entities.EventRegistration.filter({ event_id: activeEvent.id });
    const activeRegs = allRegistrations.filter(r => r.registration_status !== 'cancelled');

    // Today's registrations
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayRegs = activeRegs.filter(r => {
      const regDate = new Date(r.registered_at || r.created_date);
      return regDate >= todayStart;
    });

    const totalParticipants = activeRegs.reduce((sum, r) => sum + (Number(r.participants_count) || 0) + (Number(r.children_count) || 0), 0);
    const activeTenantsCount = activeRegs.filter(r => r.is_active_tenant).length;
    const newPeopleCount = activeRegs.filter(r => !r.is_active_tenant).length;
    const childrenCount = activeRegs.reduce((sum, r) => sum + (Number(r.children_count) || 0), 0);
    const capacity = Number(activeEvent.capacity) || 80;
    const remaining = Math.max(0, capacity - totalParticipants);
    const waitlistCount = allRegistrations.filter(r => r.registration_status === 'waitlist').length;
    const attendedCount = allRegistrations.filter(r => r.registration_status === 'attended').length;
    const noShowCount = allRegistrations.filter(r => r.registration_status === 'no_show').length;

    // Get admin/manager users for email
    const users = await base44.asServiceRole.entities.User.list();
    const managers = users.filter(u => u.role === 'admin' || u.role === 'manager');

    const emailBody = `<div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
  <h2>סיכום הרשמות יומי</h2>
  <p><strong>אירוע:</strong> ${activeEvent.event_name}</p>
  <p><strong>תאריך האירוע:</strong> ${activeEvent.event_date}</p>
  <ul>
    <li><strong>נרשמים חדשים היום:</strong> ${todayRegs.length}</li>
    <li><strong>סה״כ משתתפים רשומים:</strong> ${totalParticipants}</li>
    <li><strong>דיירים פעילים:</strong> ${activeTenantsCount}</li>
    <li><strong>חדשים / לא מזוהים:</strong> ${newPeopleCount}</li>
    <li><strong>ילדים:</strong> ${childrenCount}</li>
    <li><strong>מקומות שנותרו:</strong> ${remaining}</li>
    <li><strong>רשימת המתנה:</strong> ${waitlistCount}</li>
    <li><strong>הגיעו בפועל:</strong> ${attendedCount}</li>
    <li><strong>לא הגיעו:</strong> ${noShowCount}</li>
  </ul>
</div>`;

    let sentCount = 0;
    for (const m of managers) {
      if (!m.email) continue;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: m.email,
          subject: 'סיכום הרשמות יומי לאירוע Workies',
          body: emailBody,
        });
        sentCount++;
      } catch (e) { /* skip failed */ }
    }

    return Response.json({
      success: true,
      event_name: activeEvent.event_name,
      sent_to: sentCount,
      stats: {
        today_count: todayRegs.length,
        total_participants: totalParticipants,
        active_tenants: activeTenantsCount,
        new_people: newPeopleCount,
        children: childrenCount,
        remaining: remaining,
        waitlist: waitlistCount,
        attended: attendedCount,
        no_show: noShowCount,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});