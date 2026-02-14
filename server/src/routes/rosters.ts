import { Router } from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/rosters — list user's rosters (metadata only)
router.get('/', requireAuth, (req, res) => {
  const rosters = db.prepare(
    'SELECT id, name, team_id, team_name, share_id, created_at, updated_at FROM rosters WHERE user_id = ? ORDER BY updated_at DESC'
  ).all(req.user!.userId);

  res.json(rosters);
});

// GET /api/rosters/:id — get full roster
router.get('/:id', requireAuth, (req, res) => {
  const roster = db.prepare(
    'SELECT * FROM rosters WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.userId) as Record<string, unknown> | undefined;

  if (!roster) {
    res.status(404).json({ error: 'Roster not found' });
    return;
  }

  res.json({ ...roster, data: JSON.parse(roster.data as string) });
});

// POST /api/rosters — create roster
router.post('/', requireAuth, (req, res) => {
  const { id, name, teamId, teamName, data } = req.body;

  if (!id || !teamId || !teamName || !data) {
    res.status(400).json({ error: 'Missing required fields: id, teamId, teamName, data' });
    return;
  }

  try {
    db.prepare(
      'INSERT INTO rosters (id, user_id, name, team_id, team_name, data) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, req.user!.userId, name || '', teamId, teamName, JSON.stringify(data));

    res.status(201).json({ id });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      res.status(409).json({ error: 'Roster with this ID already exists' });
      return;
    }
    throw err;
  }
});

// PUT /api/rosters/:id — update roster
router.put('/:id', requireAuth, (req, res) => {
  const { name, teamId, teamName, data } = req.body;

  const existing = db.prepare(
    'SELECT id FROM rosters WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.userId);

  if (!existing) {
    res.status(404).json({ error: 'Roster not found' });
    return;
  }

  db.prepare(
    `UPDATE rosters SET name = COALESCE(?, name), team_id = COALESCE(?, team_id),
     team_name = COALESCE(?, team_name), data = COALESCE(?, data),
     updated_at = datetime('now') WHERE id = ?`
  ).run(
    name ?? null,
    teamId ?? null,
    teamName ?? null,
    data ? JSON.stringify(data) : null,
    req.params.id
  );

  res.json({ id: req.params.id, updated: true });
});

// DELETE /api/rosters/:id — delete roster
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare(
    'DELETE FROM rosters WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user!.userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Roster not found' });
    return;
  }

  res.json({ deleted: true });
});

// POST /api/rosters/:id/share — generate share link
router.post('/:id/share', requireAuth, (req, res) => {
  const roster = db.prepare(
    'SELECT id, share_id FROM rosters WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.userId) as { id: string; share_id: string | null } | undefined;

  if (!roster) {
    res.status(404).json({ error: 'Roster not found' });
    return;
  }

  if (roster.share_id) {
    res.json({ shareId: roster.share_id });
    return;
  }

  const shareId = crypto.randomBytes(8).toString('base64url');
  db.prepare('UPDATE rosters SET share_id = ? WHERE id = ?').run(shareId, roster.id);

  res.json({ shareId });
});

// DELETE /api/rosters/:id/share — remove share link
router.delete('/:id/share', requireAuth, (req, res) => {
  const result = db.prepare(
    'UPDATE rosters SET share_id = NULL WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user!.userId);
  if (result.changes === 0) { res.status(404).json({ error: 'Roster not found' }); return; }
  res.json({ unshared: true });
});

export default router;
