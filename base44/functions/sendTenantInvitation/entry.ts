import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { tenant_id } = await req.json();
    if (!tenant_id) {
      return Response.json({ error: 'tenant_id is required' }, { status: 400 });
    }

    const tenant = await base44.asServiceRole.entities.RoomTenant.get(tenant_id);
    if (!tenant) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (!tenant.email) {
      return Response.json({ error: 'Tenant has no email' }, { status: 400 });
    }

    // Invite the user to the system via the platform's built-in invitation
    try {
      await base44.users.inviteUser(tenant.email, "user");
    } catch (err) {
      // If already invited/registered, continue — still mark as sent
      if (!/already|exists|registered/i.test(err.message)) {
        throw err;
      }
    }

    // Update the tenant record
    const now = new Date().toISOString();
    await base44.asServiceRole.entities.RoomTenant.update(tenant_id, {
      invite_sent: true,
      invite_sent_at: now,
      invite_sent_by: user.email || user.full_name,
    });

    return Response.json({
      ok: true,
      email: tenant.email,
      invite_sent: true,
      invite_sent_at: now,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});