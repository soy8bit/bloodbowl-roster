import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMatches } from '../../hooks/useMatches';
import { useLang } from '../../i18n';
import type { MatchSummary } from '../../types';

export default function MatchesPage() {
  const { user } = useAuth();
  const { matches, loading, error, fetchMatches, deleteMatch } = useMatches();
  const { t } = useLang();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [compFilter, setCompFilter] = useState('');

  useEffect(() => {
    if (user) fetchMatches();
  }, [user, fetchMatches]);

  const competitions = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => { if (m.competition) set.add(m.competition); });
    return Array.from(set).sort();
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (!compFilter) return matches;
    return matches.filter((m) => m.competition === compFilter);
  }, [matches, compFilter]);

  if (!user) {
    return (
      <div className="matches-page">
        <h2 className="matches-title">{t.matchesTitle}</h2>
        <div className="matches-empty">
          <p>{t.matchLoginRequired}</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>
            {t.navLogin}
          </button>
        </div>
      </div>
    );
  }

  const handleDelete = async (m: MatchSummary) => {
    const label = `${m.homeTeamName} vs ${m.awayTeamName}`;
    if (!window.confirm(t.matchDeleteConfirm(label))) return;
    setDeleting(m.id);
    await deleteMatch(m.id);
    setDeleting(null);
  };

  return (
    <div className="matches-page">
      <div className="matches-header">
        <h2 className="matches-title">{t.matchesTitle}</h2>
        <button className="btn-primary" onClick={() => navigate('/matches/new')}>
          + {t.newMatch}
        </button>
      </div>

      {error && <div className="matches-error">{error}</div>}

      {loading && <div className="matches-loading">...</div>}

      {!loading && matches.length === 0 && (
        <div className="matches-empty">
          <p>{t.matchNoMatches}</p>
          <p className="matches-empty-hint">{t.matchCreateFirst}</p>
        </div>
      )}

      {competitions.length > 0 && (
        <div className="match-stats-controls">
          <select value={compFilter} onChange={(e) => setCompFilter(e.target.value)} className="match-stats-filter">
            <option value="">{t.matchStatsAll}</option>
            {competitions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      <div className="matches-list">
        {filteredMatches.map((m) => (
          <div
            key={m.id}
            className="match-card"
            onClick={() => navigate(`/matches/${m.id}`)}
          >
            <div className="match-card-date">
              {m.date}
              {m.competition && <span className="match-card-comp">{m.competition}</span>}
              {m.round && <span className="match-card-round">{m.round}</span>}
            </div>
            <div className="match-card-score">
              <span className="match-card-team">{m.homeTeamName}</span>
              <span className="match-card-result">
                {m.homeScore} - {m.awayScore}
              </span>
              <span className="match-card-team">{m.awayTeamName}</span>
            </div>
            <button
              className="match-card-delete"
              onClick={(e) => { e.stopPropagation(); handleDelete(m); }}
              disabled={deleting === m.id}
              title={t.matchDelete}
            >
              {deleting === m.id ? '...' : '×'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
