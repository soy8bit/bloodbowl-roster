import { Router, type Request } from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { createNotification } from './notifications.js';

const router = Router();

// Typed param helper
function p(req: Request, key: string): string {
  return req.params[key] as string;
}

// Helper: check membership
function getMembership(compId: string, userId: number): { role: string } | undefined {
  return db.prepare(
    'SELECT role FROM competition_members WHERE competition_id = ? AND user_id = ?'
  ).get(compId, userId) as { role: string } | undefined;
}

// Helper: check owner
function isOwner(compId: string, userId: number): boolean {
  const m = getMembership(compId, userId);
  return m?.role === 'owner';
}

// ─── Competitions ───

// POST / — create competition
router.post('/', requireAuth, (req, res) => {
  const { id, name, type, data } = req.body;
  if (!id || !name) {
    res.status(400).json({ error: 'Missing id or name' });
    return;
  }
  const compType = type === 'tournament' ? 'tournament' : 'league';
  const compData = JSON.stringify(data || {});

  const createTx = db.transaction(() => {
    db.prepare(
      'INSERT INTO competitions (id, owner_id, name, type, data) VALUES (?, ?, ?, ?, ?)'
    ).run(id, req.user!.userId, name, compType, compData);
    db.prepare(
      'INSERT INTO competition_members (competition_id, user_id, role) VALUES (?, ?, ?)'
    ).run(id, req.user!.userId, 'owner');
  });

  try {
    createTx();
    res.status(201).json({ id });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      res.status(409).json({ error: 'Competition already exists' });
      return;
    }
    throw err;
  }
});

// GET / — list my competitions
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT c.id, c.name, c.type, c.status, cm.role, c.created_at,
      (SELECT COUNT(*) FROM competition_rosters WHERE competition_id = c.id) AS roster_count,
      (SELECT COUNT(*) FROM competition_matches WHERE competition_id = c.id) AS match_count
    FROM competitions c
    JOIN competition_members cm ON cm.competition_id = c.id AND cm.user_id = ?
    ORDER BY c.created_at DESC
  `).all(req.user!.userId) as any[];

  res.json(rows.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type,
    status: r.status,
    role: r.role,
    rosterCount: r.roster_count,
    matchCount: r.match_count,
    createdAt: r.created_at,
  })));
});

// GET /:id — competition detail
router.get('/:id', requireAuth, (req, res) => {
  const m = getMembership(p(req, 'id'), req.user!.userId);
  if (!m) {
    res.status(403).json({ error: 'Not a member' });
    return;
  }

  const comp = db.prepare('SELECT * FROM competitions WHERE id = ?').get(p(req, 'id')) as any;
  if (!comp) {
    res.status(404).json({ error: 'Competition not found' });
    return;
  }

  const rosterCount = (db.prepare(
    'SELECT COUNT(*) AS c FROM competition_rosters WHERE competition_id = ?'
  ).get(p(req, 'id')) as any).c;

  const matchCount = (db.prepare(
    'SELECT COUNT(*) AS c FROM competition_matches WHERE competition_id = ?'
  ).get(p(req, 'id')) as any).c;

  res.json({
    id: comp.id,
    name: comp.name,
    type: comp.type,
    status: comp.status,
    ownerId: comp.owner_id,
    joinCode: comp.join_code || null,
    data: JSON.parse(comp.data || '{}'),
    rosterCount,
    matchCount,
    role: m.role,
    createdAt: comp.created_at,
  });
});

// PUT /:id — update competition
router.put('/:id', requireAuth, (req, res) => {
  if (!isOwner(p(req, 'id'), req.user!.userId)) {
    res.status(403).json({ error: 'Only the owner can update' });
    return;
  }

  const { name, status, data } = req.body;
  const sets: string[] = [];
  const params: any[] = [];

  if (name) { sets.push('name = ?'); params.push(name); }
  if (status) { sets.push('status = ?'); params.push(status); }
  if (data !== undefined) { sets.push('data = ?'); params.push(JSON.stringify(data)); }

  if (sets.length === 0) {
    res.status(400).json({ error: 'Nothing to update' });
    return;
  }

  sets.push("updated_at = datetime('now')");
  params.push(p(req, 'id'));

  db.prepare(`UPDATE competitions SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

// DELETE /:id — delete competition (CASCADE)
router.delete('/:id', requireAuth, (req, res) => {
  if (!isOwner(p(req, 'id'), req.user!.userId)) {
    res.status(403).json({ error: 'Only the owner can delete' });
    return;
  }

  db.prepare('DELETE FROM competitions WHERE id = ?').run(p(req, 'id'));
  res.json({ deleted: true });
});

