import { useState, useMemo, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useRoster } from '../hooks/useRoster';
import { LanguageProvider, useLang } from '../i18n';
import TeamSelector from './TeamSelector';
import RosterBuilder from './RosterBuilder';
import SavedRosters from './SavedRosters';
import type { TeamData, PlayerData } from '../types';
import teamsRaw from '../data/teams.json';
import playersRaw from '../data/players.json';
import skillsRaw from '../data/skills.json';

const teams = teamsRaw as TeamData[];
const players = playersRaw as PlayerData[];
const skills = skillsRaw as Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;

type View = 'selector' | 'builder' | 'saved';
type Theme = 'dark' | 'light';

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem('bb_theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'dark';
}

function AppContent() {
  const roster = useRoster();
  const [view, setView] = useState<View>(roster.currentId ? 'builder' : 'selector');
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const { lang, setLang, t } = useLang();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bb_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'es' : 'en');
  }, [lang, setLang]);

  const playerMap = useMemo(() => {
    const map = new Map<number, PlayerData>();
    players.forEach((p) => map.set(p.id, p));
    return map;
  }, []);

  const teamMap = useMemo(() => {
    const map = new Map<string, TeamData>();
    teams.forEach((t) => map.set(t.id, t));
    return map;
  }, []);

  const handleSelectTeam = (team: TeamData) => {
    roster.newRoster(team);
    setView('builder');
  };

  const handleLoadRoster = (id: string) => {
    roster.loadRoster(id);
    setView('builder');
  };

  const handleBack = () => {
    setView('selector');
    setTimeout(() => roster.goBack(), 150);
  };

  const handleShowSaved = () => setView('saved');
  const handleNewTeam = () => setView('selector');

  const currentTeam = roster.currentRoster
    ? teamMap.get(roster.currentRoster.teamId) ?? null
    : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title" onClick={handleBack}>{t.appTitle}</h1>
        <nav className="app-nav">
          <button
            className={`nav-btn ${view === 'selector' ? 'active' : ''}`}
            onClick={handleNewTeam}
          >
            {t.newTeam}
          </button>
          <button
            className={`nav-btn ${view === 'saved' ? 'active' : ''}`}
            onClick={handleShowSaved}
          >
            {t.savedRosters}
          </button>
          <button
            className="nav-btn lang-toggle"
            onClick={toggleLang}
            title={lang === 'en' ? 'Cambiar a español' : 'Switch to English'}
          >
            {lang === 'en' ? 'ES' : 'EN'}
          </button>
          <button
            className="nav-btn theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? t.switchToLight : t.switchToDark}
          >
            {theme === 'dark' ? '\u2600' : '\u263D'}
          </button>
        </nav>
      </header>

      <main className="app-main">
        <AnimatePresence mode="wait">
          {view === 'selector' && (
            <motion.div key="selector" {...pageTransition}>
              <TeamSelector teams={teams} onSelect={handleSelectTeam} />
            </motion.div>
          )}
          {view === 'builder' && roster.currentRoster && currentTeam && (
            <motion.div key="builder" {...pageTransition}>
              <RosterBuilder
                roster={roster.currentRoster}
                team={currentTeam}
                playerMap={playerMap}
                skills={skills}
                rosterActions={roster}
                onBack={handleBack}
              />
            </motion.div>
          )}
          {view === 'saved' && (
            <motion.div key="saved" {...pageTransition}>
              <SavedRosters
                rosters={roster.savedRostersList}
                teamMap={teamMap}
                allRosters={roster}
                onLoad={handleLoadRoster}
                onNew={handleNewTeam}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
