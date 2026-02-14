import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCompetitions } from '../../hooks/useCompetitions';
import { useLang } from '../../i18n';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import StandingsTable from './StandingsTable';
import EnrollRosterModal from './EnrollRosterModal';
import type { Competition, CompetitionRosterSummary, CompetitionMatchSummary, StandingRow, CompetitionType } from '../../types';

interface Props {
  type: CompetitionType;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function CompetitionDetail({ type }: Props) {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const api = useCompetitions();
  const { t } = useLang();
  const navigate = useNavigate();

  const [comp, setComp] = useState<Competition | null>(null);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [rosters, setRosters] = useState<CompetitionRosterSummary[]>([]);
  const [matches, setMatches] = useState<CompetitionMatchSummary[]>([]);
  const [myMatches, setMyMatches] = useState<CompetitionMatchSummary[]>([]);
  const [showEnroll, setShowEnroll] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [codeCopied, setCodeCopied] = useState(false);
  const [schedulingMsg, setSchedulingMsg] = useState('');

  const basePath = type === 'league' ? '/leagues' : '/tournaments';

  const loadAll = useCallback(async () => {
    if (!id) return;
    setLoadingData(true);
    const [compData, standingsData, rostersData, matchesData, myMatchesData] = await Promise.all([
      api.fetchCompetition(id),
      api.fetchStandings(id),
      api.fetchRosters(id),
      api.fetchMatches(id),
      api.fetchMyMatches(id),
    ]);
    if (compData) setComp(compData);
    setStandings(standingsData);
    setRosters(rostersData);
    setMatches(matchesData);
    setMyMatches(myMatchesData);
    setLoadingData(false);
  }, [id]);

  useEffect(() => {
    if (user && id) loadAll();
  }, [user, id]);

  const hasMyRosters = useMemo(() => {
    if (!user) return false;
    return rosters.some(r => r.userId === user.id);
  }, [rosters, user]);

  const scheduledMatches = useMemo(() => matches.filter(m => m.status === 'scheduled'), [matches]);
  const playedMatches = useMemo(() => matches.filter(m => m.status === 'played'), [matches]);
  const myPending = useMemo(() => myMatches.filter(m => m.status === 'scheduled'), [myMatches]);
  const myPlayed = useMemo(() => myMatches.filter(m => m.status === 'played'), [myMatches]);

  if (!user) {
    return <div className="competition-page"><p className="comp-empty-state">{t.compLoginRequired}</p></div>;
  }

  if (loadingData && !comp) {
    return <div className="competition-page"><p className="comp-loading-msg">{t.compLoading}</p></div>;
  }

  if (!comp) {
    return <div className="competition-page"><p className="comp-error-msg">{t.compNotFound}</p></div>;
  }

  const isOwner = comp.role === 'owner';
  const leader = standings.length > 0 ? standings[0] : null;

  const handleStatusChange = async (newStatus: string) => {
    await api.updateCompetition(comp.id, { status: newStatus });
    setComp({ ...comp, status: newStatus as any });
  };

  const handleEnroll = async (roster: any) => {
    const ok = await api.enrollRoster(comp.id, roster);
    if (ok) {
      const [updated, updatedStandings] = await Promise.all([
        api.fetchRosters(comp.id),
        api.fetchStandings(comp.id),
      ]);
      setRosters(updated);
      setStandings(updatedStandings);
    }
    return ok;
  };

  const handleRemoveRoster = async (rosterId: string) => {
    if (!confirm(t.compRemoveRosterConfirm)) return;
    await api.removeRoster(comp.id, rosterId);
    const [updated, updatedStandings] = await Promise.all([
      api.fetchRosters(comp.id),
      api.fetchStandings(comp.id),
    ]);
    setRosters(updated);
    setStandings(updatedStandings);
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm(t.compDeleteMatchConfirm)) return;
    await api.deleteMatch(comp.id, matchId);
    const [updatedMatches, updatedStandings, updatedMyMatches] = await Promise.all([
      api.fetchMatches(comp.id),
      api.fetchStandings(comp.id),
      api.fetchMyMatches(comp.id),
    ]);
    setMatches(updatedMatches);
    setStandings(updatedStandings);
    setMyMatches(updatedMyMatches);
  };

