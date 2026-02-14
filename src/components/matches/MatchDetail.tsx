import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMatches } from '../../hooks/useMatches';
import { useLang } from '../../i18n';
import { exportMatchPdf } from '../../utils/matchPdfExport';
import type { MatchReport, MatchPlayer } from '../../types';

function calcSPP(p: MatchPlayer): number {
  return p.tds * 3 + p.cas * 2 + (p.cp || 0) * 1 + (p.int || 0) * 2 + (p.def || 0) * 1 + (p.mvp ? 4 : 0);
}

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { fetchMatch, deleteMatch, shareMatch, unshareMatch, loading, error } = useMatches();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchReport | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    fetchMatch(id).then((m) => { if (m) setMatch(m); });
  }, [user, id, fetchMatch]);

  if (!user) {
    return (
      <div className="matches-page">
        <p>{t.matchLoginRequired}</p>
        <button className="btn-primary" onClick={() => navigate('/login')}>{t.navLogin}</button>
      </div>
    );
  }

  if (loading && !match) return <div className="matches-page"><div className="matches-loading">...</div></div>;
  if (error && !match) return <div className="matches-page"><div className="matches-error">{error}</div></div>;
  if (!match) return <div className="matches-page"><div className="matches-error">Match not found</div></div>;

  const handleDelete = async () => {
    const label = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
    if (!window.confirm(t.matchDeleteConfirm(label))) return;
    const ok = await deleteMatch(match.id);
    if (ok) navigate('/matches');
  };

  const handleShare = async () => {
    if (match.shareId) {
      const ok = await unshareMatch(match.id);
      if (ok) {
        const { shareId: _, ...rest } = match;
        setMatch(rest as MatchReport);
      }
    } else {
      const shareId = await shareMatch(match.id);
      if (shareId) {
        setMatch({ ...match, shareId });
      }
    }
  };

  const renderTeamTable = (team: typeof match.homeTeam, label: string) => {
    const totalSPP = team.players.reduce((s, p) => s + calcSPP(p), 0);
    return (
      <div className="match-detail-team">
        <h3 className="match-detail-team-title">{label}: {team.name} <span className="match-detail-race">({team.race})</span></h3>
        {team.coach && <div className="match-detail-coach">{t.coach}: {team.coach}</div>}
        <div className="match-events-table-wrap">
          <table className="match-events-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t.name}</th>
                <th>{t.position}</th>
                <th title={t.tipTD}>{t.matchTD}</th>
                <th title={t.tipCAS}>{t.matchCAS}</th>
                <th title={t.tipCP}>{t.matchCP}</th>
                <th title={t.tipINT}>{t.matchINT}</th>
                <th title={t.tipDEF}>{t.matchDEF}</th>
                <th title={t.tipMVP}>{t.matchMVP}</th>
                <th title={t.tipSPP}>{t.matchSPP}</th>
              </tr>
            </thead>
            <tbody>
              {team.players.map((p, i) => (
                <tr key={p.uid} className={p.tds > 0 || p.cas > 0 || (p.cp || 0) > 0 || (p.int || 0) > 0 || (p.def || 0) > 0 || p.mvp ? 'match-highlight-row' : ''}>
                  <td className="center muted">{i + 1}</td>
                  <td>{p.name}</td>
                  <td className="muted">{p.position}</td>
                  <td className="center">{p.tds || '-'}</td>
                  <td className="center">{p.cas || '-'}</td>
                  <td className="center">{(p.cp || 0) || '-'}</td>
                  <td className="center">{(p.int || 0) || '-'}</td>
                  <td className="center">{(p.def || 0) || '-'}</td>
                  <td className="center">{p.mvp ? '\u2605' : '-'}</td>
                  <td className="center match-spp-cell">{calcSPP(p) || '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td></td>
                <td><strong>{t.matchTotal}</strong></td>
                <td></td>
                <td className="center">{team.players.reduce((s, p) => s + p.tds, 0)}</td>
                <td className="center">{team.players.reduce((s, p) => s + p.cas, 0)}</td>
                <td className="center">{team.players.reduce((s, p) => s + (p.cp || 0), 0)}</td>
                <td className="center">{team.players.reduce((s, p) => s + (p.int || 0), 0)}</td>
                <td className="center">{team.players.reduce((s, p) => s + (p.def || 0), 0)}</td>
                <td className="center">{team.players.filter(p => p.mvp).length}</td>
                <td className="center match-spp-cell"><strong>{totalSPP}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="matches-page">
      <div className="match-detail">
        <div className="match-detail-header">
          {match.competition && <span className="match-detail-comp">{match.competition}</span>}
          {match.round && <span className="match-detail-round">{match.round}</span>}
          <span className="match-detail-date">{match.date}</span>
        </div>

        <div className="match-detail-scoreboard">
          <div className="match-detail-side">
            <div className="match-detail-team-name">{match.homeTeam.name}</div>
            <div className="match-detail-team-race">{match.homeTeam.race}</div>
          </div>
          <div className="match-detail-big-score">
            {match.homeScore} - {match.awayScore}
          </div>
          <div className="match-detail-side">
            <div className="match-detail-team-name">{match.awayTeam.name}</div>
            <div className="match-detail-team-race">{match.awayTeam.race}</div>
          </div>
        </div>

        {renderTeamTable(match.homeTeam, t.matchHomeTeam)}
        {renderTeamTable(match.awayTeam, t.matchAwayTeam)}

        {match.notes && (
          <div className="match-detail-notes">
            <strong>{t.matchNotes}:</strong> {match.notes}
          </div>
        )}

        {match.shareId && (
          <div className="match-detail-share-link">
            <strong>{t.matchShareLink}:</strong>{' '}
            <input
              readOnly
              value={`${window.location.origin}/matches/shared/${match.shareId}`}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="match-share-input"
            />
          </div>
        )}

        <div className="match-detail-actions">
          <button className="btn-secondary" onClick={() => navigate('/matches')}>
            {t.matchBackToList}
          </button>
          <button className="btn-secondary" onClick={() => navigate(`/matches/new?edit=${match.id}`)}>
            {t.matchEditBtn}
          </button>
          <button className="btn-secondary" onClick={handleShare}>
            {match.shareId ? t.matchUnshare : t.matchShare}
          </button>
          <button className="btn-primary" onClick={() => exportMatchPdf(match, lang)}>
            {t.matchExportPdf}
          </button>
          <button className="btn-danger" onClick={handleDelete}>
            {t.matchDelete}
          </button>
        </div>
      </div>
    </div>
  );
}