// ─── Join Code ───

// POST /:id/generate-code — generate a join code (owner only)
router.post('/:id/generate-code', requireAuth, (req, res) => {
  if (!isOwner(p(req, 'id'), req.user!.userId)) {
    res.status(403).json({ error: 'Only the owner can generate a join code' });
    return;
  }

  // Check if already has a code
  const existing = db.prepare('SELECT join_code FROM competitions WHERE id = ?').get(p(req, 'id')) as any;
  if (!existing) {
    res.status(404).json({ error: 'Competition not found' });
    return;
  }
  if (existing.join_code) {
    res.json({ joinCode: existing.join_code });
    return;
  }

  const joinCode = crypto.randomBytes(4).toString('hex'); // 8-char hex
  db.prepare('UPDATE competitions SET join_code = ? WHERE id = ?').run(joinCode, p(req, 'id'));
  res.json({ joinCode });
});

// DELETE /:id/join-code — remove join code (owner only)
router.delete('/:id/join-code', requireAuth, (req, res) => {
  if (!isOwner(p(req, 'id'), req.user!.userId)) {
    res.status(403).json({ error: 'Only the owner can remove the join code' });
    return;
  }
  db.prepare('UPDATE competitions SET join_code = NULL WHERE id = ?').run(p(req, 'id'));
  res.json({ ok: true });
});

// POST /join — join a competition by code
router.post('/join', requireAuth, (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: 'Missing join code' });
    return;
  }

  const comp = db.prepare('SELECT id, name, type FROM competitions WHERE join_code = ?').get(code) as any;
  if (!comp) {
    res.status(404).json({ error: 'Invalid join code' });
    return;
  }

  // Check if already a member
  const existing = getMembership(comp.id, req.user!.userId);
  if (existing) {
    res.json({ id: comp.id, name: comp.name, type: comp.type, alreadyMember: true });
    return;
  }

  db.prepare(
    'INSERT INTO competition_members (competition_id, user_id, role) VALUES (?, ?, ?)'
  ).run(comp.id, req.user!.userId, 'member');

  // Notify owner
  const owner = db.prepare('SELECT owner_id FROM competitions WHERE id = ?').get(comp.id) as any;
  if (owner && owner.owner_id !== req.user!.userId) {
    const userRow = db.prepare('SELECT email, display_name FROM users WHERE id = ?').get(req.user!.userId) as any;
    createNotification({
      userId: owner.owner_id,
      type: 'member_joined',
      title: userRow?.display_name || userRow?.email || 'A user',
      body: comp.name,
      entityType: comp.type || 'league',
      entityId: comp.id,
    });
  }

  res.json({ id: comp.id, name: comp.name, type: comp.type, alreadyMember: false });
});

// ─── Schedule ───

// POST /:id/schedule — generate round-robin schedule (owner only)
router.post('/:id/schedule', requireAuth, (req, res) => {
  if (!isOwner(p(req, 'id'), req.user!.userId)) {
    res.status(403).json({ error: 'Only the owner can generate the schedule' });
    return;
  }

  const rosters = db.prepare(
    'SELECT id, name, team_name, coach_name FROM competition_rosters WHERE competition_id = ?'
  ).all(p(req, 'id')) as any[];

  if (rosters.length < 2) {
    res.status(400).json({ error: 'Need at least 2 rosters to generate schedule' });
    return;
  }

  // Check if there are already scheduled matches
  const existingScheduled = db.prepare(
    "SELECT COUNT(*) AS c FROM competition_matches WHERE competition_id = ? AND status = 'scheduled'"
  ).get(p(req, 'id')) as any;

  if (existingScheduled.c > 0) {
    res.status(400).json({ error: 'Schedule already exists. Delete scheduled matches first.' });
    return;
  }

  // Round-robin algorithm (circle method)
  const teams = [...rosters];
  const hasBye = teams.length % 2 !== 0;
  if (hasBye) teams.push({ id: '__bye__', name: 'BYE', team_name: '', coach_name: '' });

  const n = teams.length;
  const rounds = n - 1;
  const matchesPerRound = n / 2;
  const created: string[] = [];

  const scheduleTx = db.transaction(() => {
    // Use circle method: fix team[0], rotate the rest
    const fixed = teams[0];
    const rotating = teams.slice(1);

    for (let round = 0; round < rounds; round++) {
      const currentOrder = [fixed, ...rotating];

      for (let i = 0; i < matchesPerRound; i++) {
        const home = currentOrder[i];
        const away = currentOrder[n - 1 - i];

        // Skip bye matches
        if (home.id === '__bye__' || away.id === '__bye__') continue;

        const matchId = crypto.randomBytes(8).toString('base64url');
        const roundLabel = `${round + 1}`;

        // Insert a scheduled match with empty data
        const matchData = JSON.stringify({
          date: '',
          homeTeam: { rosterId: home.id, name: home.name, coach: home.coach_name, race: home.team_name, players: [] },
          awayTeam: { rosterId: away.id, name: away.name, coach: away.coach_name, race: away.team_name, players: [] },
          homeScore: 0,
          awayScore: 0,
        });

        db.prepare(`
          INSERT INTO competition_matches (id, competition_id, home_roster_id, away_roster_id, round, data, status)
          VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
        `).run(matchId, p(req, 'id'), home.id, away.id, roundLabel, matchData);

        created.push(matchId);
      }

      // Rotate: move last element to position 1
      rotating.unshift(rotating.pop()!);
    }
  });

  scheduleTx();
  res.status(201).json({ matchesCreated: created.length, rounds });
});

