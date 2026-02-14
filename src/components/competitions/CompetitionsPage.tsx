import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCompetitions } from '../../hooks/useCompetitions';
import { useLang } from '../../i18n';
import { Badge } from '../ui/badge';
import type { CompetitionType } from '../../types';

interface Props {
  type: CompetitionType;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function CompetitionsPage({ type }: Props) {
  const { user } = useAuth();
  const { competitions, loading, error, fetchCompetitions, createCompetition, deleteCompetition, joinCompetition } = useCompetitions();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState('');

  useEffect(() => {
    if (user) fetchCompetitions();
  }, [user]);

  const filtered = competitions.filter(c => c.type === type);
  const basePath = type === 'league' ? '/leagues' : '/tournaments';
  const typeLabel = type === 'league'
    ? (lang === 'es' ? 'liga' : 'league')
    : (lang === 'es' ? 'torneo' : 'tournament');

  if (!user) {
    return (
      <div className="competition-page">
        <div className="comp-page-header">
          <h2>{type === 'league' ? t.compLeagues : t.compTournaments}</h2>
        </div>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="text-4xl">{type === 'league' ? '🏆' : '⚔️'}</div>
          <h3 className="text-lg font-semibold text-foreground">{t.compLoginTitle}</h3>
          <p className="text-muted-foreground">{t.compLoginDescription}</p>
        </div>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const id = generateId();
    const ok = await createCompetition(id, name.trim(), type);
    if (ok) {
      setName('');
      setShowCreate(false);
      await fetchCompetitions();
    }
    setCreating(false);
  };

  const handleDelete = async (id: string, compName: string) => {
    if (!confirm(t.compDeleteConfirm(compName))) return;
    await deleteCompetition(id);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinMsg('');
    const result = await joinCompetition(joinCode.trim());
    if (result) {
      if (result.alreadyMember) {
        setJoinMsg(t.compJoinAlready);
      } else {
        setJoinMsg(t.compJoinSuccess(result.name));
        await fetchCompetitions();
      }
      setJoinCode('');
      setTimeout(() => {
        const path = result.type === 'tournament' ? '/tournaments' : '/leagues';
        navigate(`${path}/${result.id}`);
      }, 800);
    } else {
      setJoinMsg(t.compJoinInvalid);
    }
    setJoining(false);
  };

  const active = filtered.filter(c => c.status === 'active');
  const finished = filtered.filter(c => c.status !== 'active');

  const renderCompCard = (c: typeof filtered[0], isFinished: boolean) => (
    <div
      key={c.id}
      className={`cursor-pointer rounded-lg border-l-4 p-4 transition-colors hover:brightness-110 ${
        isFinished ? 'border-l-muted-foreground opacity-75' : ''
      }`}
      style={{ background: 'var(--bg-secondary)', borderLeftColor: isFinished ? undefined : 'var(--accent-gold)' }}
      onClick={() => navigate(`${basePath}/${c.id}`)}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground leading-tight text-sm">{c.name}</h3>
          <Badge variant={isFinished ? 'secondary' : 'success'} className="shrink-0">
            {isFinished
              ? (c.status === 'finished' ? t.compStatusFinished : t.compStatusArchived)
              : t.compStatusActive
            }
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex flex-col items-center">
            <span className="font-bold" style={{ color: 'var(--accent-gold)' }}>{c.rosterCount}</span>
            <span className="text-xs text-muted-foreground">{t.compSummaryRosters}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold" style={{ color: 'var(--accent-gold)' }}>{c.matchCount || 0}</span>
            <span className="text-xs text-muted-foreground">{t.compSummaryMatches}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {c.role === 'owner' ? t.compOwner : t.compMember}
            </Badge>
            <span>{t.compCreatedAt}: {formatDate(c.createdAt)}</span>
          </div>
          {c.role === 'owner' && (
            <button
              className="text-muted-foreground hover:text-destructive text-lg leading-none px-1 transition-colors"
              onClick={e => { e.stopPropagation(); handleDelete(c.id, c.name); }}
              title={t.compDeleteComp}
            >
              &times;
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="competition-page">
      <div className="comp-page-header">
        <h2>{type === 'league' ? t.compLeagues : t.compTournaments}</h2>
        <div className="comp-page-header-actions">
          {!showJoin && (
            <button className="btn-secondary" onClick={() => { setShowJoin(true); setShowCreate(false); }}>
              {t.compJoin}
            </button>
          )}
          {!showCreate && (
            <button className="btn-primary" onClick={() => { setShowCreate(true); setShowJoin(false); }}>
              + {t.compCreate}
            </button>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="mt-3 rounded-lg p-4" style={{ background: 'var(--bg-secondary)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-foreground text-sm">{t.compCreate} {typeLabel}</span>
            <button className="text-muted-foreground hover:text-foreground text-lg leading-none transition-colors" onClick={() => { setShowCreate(false); setName(''); }}>&times;</button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t.compNamePlaceholder}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              maxLength={80}
              autoFocus
              className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              style={{ background: 'var(--bg-input)' }}
            />
            <button className="btn-primary" onClick={handleCreate} disabled={creating || !name.trim()}>
              {creating ? t.compLoading : t.compCreate}
            </button>
          </div>
        </div>
      )}

      {showJoin && (
        <div className="mt-3 rounded-lg p-4" style={{ background: 'var(--bg-secondary)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-foreground text-sm">{t.compJoinCode}</span>
            <button className="text-muted-foreground hover:text-foreground text-lg leading-none transition-colors" onClick={() => { setShowJoin(false); setJoinCode(''); setJoinMsg(''); }}>&times;</button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t.compJoinCodePlaceholder}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={20}
              autoFocus
              className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              style={{ background: 'var(--bg-input)' }}
            />
            <button className="btn-primary" onClick={handleJoin} disabled={joining || !joinCode.trim()}>
              {joining ? t.compLoading : t.compJoin}
            </button>
          </div>
          {joinMsg && <p className="text-sm text-muted-foreground mt-2">{joinMsg}</p>}
        </div>
      )}

      {error && <p className="comp-error-msg">{error}</p>}
      {loading && <p className="comp-loading-msg">{t.compLoading}</p>}

      {!loading && filtered.length === 0 && !showCreate && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="text-4xl">{type === 'league' ? '🏆' : '⚔️'}</div>
          <h3 className="text-lg font-semibold text-foreground">{t.compEmptyTitle(typeLabel)}</h3>
          <p className="text-muted-foreground">{t.compEmptyDescription(typeLabel)}</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + {t.compEmptyCreate(typeLabel)}
          </button>
        </div>
      )}

      {active.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            {t.compStatusActive} ({active.length})
          </div>
          <div className="flex flex-col gap-2">
            {active.map(c => renderCompCard(c, false))}
          </div>
        </div>
      )}

      {finished.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" />
            {t.compStatusFinished} ({finished.length})
          </div>
          <div className="flex flex-col gap-2">
            {finished.map(c => renderCompCard(c, true))}
          </div>
        </div>
      )}
    </div>
  );
}
