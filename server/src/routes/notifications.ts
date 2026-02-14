import { Router } from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ─── Helper: create a notification (called from other routes) ───

export function createNotification(opts: {
  userId: number;
  type: string;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
}) {
  const id = crypto.randomBytes(8).toString('base64url');
  db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, body, entity_type, entity_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, opts.userId, opts.type, opts.title, opts.body || '', opts.entityType || null, opts.entityId || null);
  return id;
}

// ─── Endpoints ───

// GET /api/notifications?unreadOnly=1&limit=30
router.get('/', requireAuth, (req, res) => {
  const unreadOnly = req.query.unreadOnly === '1';
  const limit = Math.min(Number(req.query.limit) || 30, 100);

  const where = unreadOnly
    ? 'WHERE user_id = ? AND is_read = 0'
    : 'WHERE user_id = ?';

  const rows = db.prepare(
    `SELECT id, type, title, body, entity_type, entity_id, is_read, created_at
     FROM notifications ${where}
     ORDER BY created_at DESC
     LIMIT ?`
  ).all(req.user!.userId, limit) as any[];

  res.json(rows.map(r => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    entityType: r.entity_type,
    entityId: r.entity_id,
    isRead: !!r.is_read,
    createdAt: r.created_at,
  })));
});

// GET /api/notifications/unread-count
router.get('/unread-count', requireAuth, (req, res) => {
  const row = db.prepare(
    'SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0'
  ).get(req.user!.userId) as { c: number };
  res.json({ count: row.c });
});

// POST /api/notifications/:id/read
router.post('/:id/read', requireAuth, (req, res) => {
  const result = db.prepare(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user!.userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  res.json({ ok: true });
});

// POST /api/notifications/read-all
router.post('/read-all', requireAuth, (req, res) => {
  db.prepare(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
  ).run(req.user!.userId);
  res.json({ ok: true });
});

// DELETE /api/notifications/:id
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user!.userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  res.json({ deleted: true });
});

// POST /api/notifications/test — create a test notification for the logged-in user
// Useful for manual testing; can be removed in production.
router.post('/test', requireAuth, (req, res) => {
  const { type, title, body, entityType, entityId } = req.body;
  const id = createNotification({
    userId: req.user!.userId,
    type: type || 'match_result',
    title: title || 'Test notification',
    body: body || 'This is a test notification',
    entityType: entityType || undefined,
    entityId: entityId || undefined,
  });
  res.status(201).json({ id });
});

export default router;
