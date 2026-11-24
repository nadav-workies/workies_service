import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const KEY = 'time';
const QN = 6;
const LEAD_ROLES = ['sales_manager', 'operations_manager', 'collections_manager'];
const canManage = (u) => ['admin', 'manager'].includes(u?.role) || LEAD_ROLES.includes(u?.internal_role);
const validId = (t) => typeof t === 'string' && /^[0-9a-f-]{36}$/i.test(t);
const OFF = 'המשחק אינו פעיל כעת';

async function getGame(sr) {
  const { items } = await sr.entities.EventorGame.filter({ key: KEY }, { limit: 1 });
  if (items[0]) return items[0];
  return await sr.entities.EventorGame.create({ key: KEY, enabled: false, phase: 'waiting', question_index: 0, round: 1 });
}

const ICONS = ['trophy', 'star', 'heart', 'rocket', 'flame', 'crown', 'sun', 'zap', 'coffee', 'smile', 'gem', 'flower'];

async function allRows(entity, round) {
  const votes = [];
  let cursor;
  do {
    const page = await entity.filter({ round }, { limit: 500, cursor, sort: 'created_date' });
    votes.push(...page.items);
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return votes;
}

// "Where did the time go?" lecture game.
// Public: join (name), vote. Managers: host_state, control.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));

    if (body.action === 'join' || body.action === 'vote') {
      if (!validId(body.voter_id)) return Response.json({ error: 'קישור לא תקין, נסו לרענן' }, { status: 400 });
      const game = await getGame(sr);
      if (!game.enabled) return Response.json({ error: OFF }, { status: 409 });

      if (body.action === 'join') {
        const name = String(body.name || '').trim();
        if (name.length < 2 || name.length > 30) return Response.json({ error: 'יש להזין שם בין 2 ל-30 תווים' }, { status: 400 });
        const { items } = await sr.entities.EventorGamePlayer.filter({ round: game.round, voter_id: body.voter_id }, { limit: 1 });
        const icon = ICONS.includes(body.icon) ? body.icon : 'star';
        if (!items[0]) await sr.entities.EventorGamePlayer.create({ round: game.round, voter_id: body.voter_id, name, icon });
        return Response.json({ ok: true, round: game.round });
      }

      const option = Number(body.option);
      if (![0, 1, 2, 3].includes(option)) return Response.json({ error: 'תשובה לא תקינה' }, { status: 400 });
      if (game.phase !== 'open' || Number(body.question_index) !== game.question_index) {
        return Response.json({ error: 'ההצבעה על השאלה הזו נסגרה' }, { status: 409 });
      }
      const [players, existing] = await Promise.all([
        sr.entities.EventorGamePlayer.filter({ round: game.round, voter_id: body.voter_id }, { limit: 1 }),
        sr.entities.EventorGameVote.filter({ round: game.round, question_index: game.question_index, voter_id: body.voter_id }, { limit: 1 }),
      ]);
      if (!players.items[0]) return Response.json({ error: 'יש להיכנס למשחק מחדש' }, { status: 409 });
      if (existing.items[0]) return Response.json({ ok: true, option: existing.items[0].option });
      await sr.entities.EventorGameVote.create({ round: game.round, question_index: game.question_index, option, voter_id: body.voter_id });
      return Response.json({ ok: true, option });
    }

    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canManage(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    let game = await getGame(sr);

    if (body.action === 'control') {
      const op = body.op;
      let patch = null;
      if (op === 'enable') patch = { enabled: true };
      else if (op === 'disable') patch = { enabled: false };
      else if (op === 'open' && game.phase === 'waiting') patch = { phase: 'open', question_index: 0 };
      else if (op === 'reveal' && game.phase === 'open') patch = { phase: 'revealed' };
      else if (op === 'next' && game.phase === 'revealed') {
        patch = game.question_index >= QN - 1 ? { phase: 'ended' } : { phase: 'open', question_index: game.question_index + 1 };
      } else if (op === 'reset') {
        await Promise.all([
          sr.entities.EventorGameVote.deleteMany({ round: game.round }),
          sr.entities.EventorGamePlayer.deleteMany({ round: game.round }),
        ]);
        patch = { phase: 'waiting', question_index: 0, round: (game.round || 1) + 1 };
      }
      if (!patch) return Response.json({ error: 'הפעולה אינה זמינה בשלב הזה' }, { status: 400 });
      game = await sr.entities.EventorGame.update(game.id, patch);
      return Response.json({ game });
    }

    if (body.action !== 'host_state') return Response.json({ error: 'Unknown action' }, { status: 400 });
    const [votes, playerRows] = await Promise.all([
      allRows(sr.entities.EventorGameVote, game.round),
      allRows(sr.entities.EventorGamePlayer, game.round),
    ]);
    const roster = playerRows.map((p) => ({ id: p.id, name: p.name, icon: p.icon || 'star' }));
    const players = roster.length;
    const counts = Array.from({ length: QN }, () => [0, 0, 0, 0]);
    for (const v of votes) if (counts[v.question_index] && v.option >= 0 && v.option < 4) counts[v.question_index][v.option]++;
    const voters = new Set(votes.map((v) => v.voter_id)).size;
    return Response.json({ game, counts, players, roster, voters });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}