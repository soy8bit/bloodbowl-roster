import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCompetitions } from '../../hooks/useCompetitions';
import { useLang } from '../../i18n';
import { calcMatchPlayerSPP } from '../../utils/competitionUtils';
import AppTooltip from '../AppTooltip';
import type { CompetitionMatch, CompetitionMatchPlayer, CompetitionType } from '../../types';

interface Props {
  type: CompetitionType;
}

export default function CompetitionMatchDetail({ type }: Props) {
  const { id: compId, matchId } = useParams<{ id: string; matchId: string }>();
  const { user } = useAuth();
  const api = useCompetitions();
  const { t } = useLang();
  const navigate = useNavigate();
  const basePath = type === 'league' ? '/leagues' : '/tournaments';

  const [match, setMatch] = useState<CompetitionMatch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (compId && matchId && user) {
      setLoading(true);
      api.fetchMatch(compId, matchId).then(m => {
        setMatch(m);
        setLoading(false);
      });
    }
  }, [compId, matchId, user]);

  const handleDelete = async () => {
    if (!compId || !matchId) return;
    if (!confirm(t.compDeleteMatchConfirm)) return;
    await api.deleteMatch(compId, matchId);
    navigate(`${basePath}/${compId}`);
  };

  if (!user) return <div className="competition-page"><p className="comp-empty-state">{t.compLoginRequired}</p></div>;
  if (loading) return <div className="competition-page"><p className="comp-loading-msg">{t.compLoading}</p></div>;
  if (!match) return <div className="competition-page"><p className="comp-error-msg">{t.compNotFound}</p></div>;

  const { data } = match;

  const renderTeamTable = (label: string, players: CompetitionMatchPlayer[]) => (
    <div className="comp-match-detail-team">
      <h4>{label}</h4>
      <div className="overflow-x-auto">
        <table className="comp-match-detail-table">
          <thead>
            <tr>
              <th>{t.name}</th>
              <th>{t.position}</th>
              <th><AppTooltip content={t.tipTD}><span tabIndex={0} className="cursor-help">{t.matchTD}</span></AppTooltip></th>
              <th><AppTooltip content={t.tipCAS}><span tabIndex={0} className="cursor-help">{t.matchCAS}</span></AppTooltip></th>
              <th><AppTooltip content={t.tipCP}><span tabIndex={0} className="cursor-help">{t.matchCP}</span></AppTooltip></th>
              <th><AppTooltip content={t.tipINT}><span tabIndex={0} className="cursor-help">{t.matchINT}</span></AppTooltip></th>
              <th><AppTooltip content={t.tipDEF}><span tabIndex={0} className="cursor-help">{t.matchDEF}</span></AppTooltip></th>
              <th><AppTooltip content={t.tipMVP}><span tabIndex={0} className="cursor-help">{t.matchMVP}</span></AppTooltip></th>
              <th>{t.compPostMatchStatus}</th>
              <th><AppTooltip content={t.tipSPP}><span tabIndex={0} className="cursor-help">{t.matchSPP}</span></AppTooltip></th>
            </tr>
          </thead>
          <tbody>
            {players.map(p => (
              <tr key={p.uid} className={p.postMatchStatus !== 'ok' ? `pms-row-${p.postMatchStatus}` : ''}>
                <td>{p.name}</td>
                <td>{p.position}</td>
                <td>{p.tds || ''}</td>
                <td>{p.cas || ''}</td>
                <td>{p.cp || ''}</td>
                <td>{p.int || ''}</td>
                <td>{p.def || ''}</td>
                <td>{p.mvp ? 'MVP' : ''}</td>
                <td className={`pms-${p.postMatchStatus}`}>
                  {(t[`compPMS_${p.postMatchStatus}` as keyof typeof t] as string)}
                  {p.postMatchStatus === 'si' && p.injuryDetail && ` (${t[`compInjury_${p.injuryDetail}` as keyof typeof t]})`}
                </td>
                <td>{calcMatchPlayerSPP(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="competition-page comp-match-detail">
      <button className="btn-back" onClick={() => navigate(`${basePath}/${compId}`)}>&larr; {t.back}</button>

      <div className="comp-match-detail-header">
        <div className="comp-match-detail-score">
          <span className="detail-team-name">{data.homeTeam.name}</span>
          <span className="detail-score">{data.homeScore} - {data.awayScore}</span>
          <span className="detail-team-name">{data.awayTeam.name}</span>
        </div>
        <div className="comp-match-detail-meta">
          {match.round && <span>{t.matchRound}: {match.round}</span>}
          <span>{data.date}</span>
        </div>
      </div>

      {data.notes && <p className="comp-match-notes">{data.notes}</p>}

      {renderTeamTable(`${data.homeTeam.name} (${data.homeTeam.race})`, data.homeTeam.players)}
      {renderTeamTable(`${data.awayTeam.name} (${data.awayTeam.race})`, data.awayTeam.players)}

      <div className="comp-match-detail-actions">
        <button className="btn-danger" onClick={handleDelete}>{t.matchDelete}</button>
      </div>
    </div>
  );
}
