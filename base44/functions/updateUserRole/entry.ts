import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized — admin only' }, { status: 403 });
    }

    const { target_user_id, new_role, internal_role, department, alert_flags } = await req.json();
    if (!target_user_id) {
      return Response.json({ error: 'target_user_id is required' }, { status: 400 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find((u: any) => u.id === target_user_id);
    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: any = {};

    // עדכון הרשאת מערכת (role)
    if (new_role !== undefined) {
      if (!['admin', 'manager', 'user'].includes(new_role)) {
        return Response.json({ error: 'Invalid role' }, { status: 400 });
      }
      if (targetUser.role === 'admin' && new_role !== 'admin') {
        const adminCount = allUsers.filter((u: any) => u.role === 'admin').length;
        if (adminCount <= 1) {
          return Response.json(
            { error: 'לא ניתן להסיר הרשאת Admin מהאדמין היחיד במערכת' },
            { status: 400 }
          );
        }
      }
      updates.role = new_role;
    }

    // עדכון תפקיד פנימי (internal_role) — נפרד מהרשאות מערכת
    const VALID_INTERNAL_ROLES = ['service_manager', 'collections_manager', 'operations_manager', 'maintenance_manager'];
    const INTERNAL_ROLE_LABELS: Record<string, string> = {
      service_manager: 'מנהלת שירות',
      collections_manager: 'מנהל גבייה',
      operations_manager: 'מנהל תפעול',
      maintenance_manager: 'מנהל תחזוקה'
    };
    const INTERNAL_ROLE_DEPARTMENTS: Record<string, string> = {
      service_manager: 'service',
      collections_manager: 'collections',
      operations_manager: 'operations',
      maintenance_manager: 'maintenance'
    };

    if (internal_role !== undefined) {
      if (internal_role === '' || internal_role === null) {
        updates.internal_role = '';
        updates.internal_role_label = '';
        updates.department = '';
      } else if (VALID_INTERNAL_ROLES.includes(internal_role)) {
        updates.internal_role = internal_role;
        updates.internal_role_label = INTERNAL_ROLE_LABELS[internal_role];
        updates.department = INTERNAL_ROLE_DEPARTMENTS[internal_role];
      } else {
        return Response.json({ error: 'Invalid internal_role' }, { status: 400 });
      }
    }

    // עדכון מחלקה ידנית אם סופקה
    if (department !== undefined) {
      updates.department = department;
    }

    // עדכון דגלי קבלת התראות
    if (alert_flags && typeof alert_flags === 'object') {
      if (alert_flags.can_receive_service_alerts !== undefined) {
        updates.can_receive_service_alerts = !!alert_flags.can_receive_service_alerts;
      }
      if (alert_flags.can_receive_collections_alerts !== undefined) {
        updates.can_receive_collections_alerts = !!alert_flags.can_receive_collections_alerts;
      }
      if (alert_flags.can_receive_operations_alerts !== undefined) {
        updates.can_receive_operations_alerts = !!alert_flags.can_receive_operations_alerts;
      }
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(target_user_id, updates);

    return Response.json({ ok: true, user_id: target_user_id, updates });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});