// DELETE /:id/schedule — delete all scheduled (unplayed) matches
router.delete('/:id/schedule', requireAuth, (req, res) => {
  if (!isOwner(p(req, 'id'), req.user!.userId)) {
    res.status(403).json({ error: 'Only the owner can delete the schedule' });
    return;
  }

  const result = db.prepare(
    "DELETE FROM competition_matches WHERE competition_id = ? AND status = 'scheduled'"
  ).run(p(req, 'id'));

  res.json({ deleted: result.changes });
});

// ─── My Matches ───

// GET /:id/my-matches — matches where the current user's rosters are involved
router.get('/:id/my-matches', requireAuth, (req, res) => {
  const m = getMembership(p(req, 'id'), req.user!.userId);
  if (!m) {
    res.status(403).json({ error: 'Not a member' });
    return;
  }

  // Find user's roster IDs in this competition
  const myRosters = db.prepare(
    'SELECT id FROM competition_rosters WHERE competition_id = ? AND user_id = ?'
  ).all(p(req, 'id'), req.user!.userId) as any[];
  const myRosterIds = new Set(myRosters.map((r: any) => r.id));

  if (myRosterIds.size === 0) {
    res.json([]);
    return;
  }

  const placeholders = Array.from(myRosterIds).map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT cm.id, cm.round, cm.data, cm.status, cm.created_at,
           cm.home_roster_id, cm.away_roster_id
    FROM competition_matches cm
    WHERE cm.competition_id = ?
      AND (cm.home_roster_id IN (${placeholders}) OR cm.away_roster_id IN (${placeholders}))
    ORDER BY CAST(cm.round AS INTEGER), cm.created_at
  `).all(p(req, 'id'), ...Array.from(myRosterIds), ...Array.from(myRosterIds)) as any[];

  res.json(rows.map(r => {
    const d = JSON.parse(r.data);
    return {
      id: r.id,
      round: r.round,
      status: r.status || 'played',
      date: d.date || '',
      homeTeamName: d.homeTeam?.name || '',
      awayTeamName: d.awayTeam?.name || '',
      homeRosterId: r.home_roster_id,
      awayRosterId: r.away_roster_id,
      homeScore: d.homeScore ?? 0,
      awayScore: d.awayScore ?? 0,
    };
  }));
});

// ─── Rosters ───

// POST /:id/rosters — enroll roster
router.post('/:id/rosters', requireAuth, (req, res) => {
  const m = getMembership(p(req, 'id'), req.user!.userId);
  if (!m) {
    res.status(403).json({ error: 'Not a member' });
    return;
  }

  const { id, originalRosterId, name, teamId, teamName, coachName, data } = req.body;
  if (!id || !name || !teamId || !teamName || !data) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    db.prepare(`
      INSERT INTO competition_rosters (id, competition_id, user_id, original_roster_id, name, team_id, team_name, coach_name, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, p(req, 'id'), req.user!.userId, originalRosterId || null, name, teamId, teamName, coachName || '', JSON.stringify(data));

    // Notify competition owner about the new enrollment (if enrollee is not the owner)
    const comp = db.prepare('SELECT owner_id, name, type FROM competitions WHERE id = ?').get(p(req, 'id')) as any;
    if (comp && comp.owner_id !== req.user!.userId) {
      createNotification({
        userId: comp.owner_id,
        type: 'roster_enrolled',
        title: `${name} (${teamName})`,
        body: comp.name,
        entityType: comp.type || 'league',
        entityId: p(req, 'id'),
      });
    }

    res.status(201).json({ id });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      res.status(409).json({ error: 'Roster already enrolled' });
      return;
    }
    throw err;
  }
});

