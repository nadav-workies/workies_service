// Upsert contacts into the mailing database: one record per email address.
// Never upgrades a contact who unsubscribed, bounced or complained.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const norm = (e) => String(e || "").trim().toLowerCase();
const clip = (v, n) => (v == null ? "" : String(v).trim().slice(0, n));
const uniq = (a) => [...new Set(a.filter(Boolean))];

export async function upsertContacts(db, rows, { source, consent = "pending", tags = [], listId } = {}) {
  const byEmail = new Map();
  let rejected = 0;
  for (const r of rows) {
    const email = norm(r?.email);
    if (!EMAIL.test(email) || email.length > 150) { rejected++; continue; }
    const prev = byEmail.get(email) || {};
    byEmail.set(email, {
      email,
      name: prev.name || clip(r.name, 100),
      phone: prev.phone || clip(r.phone, 30),
      company: prev.company || clip(r.company, 150),
    });
  }
  const all = [...byEmail.values()];
  let added = 0, updated = 0;
  for (let i = 0; i < all.length; i += 100) {
    const chunk = all.slice(i, i + 100);
    const page = await db.filter({ email: { $in: chunk.map((c) => c.email) } }, { limit: 200 });
    const existing = new Map(page.items.map((e) => [e.email, e]));
    const creates = [], updates = [];
    for (const c of chunk) {
      const ex = existing.get(c.email);
      if (!ex) {
        creates.push({ ...c, consent, sources: [source], tags, list_ids: listId ? [listId] : [], score: 0, opens: 0, clicks: 0 });
        continue;
      }
      const patch = {
        id: ex.id,
        sources: uniq([...(ex.sources || []), source]),
        tags: uniq([...(ex.tags || []), ...tags]),
        list_ids: uniq([...(ex.list_ids || []), listId]),
      };
      for (const f of ["name", "phone", "company"]) if (!ex[f] && c[f]) patch[f] = c[f];
      if (consent === "subscribed" && ex.consent === "pending") patch.consent = "subscribed";
      updates.push(patch);
    }
    if (creates.length) await db.bulkCreate(creates);
    if (updates.length) await db.bulkUpdate(updates);
    added += creates.length;
    updated += updates.length;
  }
  return { added, updated, rejected };
}