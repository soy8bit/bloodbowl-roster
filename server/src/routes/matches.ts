import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/matches — list user's match summaries
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(
    'SELECT id, data, created_at FROM matches WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user!.userId) as { id: string; data: string; created_at: string }[];

  const summaries = rows.map((row) => {
    const d = JSON.parse(row.data);
    return {
      id: row.id,
      date: d.date,
      competition: d.competition,
      round: d.round,
      homeTeamName: d.homeTeam?.name || '',
      awayTeamName: d.awayTeam?.name || '',
      homeScore: d.homeScore ?? 0,
      awayScore: d.awayScore ?? 0,
      createdAt: row.created_at,
    };
  });

  res.json(summaries);
});

// GET /api/matches/:id — get full match
router.get('/:id', requireAuth, (req, res) => {
  const row = db.prepare(
    'SELECT * FROM matches WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.userId) as { id: string; data: string } | undefined;

  if (!row) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  res.json({ id: row.id, data: JSON.parse(row.data) });
});

// POST /api/matches — create match
router.post('/', requireAuth, (req, res) => {
  const { id, data } = req.body;

  if (!id || !data) {
    res.status(400).json({ error: 'Missing required fields: id, data' });
    return;
  }

  if (!data.homeTeam || !data.awayTeam) {
    res.status(400).json({ error: 'Missing homeTeam or awayTeam' });
    return;
  }

  if (typeof data.homeScore !== 'number' || typeof data.awayScore !== 'number') {
    res.status(400).json({ error: 'homeScore and awayScore must be numbers' });
    return;
  }

  // Validate players
  for (const side of ['homeTeam', 'awayTeam'] as const) {
    const team = data[side];
    let mvpCount = 0;
    for (const p of team.players || []) {
      for (const field of ['tds', 'cas', 'cp', 'int', 'def'] as const) {
        const v = p[field];
        if (v !== undefined && v !== 0 && (typeof v !== 'number' || v < 0 || !Number.isInteger(v))) {
          res.status(400).json({ error: `Invalid ${field} for player ${p.name} in ${side}` });
          return;
        }
      }
      if (p.mvp) mvpCount++;
    }
    if (mvpCount > 1) {
      res.status(400).json({ error: `Max 1 MVP per team (${side})` });
      return;
    }
  }

  try {
    db.prepare(
      'INSERT INTO matches (id, user_id, data) VALUES (?, ?, ?)'
    ).run(id, req.user!.userId, JSON.stringify(data));

    res.status(201).json({ id });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      res.status(409).json({ error: 'Match with this ID already exists' });
      return;
    }
    throw err;
  }
});

// PUT /api/matches/:id — update match
router.put('/:id', requireAuth, (req, res) => {
  const { data } = req.body;

  if (!data) {
    res.status(400).json({ error: 'Missing required field: data' });
    return;
  }

  if (!data.homeTeam || !data.awayTeam) {
    res.status(400).json({ error: 'Missing homeTeam or awayTeam' });
    return;
  }

  if (typeof data.homeScore !== 'number' || typeof data.awayScore !== 'number') {
    res.status(400).json({ error: 'homeScore and awayScore must be numbers' });
    return;
  }

  for (const side of ['homeTeam', 'awayTeam'] as const) {
    const team = data[side];
    let mvpCount = 0;
    for (const p of team.players || []) {
      for (const field of ['tds', 'cas', 'cp', 'int', 'def'] as const) {
        const v = p[field];
        if (v !== undefined && v !== 0 && (typeof v !== 'number' || v < 0 || !Number.isInteger(v))) {
          res.status(400).json({ error: `Invalid ${field} for player ${p.name} in ${side}` });
          return;
        }
      }
      if (p.mvp) mvpCount++;
    }
    if (mvpCount > 1) {
      res.status(400).json({ error: `Max 1 MVP per team (${side})` });
      return;
    }
  }

  const result = db.prepare(
    'UPDATE matches SET data = ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?'
  ).run(JSON.stringify(data), req.params.id, req.user!.userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  res.json({ id: req.params.id });
});

// Add/remove share for a match
router.post('/:id/share', requireAuth, (req, res) => {
  const row = db.prepare(
    'SELECT id, data FROM matches WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.userId) as { id: string; data: string } | undefined;

  if (!row) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  const shareId = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  const data = JSON.parse(row.data);
  data.shareId = shareId;
  db.prepare('UPDATE matches SET data = ? WHERE id = ?').run(JSON.stringify(data), row.id);

  res.json({ shareId });
});

router.delete('/:id/share', requireAuth, (req, res) => {
  const row = db.prepare(
    'SELECT id, data FROM matches WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.userId) as { id: string; data: string } | undefined;

  if (!row) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  const data = JSON.parse(row.data);
  delete data.shareId;
  db.prepare('UPDATE matches SET data = ? WHERE id = ?').run(JSON.stringify(data), row.id);

  res.json({ ok: true });
});

// Public shared match (no auth required)
router.get('/shared/:shareId', (req, res) => {
  const rows = db.prepare('SELECT data FROM matches').all() as { data: string }[];
  for (const row of rows) {
    const d = JSON.parse(row.data);
    if (d.shareId === req.params.shareId) {
      res.json({ data: d });
      return;
    }
  }
  res.status(404).json({ error: 'Shared match not found' });
});

// DELETE /api/matches/:id — delete match
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare(
    'DELETE FROM matches WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user!.userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  res.json({ deleted: true });
});

export default router;
