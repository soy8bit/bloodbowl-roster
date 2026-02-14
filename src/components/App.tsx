import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
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
import StarPlayersPage from './StarPlayersPage';
import LoginPage from './auth/LoginPage';
import AdminLayout from './admin/AdminLayout';
import HelpPage from './HelpPage';
import LandingPage from './LandingPage';
import PolicyPage from './PolicyPage';
import AccountPage from './AccountPage';
import SharedRosterView from './SharedRosterView';
import NotificationBell from './NotificationBell';
import CookieBanner from './CookieBanner';
import MatchesPage from './matches/MatchesPage';
import CreateMatch from './matches/CreateMatch';
import MatchDetail from './matches/MatchDetail';
import SharedMatchView from './matches/SharedMatchView';
import MatchStats from './matches/MatchStats';
import CompetitionsPage from './competitions/CompetitionsPage';
import CompetitionDetail from './competitions/CompetitionDetail';
import CompetitionMatchWizard from './competitions/CompetitionMatchWizard';
import CompetitionMatchDetail from './competitions/CompetitionMatchDetail';
import CompetitionMatchReport from './competitions/CompetitionMatchReport';
import type { TeamData, PlayerData } from '../types';
import logoImg from '../assets/logo.png';
import teamsRaw from '../data/teams.json';
import playersRaw from '../data/players.json';
import skillsRaw from '../data/skills.json';

const teams = teamsRaw as TeamData[];
const players = playersRaw as PlayerData[];
const skills = skillsRaw as Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;

type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem('bb_theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'dark';
}

function TeamSelectorPage() {
  const roster = useRoster();
  const navigate = useNavigate();

  // Clear any leftover roster on mount so selector is always fresh
  useEffect(() => {
    roster.goBack();
  }, []);

  const handleSelectTeam = (team: TeamData) => {
    const r = roster.newRoster(team);
    navigate(`/roster/${r.id}`, { replace: true });
  };

  return <TeamSelector teams={teams} onSelect={handleSelectTeam} />;
}

function RosterEditorPage() {
  const { id } = useParams<{ id: string }>();
  const roster = useRoster();
  const navigate = useNavigate();

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

  // Load roster from persisted store if not already loaded
  useEffect(() => {
    if (id && id !== roster.currentId) {
      roster.loadRoster(id);
    }
  }, [id]);

  // If discard of a new roster clears currentId, navigate away
  useEffect(() => {
    if (!roster.currentId && !roster.currentRoster) {
      navigate('/create', { replace: true });
    }
  }, [roster.currentId, roster.currentRoster]);

  const currentTeam = roster.currentRoster
    ? teamMap.get(roster.currentRoster.teamId) ?? null
    : null;

  const handleBack = () => {
    navigate('/my-teams');
    setTimeout(() => roster.goBack(), 150);
  };

  if (!roster.currentRoster || !currentTeam) return null;

  return (
    <RosterBuilder
      roster={roster.currentRoster}
      team={currentTeam}
      playerMap={playerMap}
      skills={skills}
      rosterActions={roster}
      onBack={handleBack}
      hasUnsavedChanges={roster.hasUnsavedChanges}
      onSave={() => roster.saveRoster()}
      onDiscard={() => roster.discardChanges()}
    />
  );
}

