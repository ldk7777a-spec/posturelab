import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!caller) return Response.json({ isAdmin: false, email: null, role: null });

    // Read the authoritative role from the database, independent of any stale session role.
    let record = null;
    try {
      record = await base44.asServiceRole.entities.User.get(caller.id);
    } catch {
      record = null;
    }
    if (!record && caller.email) {
      try {
        const found = await base44.asServiceRole.entities.User.filter({ email: caller.email });
        record = found && found[0] ? found[0] : null;
      } catch {
        record = null;
      }
    }

    const role = record?.role || caller.role || null;
    if (role !== 'admin') {
      return Response.json({ isAdmin: false, email: caller.email || null, role });
    }

    const users = await base44.asServiceRole.entities.User.list();

    return Response.json({
      isAdmin: true,
      email: caller.email || null,
      role,
      users: users || [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}