// GET /:id/rosters — list enrolled rosters
router.get('/:id/rosters', requireAuth, (req, res) => {
  const m = getMembership(p(req, 'id'), req.user!.userId);
  if (!m) {
    res.status(403).json({ error: 'Not a member' });
    return;
  }

  const rows = db.prepare(
    'SELECT id, user_id, name, team_id, team_name, coach_name, data FROM competition_rosters WHERE competition_id = ?'
  ).all(p(req, 'id')) as any[];

  res.json(rows.map(r => {
    const d = JSON.parse(r.data);
    const players = d.players || [];
    const playerCost = players.reduce((s: number, p: any) => {
      const upgTV = (p.upgrades || []).reduce((us: number, u: any) => us + (u.tvIncrease || 0), 0);
      return s + (p.cost || 0) + upgTV;
    }, 0);

    return {
      id: r.id,
      userId: r.user_id,
      name: r.name,
      teamId: r.team_id,
      teamName: r.team_name,
      coachName: r.coach_name,
      playerCount: players.filter((p: any) => !p.dead).length,
      teamValue: playerCost,
    };
  }));
});

// GET /:id/rosters/:rId — roster detail
router.get('/:id/rosters/:rId', requireAuth, (req, res) => {
  const m = getMembership(p(req, 'id'), req.user!.userId);
  if (!m) {
    res.status(403).json({ error: 'Not a member' });
    return;
  }

  const row = db.prepare(
    'SELECT * FROM competition_rosters WHERE id = ? AND competition_id = ?'
  ).get(p(req, 'rId'), p(req, 'id')) as any;

  if (!row) {
    res.status(404).json({ error: 'Roster not found' });
    return;
  }

  res.json({
    id: row.id,
    competitionId: row.competition_id,
    userId: row.user_id,
    originalRosterId: row.original_roster_id,
    name: row.name,
    teamId: row.team_id,
    teamName: row.team_name,
    coachName: row.coach_name,
    data: JSON.parse(row.data),
  });
});

// DELETE /:id/rosters/:rId — remove roster
router.delete('/:id/rosters/:rId', requireAuth, (req, res) => {
  const row = db.prepare(
    'SELECT user_id FROM competition_rosters WHERE id = ? AND competition_id = ?'
  ).get(p(req, 'rId'), p(req, 'id')) as any;

  if (!row) {
    res.status(404).json({ error: 'Roster not found' });
    return;
  }

  // Owner of roster or owner of competition can remove
  if (row.user_id !== req.user!.userId && !isOwner(p(req, 'id'), req.user!.userId)) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  db.prepare('DELETE FROM competition_rosters WHERE id = ?').run(p(req, 'rId'));
  res.json({ deleted: true });
});

// ─── Matches ───

// Apply progression to a roster snapshot after a match
function applyProgression(rosterData: any, matchPlayers: any[]) {
  const roster = { ...rosterData, players: [...(rosterData.players || [])] };

  // Clear MNG from all players (they served their suspension)
  for (let i = 0; i < roster.players.length; i++) {
    roster.players[i] = { ...roster.players[i], missNextGame: false };
  }

  for (const mp of matchPlayers) {
    const idx = roster.players.findIndex((p: any) => p.uid === mp.uid);
    if (idx === -1) continue;

    const player = { ...roster.players[idx] };
    const spp = { ...(player.spp || { cp: 0, td: 0, def: 0, int: 0, bh: 0, si: 0, kill: 0, mvp: 0 }) };

    spp.td += mp.tds || 0;
    spp.cp += mp.cp || 0;
    spp.int += mp.int || 0;
    spp.def += mp.def || 0;
    spp.bh += mp.cas || 0;
    if (mp.mvp) spp.mvp += 1;

    player.spp = spp;

    const status = mp.postMatchStatus || 'ok';
    if (status === 'mng') {
      player.missNextGame = true;
    } else if (status === 'si') {
      player.missNextGame = true;
      const injuries = [...(player.injuries || [])];
      injuries.push({
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        type: mp.injuryDetail || 'niggle',
      });
      player.injuries = injuries;
    } else if (status === 'dead') {
      player.dead = true;
      player.missNextGame = true;
    }

    roster.players[idx] = player;
  }

  return roster;
}