function MyTeamsPage() {
  const roster = useRoster();
  const navigate = useNavigate();

  const teamMap = useMemo(() => {
    const map = new Map<string, TeamData>();
    teams.forEach((t) => map.set(t.id, t));
    return map;
  }, []);

  const handleLoad = (id: string) => {
    roster.loadRoster(id);
    navigate(`/roster/${id}`);
  };

  const handleNew = () => {
    navigate('/create');
  };

  return (
    <SavedRosters
      rosters={roster.savedRostersList}
      teamMap={teamMap}
      allRosters={roster}
      onLoad={handleLoad}
      onNew={handleNew}
    />
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
  const isStarPlayersRoute = location.pathname === '/star-players';
  const isHelpRoute = location.pathname === '/help';
  const isCreateRoute = location.pathname === '/create';
  const isMatchesRoute = location.pathname.startsWith('/matches');
  const isLeaguesRoute = location.pathname.startsWith('/leagues');
  const isTournamentsRoute = location.pathname.startsWith('/tournaments');
  const isLanding = location.pathname === '/';
  const isAccountRoute = location.pathname === '/account';
  const isHome = isLanding || isCreateRoute;

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
    document.documentElement.classList.toggle('dark', theme === 'dark');
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
        <img
          src={logoImg}
          alt="BB Toolkit Dugout"
          className="header-logo"
          onClick={() => navTo('/')}
        />
        <div className="header-controls">
          <button
            className="lang-btn"
            onClick={toggleLang}
            title={lang === 'en' ? 'Cambiar a español' : 'Switch to English'}
            aria-label={lang === 'en' ? 'Cambiar a español' : 'Switch to English'}
          >
            {lang === 'en' ? (
              <svg className="lang-flag-svg" viewBox="0 0 60 30"><clipPath id="uf"><rect width="60" height="30" rx="2"/></clipPath><g clipPath="url(#uf)"><path d="M0 0h60v30H0" fill="#00247d"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6"/><path d="M0 0l60 30m0-30L0 30" stroke="#cf142b" strokeWidth="4"/><path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10"/><path d="M30 0v30M0 15h60" stroke="#cf142b" strokeWidth="6"/></g></svg>
            ) : (
              <svg className="lang-flag-svg" viewBox="0 0 60 30"><clipPath id="sf"><rect width="60" height="30" rx="2"/></clipPath><g clipPath="url(#sf)"><path d="M0 0h60v30H0" fill="#c60b1e"/><path d="M0 7.5h60v15H0" fill="#ffc400"/></g></svg>
            )}
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
          <NotificationBell enabled={!!user} />
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
            <AnimatePresence>
            {menuOpen && (
              <motion.nav
                className="dropdown-menu"
                id="nav-dropdown"
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <div className="dropdown-section-label">{t.navSectionTeams}</div>
                <button className={`dropdown-item ${isLanding ? 'active' : ''}`} onClick={() => navTo('/')}>
                  {t.navHome}
                </button>
                <button className={`dropdown-item ${isCreateRoute ? 'active' : ''}`} onClick={() => navTo('/create')}>
                  {t.newTeam}
                </button>
                <button className={`dropdown-item ${location.pathname === '/my-teams' ? 'active' : ''}`} onClick={() => navTo('/my-teams')}>
                  {t.savedRosters}
                </button>
                <div className="dropdown-divider" />
                <div className="dropdown-section-label">{t.navSectionReference}</div>
                <button className={`dropdown-item ${isSkillsRoute ? 'active' : ''}`} onClick={() => navTo('/skills')}>
                  {t.navSkills}
                </button>
                <button className={`dropdown-item ${isStarPlayersRoute ? 'active' : ''}`} onClick={() => navTo('/star-players')}>
                  {t.navStarPlayers}
                </button>
                <div className="dropdown-divider" />
                <div className="dropdown-section-label">{t.navSectionMatches}</div>
                <button className={`dropdown-item ${location.pathname === '/matches' ? 'active' : ''}`} onClick={() => navTo('/matches')}>
                  {t.matchesTitle}
                </button>
                <button className={`dropdown-item ${location.pathname === '/matches/stats' ? 'active' : ''}`} onClick={() => navTo('/matches/stats')}>
                  {t.matchStatsTitle}
                </button>
                <div className="dropdown-divider" />
                <div className="dropdown-section-label">{t.navSectionCompetitions}</div>
                <button className={`dropdown-item ${isLeaguesRoute ? 'active' : ''}`} onClick={() => navTo('/leagues')}>
                  {t.navLeagues}
                </button>
                <button className={`dropdown-item ${isTournamentsRoute ? 'active' : ''}`} onClick={() => navTo('/tournaments')}>
                  {t.navTournaments}
                </button>
                <div className="dropdown-divider" />
                <button className={`dropdown-item ${isHelpRoute ? 'active' : ''}`} onClick={() => navTo('/help')}>
                  {t.navHelp}
                </button>
                {user?.isAdmin && (
                  <button className={`dropdown-item ${isAdminRoute ? 'active' : ''}`} onClick={() => navTo('/admin')}>
                    {t.navAdmin}
                  </button>
                )}
                <div className="dropdown-divider dropdown-mobile-controls">
                  <div className="dropdown-controls-row">
                    <button className="dropdown-item dropdown-lang-row" onClick={toggleLang}>
                      {lang === 'en' ? (
                        <svg className="lang-flag-svg" viewBox="0 0 60 30"><clipPath id="uf2"><rect width="60" height="30" rx="2"/></clipPath><g clipPath="url(#uf2)"><path d="M0 0h60v30H0" fill="#00247d"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6"/><path d="M0 0l60 30m0-30L0 30" stroke="#cf142b" strokeWidth="4"/><path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10"/><path d="M30 0v30M0 15h60" stroke="#cf142b" strokeWidth="6"/></g></svg>
                      ) : (
                        <svg className="lang-flag-svg" viewBox="0 0 60 30"><clipPath id="sf2"><rect width="60" height="30" rx="2"/></clipPath><g clipPath="url(#sf2)"><path d="M0 0h60v30H0" fill="#c60b1e"/><path d="M0 7.5h60v15H0" fill="#ffc400"/></g></svg>
                      )}
                      <span className="dropdown-lang-label">{lang === 'en' ? 'English' : 'Español'}</span>
                    </button>
                    <button className="dropdown-item dropdown-theme" onClick={toggleTheme}>
                      {theme === 'dark' ? t.switchToLight : t.switchToDark}
                    </button>
                  </div>
                </div>
                <div className="dropdown-divider" />
                {user ? (
                  <>
                    <button className={`dropdown-item ${isAccountRoute ? 'active' : ''}`} onClick={() => navTo('/account')}>
                      {t.navAccount}
                    </button>
                    <button className="dropdown-item" onClick={() => { logout(); setMenuOpen(false); }}>
                      {t.navLogout(user.email)}
                    </button>
                  </>
                ) : (
                  <button className={`dropdown-item ${isLoginRoute ? 'active' : ''}`} onClick={() => navTo('/login')}>
                    {t.navLogin}
                  </button>
                )}
              </motion.nav>
            )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/create" element={<TeamSelectorPage />} />
          <Route path="/roster/shared/:shareId" element={<SharedRosterView />} />
          <Route path="/roster/:id" element={<RosterEditorPage />} />
          <Route path="/my-teams" element={<MyTeamsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/star-players" element={<StarPlayersPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/privacy" element={<PolicyPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/matches/new" element={<CreateMatch />} />
          <Route path="/matches/stats" element={<MatchStats />} />
          <Route path="/matches/shared/:shareId" element={<SharedMatchView />} />
          <Route path="/matches/:id" element={<MatchDetail />} />
          <Route path="/leagues" element={<CompetitionsPage type="league" />} />
          <Route path="/leagues/:id" element={<CompetitionDetail type="league" />} />
          <Route path="/leagues/:id/match/new" element={<CompetitionMatchWizard type="league" />} />
          <Route path="/leagues/:id/match/:matchId/report" element={<CompetitionMatchReport type="league" />} />
          <Route path="/leagues/:id/match/:matchId" element={<CompetitionMatchDetail type="league" />} />
          <Route path="/tournaments" element={<CompetitionsPage type="tournament" />} />
          <Route path="/tournaments/:id" element={<CompetitionDetail type="tournament" />} />
          <Route path="/tournaments/:id/match/new" element={<CompetitionMatchWizard type="tournament" />} />
          <Route path="/tournaments/:id/match/:matchId/report" element={<CompetitionMatchReport type="tournament" />} />
          <Route path="/tournaments/:id/match/:matchId" element={<CompetitionMatchDetail type="tournament" />} />
          <Route path="/admin/*" element={<AdminLayout />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="footer-brand">
          <span className="footer-app-name">{t.appTitle}</span>
          <span className="footer-author">{t.footerAuthor}</span>
          <span className="footer-version">v1.0.0 · Season 3</span>
        </div>
        <button className="footer-privacy-link" onClick={() => navTo('/privacy')}>
          {t.cookiePolicy}
        </button>
      </footer>
      <CookieBanner />
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
