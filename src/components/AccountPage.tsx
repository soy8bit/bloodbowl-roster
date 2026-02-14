import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAccount } from '../hooks/useAccount';
import { useLang } from '../i18n';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Badge } from './ui/badge';
import type { CloudRoster, MatchSummaryAccount, CompetitionSummary } from '../hooks/useAccount';

export default function AccountPage() {
  const { user } = useAuth();
  const account = useAccount();
  const { t } = useLang();
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    if (user) account.fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return (
      <div className="account-page">
        <h2 className="account-title">{t.accountTitle}</h2>
        <div className="flex flex-col items-center gap-4 py-12 text-center text-muted-foreground">
          <p>{t.accountLoginRequired}</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>{t.navLogin}</button>
        </div>
      </div>
    );
  }

  const { profile, rosters, matches, competitions, loading, error } = account;

  const handleSaveName = async () => {
    const ok = await account.updateDisplayName(nameInput.trim());
    if (ok) setEditingName(false);
  };

  const startEditName = () => {
    setNameInput(profile?.displayName || '');
    setEditingName(true);
  };

  return (
    <div className="account-page">
      <h2 className="account-title">{t.accountTitle}</h2>

      {error && <div className="matches-error">{error}</div>}

      <Tabs defaultValue="profile" className="mt-4">
        <TabsList className="flex w-full gap-0 rounded-none bg-transparent p-0 h-auto" style={{ borderBottom: '2px solid var(--border)' }}>
          <TabsTrigger
            value="profile"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold"
            style={{ marginBottom: '-2px' }}
          >
            {t.accountTabProfile}
          </TabsTrigger>
          <TabsTrigger
            value="rosters"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold"
            style={{ marginBottom: '-2px' }}
          >
            {t.accountTabRosters}
            <span className="ml-1.5 text-[10px] rounded-full px-1.5 py-px" style={{ background: 'var(--bg-hover)' }}>{rosters.length}</span>
          </TabsTrigger>
          <TabsTrigger
            value="matches"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold"
            style={{ marginBottom: '-2px' }}
          >
            {t.accountTabMatches}
            <span className="ml-1.5 text-[10px] rounded-full px-1.5 py-px" style={{ background: 'var(--bg-hover)' }}>{matches.length}</span>
          </TabsTrigger>
          <TabsTrigger
            value="competitions"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold"
            style={{ marginBottom: '-2px' }}
          >
            {t.accountTabCompetitions}
            <span className="ml-1.5 text-[10px] rounded-full px-1.5 py-px" style={{ background: 'var(--bg-hover)' }}>{competitions.length}</span>
          </TabsTrigger>
        </TabsList>

        {loading && <div className="matches-loading">...</div>}

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-4">
          {!loading && profile && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{t.accountEmail}</span>
                    <span className="text-foreground">{profile.email}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{t.accountDisplayName}</span>
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          maxLength={50}
                          className="account-input"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                        />
                        <button className="btn-primary btn-small" onClick={handleSaveName}>{t.accountSave}</button>
                        <button className="btn-secondary btn-small" onClick={() => setEditingName(false)}>{t.cancel}</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{profile.displayName || <em className="text-muted-foreground">{t.accountNoName}</em>}</span>
                        <button className="btn-secondary btn-small" onClick={startEditName}>{t.accountEditBtn}</button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{t.accountPlan}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={profile.isPremium ? 'success' : 'secondary'}>
                        {profile.isPremium ? 'Premium' : 'Free'}
                      </Badge>
                      {profile.isPremium && profile.planUntil && (
                        <span className="text-xs text-muted-foreground">
                          {t.accountUntil} {new Date(profile.planUntil).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{t.accountMemberSince}</span>
                    <span className="text-foreground">{new Date(profile.createdAt).toLocaleDateString()}</span>
                  </div>

                  {profile.isAdmin && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">{t.accountRole}</span>
                      <Badge variant="warning">Admin</Badge>
                    </div>
                  )}
              </div>

              <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
                {[
                  { value: rosters.length, label: t.accountTabRosters },
                  { value: matches.length, label: t.accountTabMatches },
                  { value: competitions.length, label: t.accountTabCompetitions },
                ].map((kpi, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-center rounded-lg py-4 px-3"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <span
                      className="text-2xl font-bold leading-tight"
                      style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-brand)' }}
                    >
                      {kpi.value}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                      {kpi.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Rosters Tab */}
        <TabsContent value="rosters" className="mt-4">
          {!loading && (
            <>
              {rosters.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-12 text-center text-muted-foreground">
                  <p>{t.accountNoRosters}</p>
                  <button className="btn-primary" onClick={() => navigate('/create')}>{t.newTeam}</button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {rosters.map((r: CloudRoster) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors hover:brightness-110"
                      style={{ background: 'var(--bg-secondary)' }}
                      onClick={() => navigate(`/create`)}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground truncate text-sm">{r.name || r.team_name}</span>
                        <span className="text-xs text-muted-foreground">{r.team_name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</span>
                        {r.share_id && <Badge variant="outline">{t.accountShared}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="mt-4">
          {!loading && (
            <>
              {matches.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-12 text-center text-muted-foreground">
                  <p>{t.matchNoMatches}</p>
                  <button className="btn-primary" onClick={() => navigate('/matches/new')}>+ {t.newMatch}</button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {matches.map((m: MatchSummaryAccount) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors hover:brightness-110"
                      style={{ background: 'var(--bg-secondary)' }}
                      onClick={() => navigate(`/matches/${m.id}`)}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground truncate text-sm">
                          {m.homeTeamName} <span style={{ color: 'var(--accent-gold)' }}>{m.homeScore} - {m.awayScore}</span> {m.awayTeamName}
                        </span>
                        {m.competition && <span className="text-xs text-muted-foreground">{m.competition}{m.round ? ` — ${m.round}` : ''}</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{m.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Competitions Tab */}
        <TabsContent value="competitions" className="mt-4">
          {!loading && (
            <>
              {competitions.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-12 text-center text-muted-foreground">
                  <p>{t.accountNoCompetitions}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {competitions.map((c: CompetitionSummary) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors hover:brightness-110"
                      style={{ background: 'var(--bg-secondary)' }}
                      onClick={() => navigate(`/${c.type === 'league' ? 'leagues' : 'tournaments'}/${c.id}`)}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground truncate text-sm">{c.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {c.type === 'league' ? t.accountLeague : t.accountTournament}
                          {' — '}
                          {c.status === 'active' ? t.accountStatusActive : t.accountStatusFinished}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {c.isOwner && <Badge variant="warning">{t.accountOwner}</Badge>}
                        <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
