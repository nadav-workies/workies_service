import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized — admin only' }, { status: 403 });
    }

    const { target_user_id, new_role } = await req.json();
    if (!target_user_id || !new_role) {
      return Response.json({ error: 'target_user_id and new_role are required' }, { status: 400 });
    }

    if (!['admin', 'manager', 'user'].includes(new_role)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find((u: any) => u.id === target_user_id);
    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // מניעת הסרת Admin מהאדמין היחיד במערכת
    if (targetUser.role === 'admin' && new_role !== 'admin') {
      const adminCount = allUsers.filter((u: any) => u.role === 'admin').length;
      if (adminCount <= 1) {
        return Response.json(
          { error: 'לא ניתן להסיר הרשאת Admin מהאדמין היחיד במערכת' },
          { status: 400 }
        );
      }
    }

    await base44.asServiceRole.entities.User.update(target_user_id, { role: new_role });

    return Response.json({ ok: true, user_id: target_user_id, new_role });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});