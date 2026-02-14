import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All routes require auth
router.use(requireAuth);

// ---------- Premium helper ----------

/**
 * Determines if a user currently has an active premium subscription.
 *
 * plan_until contract:
 *   - Must always be stored as ISO 8601 UTC string, e.g. new Date(ms).toISOString()
 *     Example: "2026-03-14T00:00:00.000Z"
 *   - null means "premium indefinitely" (lifetime or manual grant).
 *   - Invalid/unparseable values are treated as "not premium" + logged.
 */
function checkPremium(plan: string | null, planUntil: string | null): boolean {
  if (plan !== 'premium') return false;

  // null plan_until = indefinite premium (lifetime grant)
  if (!planUntil) return true;

  const expiry = new Date(planUntil);
  if (isNaN(expiry.getTime())) {
    console.warn(`[PREMIUM] Invalid plan_until value: "${planUntil}" — treating as not premium`);
    return false;
  }

  return expiry > new Date();
}

// ---------- Profile ----------

// GET /api/me — full user profile with premium status
router.get('/', (req, res) => {
  const user = db.prepare(`
    SELECT id, email, display_name, is_admin, plan, plan_until,
           stripe_customer_id, stripe_subscription_id, created_at
    FROM users WHERE id = ?
  `).get(req.user!.userId) as {
    id: number; email: string; display_name: string; is_admin: number;
    plan: string; plan_until: string | null;
    stripe_customer_id: string | null; stripe_subscription_id: string | null;
    created_at: string;
  } | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const isPremium = checkPremium(user.plan, user.plan_until);

  res.json({
    id: user.id,
    email: user.email,
    displayName: user.display_name || '',
    isAdmin: !!user.is_admin,
    plan: user.plan || 'free',
    planUntil: user.plan_until,
    isPremium,
    hasStripe: !!user.stripe_customer_id,
    createdAt: user.created_at,
  });
});

// PATCH /api/me — update profile fields
// Only display_name is writable. Sensitive fields (plan, email, stripe_*) are never
// accepted here — they must go through dedicated endpoints (Stripe webhook, etc.).
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/;

router.patch('/', (req, res) => {
  const { displayName } = req.body;

  if (displayName === undefined) {
    res.status(400).json({ error: 'Nothing to update' });
    return;
  }

  if (typeof displayName !== 'string') {
    res.status(400).json({ error: 'displayName must be a string' });
    return;
  }

  const normalized = displayName.trim();

  if (normalized.length < 2 || normalized.length > 50) {
    res.status(400).json({ error: 'displayName must be 2-50 characters after trimming' });
    return;
  }

  if (CONTROL_CHARS_RE.test(normalized)) {
    res.status(400).json({ error: 'displayName contains invalid control characters' });
    return;
  }

  db.prepare('UPDATE users SET display_name = ? WHERE id = ?')
    .run(normalized, req.user!.userId);

  res.json({ updated: true, displayName: normalized });
});

// ---------- Rosters ----------

// GET /api/me/rosters — list user's cloud-saved rosters (summary)
router.get('/rosters', (req, res) => {
  const rosters = db.prepare(`
    SELECT id, name, team_id, team_name, share_id, created_at, updated_at
    FROM rosters WHERE user_id = ? ORDER BY updated_at DESC
  `).all(req.user!.userId);

  res.json(rosters);
});

// ---------- Matches ----------

// GET /api/me/matches — list user's recent matches (summary, last 50)
router.get('/matches', (req, res) => {
  const rows = db.prepare(
    'SELECT id, data, created_at FROM matches WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
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

// ---------- Competitions ----------

// GET /api/me/competitions — list competitions the user is a member of
router.get('/competitions', (req, res) => {
  const comps = db.prepare(`
    SELECT c.id, c.name, c.type, c.status, c.owner_id, cm.role, cm.joined_at, c.created_at
    FROM competitions c
    JOIN competition_members cm ON cm.competition_id = c.id
    WHERE cm.user_id = ?
    ORDER BY c.created_at DESC
  `).all(req.user!.userId) as {
    id: string; name: string; type: string; status: string;
    owner_id: number; role: string; joined_at: string; created_at: string;
  }[];

  res.json(comps.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    status: c.status,
    isOwner: c.owner_id === req.user!.userId,
    role: c.role,
    joinedAt: c.joined_at,
    createdAt: c.created_at,
  })));
});

export default router;
