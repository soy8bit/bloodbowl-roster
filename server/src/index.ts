import express from 'express';
import cors from 'cors';
import db from './db.js';
import authRoutes from './routes/auth.js';
import rosterRoutes from './routes/rosters.js';
import gameDataRoutes from './routes/gameData.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rosters', rosterRoutes);
app.use('/api/game-data', gameDataRoutes);

// GET /api/shared/:shareId — view shared roster (public, read-only)
app.get('/api/shared/:shareId', (req, res) => {
  const roster = db.prepare(
    'SELECT id, name, team_id, team_name, data, created_at, updated_at FROM rosters WHERE share_id = ?'
  ).get(req.params.shareId) as Record<string, unknown> | undefined;

  if (!roster) {
    res.status(404).json({ error: 'Shared roster not found' });
    return;
  }

  res.json({ ...roster, data: JSON.parse(roster.data as string) });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
