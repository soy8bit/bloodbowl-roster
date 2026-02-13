import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)'
  ).run(email, passwordHash);

  const token = signToken({
    userId: result.lastInsertRowid as number,
    email,
    isAdmin: false,
  });

  res.status(201).json({ token, user: { id: result.lastInsertRowid, email, isAdmin: false } });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.prepare(
    'SELECT id, email, password_hash, is_admin FROM users WHERE email = ?'
  ).get(email) as { id: number; email: string; password_hash: string; is_admin: number } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    isAdmin: !!user.is_admin,
  });

  res.json({ token, user: { id: user.id, email: user.email, isAdmin: !!user.is_admin } });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, is_admin, created_at FROM users WHERE id = ?')
    .get(req.user!.userId) as { id: number; email: string; is_admin: number; created_at: string } | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ id: user.id, email: user.email, isAdmin: !!user.is_admin, createdAt: user.created_at });
});

export default router;