  const handleGenerateCode = async () => {
    const code = await api.generateJoinCode(comp.id);
    if (code) setComp({ ...comp, joinCode: code });
  };

  const handleCopyCode = () => {
    if (comp.joinCode) {
      navigator.clipboard.writeText(comp.joinCode).then(() => {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      });
    }
  };

  const handleRemoveCode = async () => {
    const ok = await api.removeJoinCode(comp.id);
    if (ok) setComp({ ...comp, joinCode: null });
  };

  const handleGenerateSchedule = async () => {
    setSchedulingMsg('');
    const result = await api.generateSchedule(comp.id);
    if (result) {
      setSchedulingMsg(t.compScheduleGenerated(result.matchesCreated, result.rounds));
      const [updatedMatches, updatedMyMatches] = await Promise.all([
        api.fetchMatches(comp.id),
        api.fetchMyMatches(comp.id),
      ]);
      setMatches(updatedMatches);
      setMyMatches(updatedMyMatches);
    } else if (api.error) {
      setSchedulingMsg(api.error);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!confirm(t.compDeleteScheduleConfirm)) return;
    setSchedulingMsg('');
    const ok = await api.deleteSchedule(comp.id);
    if (ok) {
      const [updatedMatches, updatedMyMatches] = await Promise.all([
        api.fetchMatches(comp.id),
        api.fetchMyMatches(comp.id),
      ]);
      setMatches(updatedMatches);
      setMyMatches(updatedMyMatches);
    }
  };

  // ─── KPI data: always build 3 items for balanced grid ───
  const kpis = [
    { value: rosters.length, label: t.compSummaryRosters },
    { value: scheduledMatches.length > 0 ? `${playedMatches.length} / ${matches.length}` : playedMatches.length, label: t.compSummaryMatches },
    { value: leader ? leader.teamName : '—', label: leader ? `${t.compSummaryLeader} · ${leader.points} ${t.matchStatsPts}` : t.compSummaryNoLeader, isText: true },
  ];