// Revert progression applied by a match
function revertProgression(rosterData: any, matchPlayers: any[]) {
  const roster = { ...rosterData, players: [...(rosterData.players || [])] };

  for (const mp of matchPlayers) {
    const idx = roster.players.findIndex((p: any) => p.uid === mp.uid);
    if (idx === -1) continue;

    const player = { ...roster.players[idx] };
    const spp = { ...(player.spp || { cp: 0, td: 0, def: 0, int: 0, bh: 0, si: 0, kill: 0, mvp: 0 }) };

    spp.td = Math.max(0, spp.td - (mp.tds || 0));
    spp.cp = Math.max(0, spp.cp - (mp.cp || 0));
    spp.int = Math.max(0, spp.int - (mp.int || 0));
    spp.def = Math.max(0, spp.def - (mp.def || 0));
    spp.bh = Math.max(0, spp.bh - (mp.cas || 0));
    if (mp.mvp) spp.mvp = Math.max(0, spp.mvp - 1);

    player.spp = spp;

    const status = mp.postMatchStatus || 'ok';
    if (status === 'mng') {
      player.missNextGame = false;
    } else if (status === 'si') {
      player.missNextGame = false;
      if (player.injuries && player.injuries.length > 0) {
        // Remove last injury of matching type
        const injuries = [...player.injuries];
        const lastIdx = injuries.length - 1;
        for (let i = lastIdx; i >= 0; i--) {
          if (injuries[i].type === (mp.injuryDetail || 'niggle')) {
            injuries.splice(i, 1);
            break;
          }
        }
        player.injuries = injuries;
      }
    } else if (status === 'dead') {
      player.dead = false;
      player.missNextGame = false;
    }

    roster.players[idx] = player;
  }

  return roster;
}

