import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '..', 'src', 'data');

const files: Record<string, string> = {
  players: 'players.json',
  teams: 'teams.json',
  skills: 'skills.json',
  starPlayers: 'starPlayers.json',
};

const upsert = db.prepare(`
  INSERT INTO game_data (key, data, updated_at)
  VALUES (?, ?, datetime('now'))
  ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = datetime('now')
`);

const seedAll = db.transaction(() => {
  for (const [key, filename] of Object.entries(files)) {
    const filePath = path.join(dataDir, filename);
    const raw = fs.readFileSync(filePath, 'utf-8');
    // Validate it's valid JSON
    JSON.parse(raw);
    upsert.run(key, raw);
    console.log(`Seeded game_data: ${key}`);
  }
});

seedAll();
console.log('Seed complete.');
