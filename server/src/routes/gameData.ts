import { Router } from 'express';
import db from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const VALID_KEYS = ['players', 'teams', 'skills', 'starPlayers'];

// GET /api/game-data/:key — public
router.get('/:key', (req, res) => {
  const { key } = req.params;

  if (!VALID_KEYS.includes(key)) {
    res.status(400).json({ error: `Invalid key. Must be one of: ${VALID_KEYS.join(', ')}` });
    return;
  }

  const row = db.prepare('SELECT data, updated_at FROM game_data WHERE key = ?')
    .get(key) as { data: string; updated_at: string } | undefined;

  if (!row) {
    res.status(404).json({ error: 'Game data not found. Run seed first.' });
    return;
  }

  res.json({ key, data: JSON.parse(row.data), updatedAt: row.updated_at });
});

// PUT /api/game-data/:key — admin only
router.put('/:key', requireAdmin, (req, res) => {
  const { key } = req.params;
  const { data } = req.body;

  if (!VALID_KEYS.includes(key)) {
    res.status(400).json({ error: `Invalid key. Must be one of: ${VALID_KEYS.join(', ')}` });
    return;
  }

  if (!data) {
    res.status(400).json({ error: 'Missing data field' });
    return;
  }

  db.prepare(
    `INSERT INTO game_data (key, data, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`
  ).run(key, JSON.stringify(data));

  res.json({ key, updated: true });
});

export default router;
