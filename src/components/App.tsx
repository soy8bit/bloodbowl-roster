import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useRoster } from '../hooks/useRoster';
import { useAuth } from '../hooks/useAuth';
import { ToastContext, useToastState } from '../hooks/useToast';
import { LanguageProvider, useLang } from '../i18n';
import ToastList from './Toast';
import TeamSelector from './TeamSelector';
import RosterBuilder from './RosterBuilder';
import SavedRosters from './SavedRosters';
import SkillsPage from './SkillsPage';
import LoginPage from './auth/LoginPage';
import AdminLayout from './admin/AdminLayout';
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

function MainApp() {
  const roster = useRoster();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView: View = searchParams.get('v') === 'saved' ? 'saved' : (roster.currentId ? 'builder' : 'selector');
  const [view, setView] = useState<View>(initialView);

  // React to search param changes (from hamburger menu)
  useEffect(() => {
    const v = searchParams.get('v');
    if (v === 'saved' && view !== 'saved') {
      setView('saved');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

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
  );
}

function AppContent() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, setLang, t } = useLang();
  const toastState = useToastState();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isLoginRoute = location.pathname === '/login';
  const isSkillsRoute = location.pathname === '/skills';
  const isHome = !isAdminRoute && !isLoginRoute && !isSkillsRoute;

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

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

  const navTo = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <ToastContext.Provider value={toastState}>
    <div className="app">
      <header className="app-header">
        <h1 className="app-title" onClick={() => navTo('/')}>{t.appTitle}</h1>
        <div className="header-controls">
          <button
            className="nav-btn lang-toggle"
            onClick={toggleLang}
            title={lang === 'en' ? 'Cambiar a español' : 'Switch to English'}
          >
            {lang === 'en' ? 'ES' : 'EN'}
          </button>
          <label className="theme-switch" title={theme === 'dark' ? t.switchToLight : t.switchToDark}>
            <input
              type="checkbox"
              checked={theme === 'light'}
              onChange={toggleTheme}
            />
            <span className="theme-switch-slider">
              <span className="theme-switch-icon">{theme === 'dark' ? '\u263D' : '\u2600'}</span>
            </span>
          </label>
          <div className="hamburger-wrapper" ref={menuRef}>
            <button
              className={`hamburger-btn ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={t.navMenu}
              aria-expanded={menuOpen}
              aria-controls="nav-dropdown"
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </button>
            {menuOpen && (
              <nav className="dropdown-menu" id="nav-dropdown">
                <button className={`dropdown-item ${isHome ? 'active' : ''}`} onClick={() => navTo('/')}>
                  {t.navHome}
                </button>
                <button className="dropdown-item" onClick={() => navTo('/')}>
                  {t.newTeam}
                </button>
                <button className="dropdown-item" onClick={() => { navTo('/?v=saved'); }}>
                  {t.savedRosters}
                </button>
                <button className={`dropdown-item ${isSkillsRoute ? 'active' : ''}`} onClick={() => navTo('/skills')}>
                  {t.navSkills}
                </button>
                {user?.isAdmin && (
                  <button className={`dropdown-item ${isAdminRoute ? 'active' : ''}`} onClick={() => navTo('/admin')}>
                    {t.navAdmin}
                  </button>
                )}
                <div className="dropdown-divider" />
                {user ? (
                  <button className="dropdown-item" onClick={() => { logout(); setMenuOpen(false); }}>
                    {t.navLogout(user.email)}
                  </button>
                ) : (
                  <button className={`dropdown-item ${isLoginRoute ? 'active' : ''}`} onClick={() => navTo('/login')}>
                    {t.navLogin}
                  </button>
                )}
              </nav>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/admin/*" element={<AdminLayout />} />
          <Route path="*" element={<MainApp />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="footer-brand">
          <span className="footer-app-name">{t.appTitle}</span>
          <span className="footer-author">{t.footerAuthor}</span>
          <span className="footer-version">v1.0.0</span>
        </div>
        <div className="footer-links">
          <a href="https://www.bloodbowl.com/rules" target="_blank" rel="noopener noreferrer">{t.footerRules}</a>
        </div>
      </footer>
      <ToastList />
    </div>
    </ToastContext.Provider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