  const renderMatchCard = (m: CompetitionMatchSummary, showReport: boolean) => {
    const isScheduled = m.status === 'scheduled';
    return (
      <div
        key={m.id}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
          !isScheduled
            ? 'cursor-pointer hover:bg-muted/50'
            : 'opacity-70'
        }`}
        style={{ background: 'var(--bg-secondary)' }}
        onClick={() => !isScheduled && navigate(`${basePath}/${comp.id}/match/${m.id}`)}
      >
        <span className="text-xs text-muted-foreground font-mono w-8 text-center shrink-0">{m.round || '-'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-foreground truncate">{m.homeTeamName}</span>
            {isScheduled ? (
              <span className="text-muted-foreground text-xs">vs</span>
            ) : (
              <span className="font-bold text-accent">{m.homeScore} - {m.awayScore}</span>
            )}
            <span className="font-medium text-foreground truncate">{m.awayTeamName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isScheduled ? (
            <>
              <Badge variant="secondary" className="text-[10px]">{t.compMatchScheduled}</Badge>
              {showReport && comp.status === 'active' && (
                <button
                  className="btn-primary btn-small"
                  onClick={e => { e.stopPropagation(); navigate(`${basePath}/${comp.id}/match/${m.id}/report`); }}
                >
                  {t.compReportMatch}
                </button>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">{formatDate(m.date)}</span>
          )}
          {isOwner && (
            <button
              className="text-muted-foreground hover:text-destructive text-base leading-none px-0.5 transition-colors"
              onClick={e => { e.stopPropagation(); handleDeleteMatch(m.id); }}
              title={t.delete_}
            >
              &times;
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="competition-page">
      <button className="btn-back" onClick={() => navigate(basePath)}>&larr; {t.back}</button>

      {/* ── Header: Title + Status + Actions ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap mt-2 mb-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 style={{ margin: 0 }}>{comp.name}</h2>
          <Badge variant={comp.status === 'active' ? 'success' : 'secondary'}>
            {comp.status === 'active' ? t.compStatusActive :
            comp.status === 'finished' ? t.compStatusFinished : t.compStatusArchived}
          </Badge>
        </div>
        {isOwner && (
          <div className="flex gap-2 shrink-0">
            {comp.status === 'active' && (
              <button className="btn-secondary btn-small" onClick={() => handleStatusChange('finished')}>
                {t.compFinish}
              </button>
            )}
            {comp.status === 'finished' && (
              <button className="btn-secondary btn-small" onClick={() => handleStatusChange('active')}>
                {t.compReactivate}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Join Code (owner only) ── */}
      {isOwner && comp.status === 'active' && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {comp.joinCode ? (
            <>
              <span className="text-sm text-muted-foreground">{t.compJoinCode}:</span>
              <code className="rounded-md px-2.5 py-1 text-sm font-mono text-foreground" style={{ background: 'var(--bg-secondary)' }}>{comp.joinCode}</code>
              <button className="btn-secondary btn-small" onClick={handleCopyCode}>
                {codeCopied ? t.compCodeCopied : t.compCopyCode}
              </button>
              <button className="btn-secondary btn-small" onClick={handleRemoveCode}>
                {t.compRemoveCode}
              </button>
            </>
          ) : (
            <button className="btn-secondary btn-small" onClick={handleGenerateCode}>
              {t.compGenerateCode}
            </button>
          )}
        </div>
      )}

      {/* ── KPI Row: always 3 balanced columns ── */}
      <div className="grid grid-cols-3 gap-3 mb-6 max-sm:grid-cols-1">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center rounded-lg py-4 px-3"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <span
              className={`font-bold leading-tight ${kpi.isText ? 'text-base truncate max-w-full' : 'text-2xl'}`}
              style={{ color: 'var(--accent-gold)', fontFamily: kpi.isText ? undefined : 'var(--font-brand)' }}
            >
              {kpi.value}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1 text-center">
              {kpi.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Tabs: underline style, not pill style ── */}
      <Tabs defaultValue="standings">
        <TabsList className="flex w-full gap-0 rounded-none bg-transparent p-0 h-auto" style={{ borderBottom: '2px solid var(--border)' }}>
          <TabsTrigger
            value="standings"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold"
            style={{ marginBottom: '-2px' }}
          >
            {t.compStandings}
          </TabsTrigger>
          <TabsTrigger
            value="matches"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold"
            style={{ marginBottom: '-2px' }}
          >
            {t.compMatches}
            <span className="ml-1.5 text-[10px] rounded-full px-1.5 py-px" style={{ background: 'var(--bg-hover)' }}>{matches.length}</span>
          </TabsTrigger>
          {hasMyRosters && (
            <TabsTrigger
              value="myMatches"
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold"
              style={{ marginBottom: '-2px' }}
            >
              {t.compMyMatches}
              {myPending.length > 0 && (
                <span className="ml-1.5 text-[10px] font-bold rounded-full px-1.5 py-px" style={{ background: 'var(--accent-gold)', color: 'var(--accent-on)' }}>{myPending.length}</span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger
            value="rosters"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold"
            style={{ marginBottom: '-2px' }}
          >
            {t.compRosters}
            <span className="ml-1.5 text-[10px] rounded-full px-1.5 py-px" style={{ background: 'var(--bg-hover)' }}>{rosters.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* Standings Tab */}
        <TabsContent value="standings" className="mt-4">
          <StandingsTable standings={standings} />
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="mt-4">
          <div className="flex flex-col gap-4">
            {comp.status === 'active' && (
              <div className="flex flex-wrap items-center gap-2">
                {rosters.length >= 2 ? (
                  <>
                    <button className="btn-primary" onClick={() => navigate(`${basePath}/${comp.id}/match/new`)}>
                      + {t.compNewMatch}
                    </button>
                    {isOwner && scheduledMatches.length === 0 && (
                      <button className="btn-secondary" onClick={handleGenerateSchedule}>
                        {t.compGenerateSchedule}
                      </button>
                    )}
                    {isOwner && scheduledMatches.length > 0 && (
                      <button className="btn-secondary" onClick={handleDeleteSchedule}>
                        {t.compDeleteSchedule}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{t.compNeedMoreRosters}</p>
                )}
                {schedulingMsg && <p className="text-sm text-muted-foreground">{schedulingMsg}</p>}
              </div>
            )}
            {matches.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <h3 className="text-base font-semibold text-foreground">{t.compMatchesEmptyTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.compMatchesEmptyDesc}</p>
              </div>
            ) : (
              <>
                {scheduledMatches.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t.compPendingMatches} ({scheduledMatches.length})</h4>
                    <div className="flex flex-col gap-1.5">
                      {scheduledMatches.map(m => renderMatchCard(m, false))}
                    </div>
                  </div>
                )}
                {playedMatches.length > 0 && (
                  <div>
                    {scheduledMatches.length > 0 && (
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t.compPlayedMatches} ({playedMatches.length})</h4>
                    )}
                    <div className="flex flex-col gap-1.5">
                      {playedMatches.map(m => renderMatchCard(m, false))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* My Matches Tab */}
        <TabsContent value="myMatches" className="mt-4">
          <div className="flex flex-col gap-4">
            {myMatches.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <h3 className="text-base font-semibold text-foreground">{t.compNoMyMatches}</h3>
              </div>
            ) : (
              <>
                {myPending.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t.compPendingMatches} ({myPending.length})</h4>
                    <div className="flex flex-col gap-1.5">
                      {myPending.map(m => renderMatchCard(m, true))}
                    </div>
                  </div>
                )}
                {myPlayed.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t.compPlayedMatches} ({myPlayed.length})</h4>
                    <div className="flex flex-col gap-1.5">
                      {myPlayed.map(m => renderMatchCard(m, false))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Rosters Tab */}
        <TabsContent value="rosters" className="mt-4">
          <div className="flex flex-col gap-4">
            {comp.status === 'active' && (
              <div>
                <button className="btn-primary" onClick={() => setShowEnroll(true)}>
                  + {t.compEnrollRoster}
                </button>
              </div>
            )}
            {rosters.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <h3 className="text-base font-semibold text-foreground">{t.compRostersEmptyTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.compRostersEmptyDesc}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {rosters.map(r => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:brightness-110"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-full text-foreground font-bold text-sm shrink-0"
                      style={{ background: 'var(--bg-hover)' }}
                    >
                      {r.teamName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="text-foreground block truncate text-sm">{r.name}</strong>
                      <span className="text-xs text-muted-foreground">{r.teamName} &middot; {r.coachName || '-'}</span>
                      <span className="text-xs text-muted-foreground block">{r.playerCount} {t.playersCount} &middot; TV {Math.round(r.teamValue)}k</span>
                    </div>
                    {(isOwner || r.userId === user.id) && (
                      <button
                        className="text-muted-foreground hover:text-destructive text-base leading-none px-1 shrink-0 transition-colors"
                        onClick={e => { e.stopPropagation(); handleRemoveRoster(r.id); }}
                        title={t.remove}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {showEnroll && (
        <EnrollRosterModal
          enrolledRosters={rosters}
          onEnroll={handleEnroll}
          onClose={() => setShowEnroll(false)}
        />
      )}
    </div>
  );
}
