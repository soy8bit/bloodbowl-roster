# BB Roster Maker

Blood Bowl roster builder and league management web app. Based on BB2020 rules (Season 3).

## Quick Start

```bash
# Frontend (Vite dev server, port 5173)
npm run dev

# Backend (Express + SQLite, port 3001)
npm run server

# Seed game data into DB from JSON files
npm run server:seed

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

Both servers must run simultaneously. Vite proxies `/api` requests to `localhost:3001` (configured in `vite.config.ts`).

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, react-router-dom v7, motion (framer-motion), CSS (single `App.css` file)
- **Backend**: Express 5, better-sqlite3, bcryptjs, jsonwebtoken
- **Runtime**: tsx (TypeScript execution for server)
- **No test framework** is configured

## Project Structure

```
src/
  components/          # React components
    admin/             # Admin panel (teams, players, skills, star players editors)
    auth/              # Login page
    competitions/      # Leagues & tournaments (listing, detail, match wizard, standings)
    matches/           # Match reports (independent of competitions)
  hooks/               # Custom hooks (useRoster, useAuth, useCompetitions, useMatches, useAccount)
  data/                # Static JSON game data (teams, players, skills, starPlayers, inducements)
  types/index.ts       # All TypeScript interfaces
  utils/               # Utility functions (pdfExport, rosterUtils, progressionUtils, competitionUtils)
  i18n.tsx             # Bilingual i18n system (EN/ES)
  App.css              # ALL styles in one file (~8000 lines)
  main.tsx             # Entry point

server/
  src/
    index.ts           # Express app setup, route mounting
    db.ts              # SQLite database init, schema, migrations
    seed.ts            # Seeds game_data table from src/data/*.json
    middleware/auth.ts  # JWT auth middleware
    routes/
      auth.ts          # Login/register
      rosters.ts       # CRUD rosters + sharing
      gameData.ts      # Admin game data CRUD
      matches.ts       # Match reports
      me.ts            # User profile
      competitions.ts  # Leagues/tournaments with roster snapshots + progression
  data.db              # SQLite database file (gitignored)
```

## Key Architectural Decisions

### Data Flow
- **Game data** (teams, players, skills, star players) is stored as JSON files in `src/data/` AND in the `game_data` SQLite table. The JSON files are the source of truth; run `npm run server:seed` to sync to DB. The admin panel edits the DB version via `/api/game-data/:key`.
- **Rosters** are stored in localStorage (`bb_rosters` key) for offline use AND optionally synced to the server for logged-in users.
- **Competitions** use a snapshot model: when a roster is enrolled in a league/tournament, a deep copy is stored in `competition_rosters`. All progression (SPP, injuries, deaths) operates on the snapshot, fully isolated between competitions.

### i18n
- `src/i18n.tsx` exports `useLang()` hook returning `{ t, lang, setLang }`.
- `t` is an object with all strings. Some values are functions: `t.compRostersCount(3)` → `"3 rosters"`.
- Language is `'en' | 'es'`, stored in localStorage (`bb_lang`).
- All user-facing text must be in both languages.

### Styling
- Single `src/App.css` file. Uses CSS custom properties (defined at `:root` and `[data-theme="light"]`).
- Key variables: `--bg-primary`, `--bg-card`, `--bg-hover`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent-gold`, `--border`, `--font-brand`.
- Dark theme is default. Light theme via `data-theme="light"` on `<html>`.
- Mobile-first responsive design with `@media (max-width: 640px)` breakpoints.

### Authentication
- JWT-based. Token stored in localStorage (`bb_token`).
- `useAuth()` hook provides `{ user, login, register, logout }`.
- Server middleware: `requireAuth` extracts user from JWT and sets `req.user`.
- Admin check: `req.user.isAdmin` (set in DB `users.is_admin`).

### Routing
- react-router-dom v7 with `<Routes>` in `App.tsx`.
- Key routes: `/`, `/builder`, `/saved`, `/skills`, `/star-players`, `/help`, `/login`, `/admin`, `/matches`, `/leagues`, `/tournaments`, `/leagues/:id`, `/leagues/:id/match/new`, `/leagues/:id/match/:matchId`.

## Database

SQLite via better-sqlite3. Schema auto-created in `server/src/db.ts`. Tables:

| Table | Purpose |
|-------|---------|
| `users` | Auth accounts with optional premium plan |
| `rosters` | Cloud-saved rosters (JSON blob in `data` column) |
| `game_data` | Admin-editable game data (key-value, JSON blob) |
| `matches` | Independent match reports |
| `competitions` | League/tournament metadata |
| `competition_members` | User membership + role (owner/member) |
| `competition_rosters` | Roster snapshots with progression |
| `competition_matches` | Competition match results with post-match effects |

Migrations are idempotent ALTER TABLEs in the `migrations` array — "duplicate column" errors are silenced.

## Conventions

- **Language**: Code, comments, and variable names in English. User-facing strings bilingual (EN/ES).
- **Components**: Functional components with hooks. No class components.
- **State**: Local state with useState/useReducer. No global state library.
- **IDs**: Generated client-side with `Date.now().toString(36) + Math.random().toString(36).substring(2, 9)`.
- **API pattern**: `apiFetch()` helper wrapping `fetch` with JWT header injection. Hooks return `{ data, loading, error, fetchX, createX, ... }`.
- **No semicolons** in some files, semicolons in others — not enforced. No linter/formatter configured.

## Common Tasks

### Adding a new i18n string
1. Add to `en` object in `src/i18n.tsx`
2. Add equivalent to `es` object (same key)
3. Use via `const { t } = useLang(); t.myNewKey`

### Adding a new API route
1. Create or edit file in `server/src/routes/`
2. Mount in `server/src/index.ts`: `app.use('/api/path', routes)`
3. Use `requireAuth` middleware for protected endpoints

### Adding a new page/route
1. Create component in `src/components/`
2. Add `<Route>` in `App.tsx`
3. Add navigation link in the hamburger menu (inside `MainApp`)

### Modifying game data
- Edit JSON files in `src/data/` (source of truth)
- Run `npm run server:seed` to push changes to the DB
- Or use the admin panel at `/admin` (modifies DB directly)

## Important Notes

- The `nul` file in project root is an artifact — ignore it.
- `src/data/*.data.ts` and `src/models/` are excluded from tsconfig (legacy/unused).
- Server process exits if stdin is closed in background; use `nohup` when running detached.
- Express 5 (not 4) — async error handling is built-in, no need for `next(err)` wrappers.
- Star player skills are stored as string names (not numeric IDs like regular player skills).