// POST /:id/matches — create match
router.post('/:id/matches', requireAuth, (req, res) => {
  const m = getMembership(p(req, 'id'), req.user!.userId);
  if (!m) {
    res.status(403).json({ error: 'Not a member' });
    return;
  }

  const { id, homeRosterId, awayRosterId, round, data } = req.body;
  if (!id || !homeRosterId || !awayRosterId || !data) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // Validate rosters belong to competition
  const homeRoster = db.prepare(
    'SELECT id, data FROM competition_rosters WHERE id = ? AND competition_id = ?'
  ).get(homeRosterId, p(req, 'id')) as any;
  const awayRoster = db.prepare(
    'SELECT id, data FROM competition_rosters WHERE id = ? AND competition_id = ?'
  ).get(awayRosterId, p(req, 'id')) as any;

  if (!homeRoster || !awayRoster) {
    res.status(400).json({ error: 'Rosters must belong to this competition' });
    return;
  }

  // Validate MVP max 1 per team
  for (const side of ['homeTeam', 'awayTeam'] as const) {
    const team = data[side];
    if (!team?.players) continue;
    let mvpCount = 0;
    for (const p of team.players) {
      if (p.mvp) mvpCount++;
    }
    if (mvpCount > 1) {
      res.status(400).json({ error: `Max 1 MVP per team (${side})` });
      return;
    }
  }

  const createTx = db.transaction(() => {
    // Insert match
    db.prepare(`
      INSERT INTO competition_matches (id, competition_id, home_roster_id, away_roster_id, round, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, p(req, 'id'), homeRosterId, awayRosterId, round || '', JSON.stringify(data));

    // Apply progression to home roster
    const homeData = JSON.parse(homeRoster.data);
    const updatedHome = applyProgression(homeData, data.homeTeam?.players || []);
    db.prepare(
      "UPDATE competition_rosters SET data = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(JSON.stringify(updatedHome), homeRosterId);

    // Apply progression to away roster
    const awayData = JSON.parse(awayRoster.data);
    const updatedAway = applyProgression(awayData, data.awayTeam?.players || []);
    db.prepare(
      "UPDATE competition_rosters SET data = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(JSON.stringify(updatedAway), awayRosterId);
  });

  try {
    createTx();

    // Notify roster owners about the new match (skip the creator)
    const comp = db.prepare('SELECT name, type FROM competitions WHERE id = ?').get(p(req, 'id')) as any;
    const compName = comp?.name || '';
    const compType = comp?.type || 'league';
    const homeOwner = db.prepare('SELECT user_id FROM competition_rosters WHERE id = ?').get(homeRosterId) as any;
    const awayOwner = db.prepare('SELECT user_id FROM competition_rosters WHERE id = ?').get(awayRosterId) as any;

    const homeTeamName = data.homeTeam?.name || '';
    const awayTeamName = data.awayTeam?.name || '';
    const scoreText = `${data.homeScore ?? 0} - ${data.awayScore ?? 0}`;

    for (const owner of [homeOwner, awayOwner]) {
      if (owner && owner.user_id !== req.user!.userId) {
        createNotification({
          userId: owner.user_id,
          type: 'match_result',
          title: `${homeTeamName} ${scoreText} ${awayTeamName}`,
          body: compName,
          entityType: compType,
          entityId: p(req, 'id'),
        });
      }
    }

    res.status(201).json({ id });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      res.status(409).json({ error: 'Match already exists' });
      return;
    }
    throw err;
  }
});

// GET /:id/matches — list matches
router.get('/:id/matches', requireAuth, (req, res) => {
  const m = getMembership(p(req, 'id'), req.user!.userId);
  if (!m) {
    res.status(403).json({ error: 'Not a member' });
    return;
  }

  const rows = db.prepare(
    'SELECT id, round, data, status, created_at, home_roster_id, away_roster_id FROM competition_matches WHERE competition_id = ? ORDER BY CAST(round AS INTEGER), created_at DESC'
  ).all(p(req, 'id')) as any[];

  res.json(rows.map(r => {
    const d = JSON.parse(r.data);
    return {
      id: r.id,
      round: r.round,
      status: r.status || 'played',
      date: d.date || '',
      homeTeamName: d.homeTeam?.name || '',
      awayTeamName: d.awayTeam?.name || '',
      homeRosterId: r.home_roster_id,
      awayRosterId: r.away_roster_id,
      homeScore: d.homeScore ?? 0,
      awayScore: d.awayScore ?? 0,
    };
  }));
});

// GET /:id/matches/:mId — match detail
router.get('/:id/matches/:mId', requireAuth, (req, res) => {
  const m = getMembership(p(req, 'id'), req.user!.userId);
  if (!m) {
    res.status(403).json({ error: 'Not a member' });
    return;
  }

  const row = db.prepare(
    'SELECT * FROM competition_matches WHERE id = ? AND competition_id = ?'
  ).get(p(req, 'mId'), p(req, 'id')) as any;

  if (!row) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  res.json({
    id: row.id,
    competitionId: row.competition_id,
    homeRosterId: row.home_roster_id,
    awayRosterId: row.away_roster_id,
    round: row.round,
    status: row.status || 'played',
    data: JSON.parse(row.data),
    createdAt: row.created_at,
  });
});

// PUT /:id/matches/:mId — edit match (revert old + apply new)
router.put('/:id/matches/:mId', requireAuth, (req, res) => {
  const m = getMembership(p(req, 'id'), req.user!.userId);
  if (!m) {
    res.status(403).json({ error: 'Not a member' });
    return;
  }

  const { data, round } = req.body;
  if (!data) {
    res.status(400).json({ error: 'Missing data' });
    return;
  }

  const existingMatch = db.prepare(
    'SELECT * FROM competition_matches WHERE id = ? AND competition_id = ?'
  ).get(p(req, 'mId'), p(req, 'id')) as any;

  if (!existingMatch) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  const oldData = JSON.parse(existingMatch.data);

  const updateTx = db.transaction(() => {
    // Revert old progression for home
    const homeRoster = db.prepare('SELECT data FROM competition_rosters WHERE id = ?').get(existingMatch.home_roster_id) as any;
    if (homeRoster) {
      const reverted = revertProgression(JSON.parse(homeRoster.data), oldData.homeTeam?.players || []);
      const updated = applyProgression(reverted, data.homeTeam?.players || []);
      db.prepare("UPDATE competition_rosters SET data = ?, updated_at = datetime('now') WHERE id = ?")
        .run(JSON.stringify(updated), existingMatch.home_roster_id);
    }

    // Revert old progression for away
    const awayRoster = db.prepare('SELECT data FROM competition_rosters WHERE id = ?').get(existingMatch.away_roster_id) as any;
    if (awayRoster) {
      const reverted = revertProgression(JSON.parse(awayRoster.data), oldData.awayTeam?.players || []);
      const updated = applyProgression(reverted, data.awayTeam?.players || []);
      db.prepare("UPDATE competition_rosters SET data = ?, updated_at = datetime('now') WHERE id = ?")
        .run(JSON.stringify(updated), existingMatch.away_roster_id);
    }

    // Update match
    db.prepare(
      "UPDATE competition_matches SET data = ?, round = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(JSON.stringify(data), round ?? existingMatch.round, p(req, 'mId'));
  });

  updateTx();
  res.json({ id: p(req, 'mId') });
});

// POST /:id/matches/:mId/report — report a scheduled match (changes status to 'played' + applies progression)
router.post('/:id/matches/:mId/report', requireAuth, (req, res) => {
  const m = getMembership(p(req, 'id'), req.user!.userId);
  if (!m) {
    res.status(403).json({ error: 'Not a member' });
    return;
  }

  const { data } = req.body;
  if (!data) {
    res.status(400).json({ error: 'Missing data' });
    return;
  }

  const existingMatch = db.prepare(
    'SELECT * FROM competition_matches WHERE id = ? AND competition_id = ?'
  ).get(p(req, 'mId'), p(req, 'id')) as any;

  if (!existingMatch) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  if ((existingMatch.status || 'played') !== 'scheduled') {
    res.status(400).json({ error: 'Match is not scheduled (already played)' });
    return;
  }

  // Check the reporter is involved (owns one of the rosters) or is owner
  const homeRosterRow = db.prepare('SELECT user_id FROM competition_rosters WHERE id = ?').get(existingMatch.home_roster_id) as any;
  const awayRosterRow = db.prepare('SELECT user_id FROM competition_rosters WHERE id = ?').get(existingMatch.away_roster_id) as any;
  const isInvolved = homeRosterRow?.user_id === req.user!.userId || awayRosterRow?.user_id === req.user!.userId;
  const isCompOwner = isOwner(p(req, 'id'), req.user!.userId);

  if (!isInvolved && !isCompOwner) {
    res.status(403).json({ error: 'Only involved coaches or the organizer can report this match' });
    return;
  }

  // Validate MVP max 1 per team
  for (const side of ['homeTeam', 'awayTeam'] as const) {
    const team = data[side];
    if (!team?.players) continue;
    let mvpCount = 0;
    for (const pl of team.players) {
      if (pl.mvp) mvpCount++;
    }
    if (mvpCount > 1) {
      res.status(400).json({ error: `Max 1 MVP per team (${side})` });
      return;
    }
  }

  const reportTx = db.transaction(() => {
    // Apply progression to home roster
    const homeRoster = db.prepare('SELECT data FROM competition_rosters WHERE id = ?').get(existingMatch.home_roster_id) as any;
    if (homeRoster) {
      const homeData = JSON.parse(homeRoster.data);
      const updatedHome = applyProgression(homeData, data.homeTeam?.players || []);
      db.prepare(
        "UPDATE competition_rosters SET data = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(JSON.stringify(updatedHome), existingMatch.home_roster_id);
    }

    // Apply progression to away roster
    const awayRoster = db.prepare('SELECT data FROM competition_rosters WHERE id = ?').get(existingMatch.away_roster_id) as any;
    if (awayRoster) {
      const awayData = JSON.parse(awayRoster.data);
      const updatedAway = applyProgression(awayData, data.awayTeam?.players || []);
      db.prepare(
        "UPDATE competition_rosters SET data = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(JSON.stringify(updatedAway), existingMatch.away_roster_id);
    }

    // Update match: set data + status to 'played'
    db.prepare(
      "UPDATE competition_matches SET data = ?, status = 'played', updated_at = datetime('now') WHERE id = ?"
    ).run(JSON.stringify(data), p(req, 'mId'));
  });

  reportTx();

  // Notify the other coach
  const comp = db.prepare('SELECT name, type FROM competitions WHERE id = ?').get(p(req, 'id')) as any;
  const compName = comp?.name || '';
  const compType = comp?.type || 'league';
  const homeTeamName = data.homeTeam?.name || '';
  const awayTeamName = data.awayTeam?.name || '';
  const scoreText = `${data.homeScore ?? 0} - ${data.awayScore ?? 0}`;

  for (const owner of [homeRosterRow, awayRosterRow]) {
    if (owner && owner.user_id !== req.user!.userId) {
      createNotification({
        userId: owner.user_id,
        type: 'match_result',
        title: `${homeTeamName} ${scoreText} ${awayTeamName}`,
        body: compName,
        entityType: compType,
        entityId: p(req, 'id'),
      });
    }
  }

  res.json({ id: p(req, 'mId') });
});

// DELETE /:id/matches/:mId — delete match (revert progression)
router.delete('/:id/matches/:mId', requireAuth, (req, res) => {
  const m = getMembership(p(req, 'id'), req.user!.userId);
  if (!m) {
    res.status(403).json({ error: 'Not a member' });
    return;
  }

  const existingMatch = db.prepare(
    'SELECT * FROM competition_matches WHERE id = ? AND competition_id = ?'
  ).get(p(req, 'mId'), p(req, 'id')) as any;

  if (!existingMatch) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  const matchStatus = existingMatch.status || 'played';

  const deleteTx = db.transaction(() => {
    // Only revert progression for played matches (not scheduled ones)
    if (matchStatus === 'played') {
      const oldData = JSON.parse(existingMatch.data);

      const homeRoster = db.prepare('SELECT data FROM competition_rosters WHERE id = ?').get(existingMatch.home_roster_id) as any;
      if (homeRoster) {
        const reverted = revertProgression(JSON.parse(homeRoster.data), oldData.homeTeam?.players || []);
        db.prepare("UPDATE competition_rosters SET data = ?, updated_at = datetime('now') WHERE id = ?")
          .run(JSON.stringify(reverted), existingMatch.home_roster_id);
      }

      const awayRoster = db.prepare('SELECT data FROM competition_rosters WHERE id = ?').get(existingMatch.away_roster_id) as any;
      if (awayRoster) {
        const reverted = revertProgression(JSON.parse(awayRoster.data), oldData.awayTeam?.players || []);
        db.prepare("UPDATE competition_rosters SET data = ?, updated_at = datetime('now') WHERE id = ?")
          .run(JSON.stringify(reverted), existingMatch.away_roster_id);
      }
    }

    db.prepare('DELETE FROM competition_matches WHERE id = ?').run(p(req, 'mId'));
  });

  deleteTx();
  res.json({ deleted: true });
});

// ─── Standings ───

router.get('/:id/standings', requireAuth, (req, res) => {
  const m = getMembership(p(req, 'id'), req.user!.userId);
  if (!m) {
    res.status(403).json({ error: 'Not a member' });
    return;
  }

  // Get all rosters
  const rosters = db.prepare(
    'SELECT id, name, team_name, coach_name FROM competition_rosters WHERE competition_id = ?'
  ).all(p(req, 'id')) as any[];

  // Get all played matches (not scheduled)
  const matches = db.prepare(
    "SELECT home_roster_id, away_roster_id, data FROM competition_matches WHERE competition_id = ? AND (status IS NULL OR status = 'played')"
  ).all(p(req, 'id')) as any[];

  // Build standings map
  const map = new Map<string, any>();
  for (const r of rosters) {
    map.set(r.id, {
      rosterId: r.id,
      teamName: r.name,
      coachName: r.coach_name,
      race: r.team_name,
      played: 0, won: 0, drawn: 0, lost: 0,
      tdFor: 0, tdAgainst: 0, tdDiff: 0, casFor: 0, points: 0,
    });
  }

  for (const match of matches) {
    const d = JSON.parse(match.data);
    const homeId = match.home_roster_id;
    const awayId = match.away_roster_id;
    const hs = d.homeScore ?? 0;
    const as_ = d.awayScore ?? 0;

    const homeCas = (d.homeTeam?.players || []).reduce((s: number, p: any) => s + (p.cas || 0), 0);
    const awayCas = (d.awayTeam?.players || []).reduce((s: number, p: any) => s + (p.cas || 0), 0);

    const home = map.get(homeId);
    const away = map.get(awayId);

    if (home) {
      home.played++;
      home.tdFor += hs;
      home.tdAgainst += as_;
      home.casFor += homeCas;
      if (hs > as_) { home.won++; home.points += 3; }
      else if (hs === as_) { home.drawn++; home.points += 1; }
      else { home.lost++; }
    }

    if (away) {
      away.played++;
      away.tdFor += as_;
      away.tdAgainst += hs;
      away.casFor += awayCas;
      if (as_ > hs) { away.won++; away.points += 3; }
      else if (as_ === hs) { away.drawn++; away.points += 1; }
      else { away.lost++; }
    }
  }

  const standings = Array.from(map.values())
    .map(s => ({ ...s, tdDiff: s.tdFor - s.tdAgainst }))
    .sort((a, b) => b.points - a.points || b.tdDiff - a.tdDiff || b.tdFor - a.tdFor);

  res.json(standings);
});

export default router;
