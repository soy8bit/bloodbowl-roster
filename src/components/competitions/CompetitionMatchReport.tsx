import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCompetitions } from '../../hooks/useCompetitions';
import { useLang } from '../../i18n';
import { calcMatchPlayerSPP } from '../../utils/competitionUtils';
import AppTooltip from '../AppTooltip';
import type {
  CompetitionRoster,
  CompetitionMatchPlayer,
  CompetitionMatchData,
  CompetitionMatch,
  PostMatchStatus,
  PlayerInjury,
  CompetitionType,
} from '../../types';

interface Props {
  type: CompetitionType;
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const POST_MATCH_STATUSES: PostMatchStatus[] = ['ok', 'ko', 'bh', 'si', 'dead', 'mng'];
const INJURY_TYPES: PlayerInjury['type'][] = ['niggle', 'MA', 'AV', 'AG', 'PA', 'ST'];

export default function CompetitionMatchReport({ type }: Props) {
  const { id: compId, matchId } = useParams<{ id: string; matchId: string }>();
  const { user } = useAuth();
  const api = useCompetitions();
  const { t } = useLang();
  const navigate = useNavigate();
  const basePath = type === 'league' ? '/leagues' : '/tournaments';

  const [step, setStep] = useState(1);
  const [match, setMatch] = useState<CompetitionMatch | null>(null);
  const [homeRoster, setHomeRoster] = useState<CompetitionRoster | null>(null);
  const [awayRoster, setAwayRoster] = useState<CompetitionRoster | null>(null);
  const [date, setDate] = useState(getTodayStr());
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [notes, setNotes] = useState('');
  const [homePlayers, setHomePlayers] = useState<CompetitionMatchPlayer[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<CompetitionMatchPlayer[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState(true);

  useEffect(() => {
    if (!compId || !matchId || !user) return;
    (async () => {
      setLoadingMatch(true);
      const matchData = await api.fetchMatch(compId, matchId);
      if (!matchData || matchData.status !== 'scheduled') {
        setLoadingMatch(false);
        return;
      }
      setMatch(matchData);

      const [homeR, awayR] = await Promise.all([
        api.fetchRoster(compId, matchData.homeRosterId),
        api.fetchRoster(compId, matchData.awayRosterId),
      ]);
      setHomeRoster(homeR);
      setAwayRoster(awayR);

      if (homeR) {
        setHomePlayers(homeR.data.players.filter(p => !p.dead).map(p => ({
          uid: p.uid,
          name: p.name,
          position: p.position,
          tds: 0, cas: 0, cp: 0, int: 0, def: 0,
          mvp: false,
          postMatchStatus: 'ok' as PostMatchStatus,
        })));
      }
      if (awayR) {
        setAwayPlayers(awayR.data.players.filter(p => !p.dead).map(p => ({
          uid: p.uid,
          name: p.name,
          position: p.position,
          tds: 0, cas: 0, cp: 0, int: 0, def: 0,
          mvp: false,
          postMatchStatus: 'ok' as PostMatchStatus,
        })));
      }
      setLoadingMatch(false);
    })();
  }, [compId, matchId, user]);

  const updatePlayer = (side: 'home' | 'away', uid: string, field: string, value: any) => {
    const setter = side === 'home' ? setHomePlayers : setAwayPlayers;
    setter(prev => prev.map(p => {
      if (p.uid !== uid) return p;
      if (field === 'mvp') return { ...p, mvp: value };
      return { ...p, [field]: value };
    }).map(p => {
      if (field === 'mvp' && value && p.uid !== uid) return { ...p, mvp: false };
      return p;
    }));
  };

  const homeTdSum = homePlayers.reduce((s, p) => s + p.tds, 0);
  const awayTdSum = awayPlayers.reduce((s, p) => s + p.tds, 0);
  const homeTdWarning = homeTdSum !== homeScore;
  const awayTdWarning = awayTdSum !== awayScore;

  const handleSave = async () => {
    if (!compId || !matchId || !match) return;
    setSaving(true);

    const matchData: CompetitionMatchData = {
      date,
      homeTeam: {
        rosterId: match.homeRosterId,
        name: homeRoster?.name || '',
        coach: homeRoster?.coachName || '',
        race: homeRoster?.teamName || '',
        players: homePlayers,
      },
      awayTeam: {
        rosterId: match.awayRosterId,
        name: awayRoster?.name || '',
        coach: awayRoster?.coachName || '',
        race: awayRoster?.teamName || '',
        players: awayPlayers,
      },
      homeScore,
      awayScore,
      notes: notes || undefined,
    };

    const ok = await api.reportMatch(compId, matchId, matchData);
    if (ok) {
      navigate(`${basePath}/${compId}`);
    }
    setSaving(false);
  };

  const renderPlayerTable = (
    players: CompetitionMatchPlayer[],
    side: 'home' | 'away',
    rosterData: CompetitionRoster | null,
  ) => (
    <div className="comp-match-player-table">
      <h4>{side === 'home' ? t.matchHomeTeam : t.matchAwayTeam}: {rosterData?.name}</h4>
      <div className="comp-match-players-scroll">
        <table>
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
            {players.map(p => {
              const rosterPlayer = rosterData?.data.players.find(rp => rp.uid === p.uid);
              const hasMNG = rosterPlayer?.missNextGame;
              return (
                <tr key={p.uid} className={hasMNG ? 'player-mng' : ''}>
                  <td className="player-name-cell">
                    {p.name}
                    {hasMNG && (
                      <AppTooltip content="Miss Next Game">
                        <span tabIndex={0} className="mng-badge cursor-help">MNG</span>
                      </AppTooltip>
                    )}
                  </td>
                  <td>{p.position}</td>
                  <td><input type="number" min={0} value={p.tds} onChange={e => updatePlayer(side, p.uid, 'tds', Math.max(0, +e.target.value || 0))} /></td>
                  <td><input type="number" min={0} value={p.cas} onChange={e => updatePlayer(side, p.uid, 'cas', Math.max(0, +e.target.value || 0))} /></td>
                  <td><input type="number" min={0} value={p.cp} onChange={e => updatePlayer(side, p.uid, 'cp', Math.max(0, +e.target.value || 0))} /></td>
                  <td><input type="number" min={0} value={p.int} onChange={e => updatePlayer(side, p.uid, 'int', Math.max(0, +e.target.value || 0))} /></td>
                  <td><input type="number" min={0} value={p.def} onChange={e => updatePlayer(side, p.uid, 'def', Math.max(0, +e.target.value || 0))} /></td>
                  <td>
                    <input
                      type="checkbox"
                      checked={p.mvp}
                      onChange={e => updatePlayer(side, p.uid, 'mvp', e.target.checked)}
                    />
                  </td>
                  <td>
                    <select
                      value={p.postMatchStatus}
                      onChange={e => updatePlayer(side, p.uid, 'postMatchStatus', e.target.value)}
                      className={`post-match-select status-${p.postMatchStatus}`}
                    >
                      {POST_MATCH_STATUSES.map(s => (
                        <option key={s} value={s}>{t[`compPMS_${s}` as keyof typeof t] as string}</option>
                      ))}
                    </select>
                    {p.postMatchStatus === 'si' && (
                      <select
                        value={p.injuryDetail || 'niggle'}
                        onChange={e => updatePlayer(side, p.uid, 'injuryDetail', e.target.value)}
                        className="injury-detail-select"
                      >
                        {INJURY_TYPES.map(it => (
                          <option key={it} value={it}>{t[`compInjury_${it}` as keyof typeof t] as string}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="spp-cell">{calcMatchPlayerSPP(p)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (!user) return <div className="competition-page"><p className="comp-empty-state">{t.compLoginRequired}</p></div>;

  if (loadingMatch) return <div className="competition-page"><p className="comp-loading-msg">{t.compLoading}</p></div>;

  if (!match || match.status !== 'scheduled') {
    return (
      <div className="competition-page">
        <button className="btn-back" onClick={() => navigate(`${basePath}/${compId}`)}>&larr; {t.back}</button>
        <p className="comp-error-msg">{t.compNotFound}</p>
      </div>
    );
  }

  return (
    <div className="competition-page comp-match-wizard">
      <button className="btn-back" onClick={() => navigate(`${basePath}/${compId}`)}>&larr; {t.back}</button>
      <h2>{t.compReportMatch}</h2>

      <div className="wizard-review-score" style={{ marginBottom: '1.5rem' }}>
        <span>{homeRoster?.name} ({homeRoster?.teamName})</span>
        <span className="comp-match-vs">vs</span>
        <span>{awayRoster?.name} ({awayRoster?.teamName})</span>
      </div>

      <div className="wizard-steps">
        <span className={`wizard-step ${step >= 1 ? 'active' : ''}`}>1. {t.matchStep1}</span>
        <span className={`wizard-step ${step >= 2 ? 'active' : ''}`}>2. {t.compMatchStep2}</span>
        <span className={`wizard-step ${step >= 3 ? 'active' : ''}`}>3. {t.compMatchStep3}</span>
      </div>

      {step === 1 && (
        <div className="wizard-content">
          <div className="wizard-match-info">
            <div className="wizard-field">
              <label>{t.matchDate}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          <div className="wizard-score">
            <label>{t.matchScore}</label>
            <div className="wizard-score-inputs">
              <input type="number" min={0} value={homeScore} onChange={e => setHomeScore(Math.max(0, +e.target.value || 0))} />
              <span>-</span>
              <input type="number" min={0} value={awayScore} onChange={e => setAwayScore(Math.max(0, +e.target.value || 0))} />
            </div>
          </div>

          <div className="wizard-field">
            <label>{t.matchNotes}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="wizard-nav">
            <button className="btn-primary" onClick={() => setStep(2)} disabled={!date}>
              {t.matchNext}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wizard-content">
          {renderPlayerTable(homePlayers, 'home', homeRoster)}
          {homeTdWarning && (
            <p className="td-warning">{t.matchTdWarning(homeRoster?.name || 'Home', homeTdSum, homeScore)}</p>
          )}
          {renderPlayerTable(awayPlayers, 'away', awayRoster)}
          {awayTdWarning && (
            <p className="td-warning">{t.matchTdWarning(awayRoster?.name || 'Away', awayTdSum, awayScore)}</p>
          )}

          <div className="wizard-nav">
            <button className="btn-secondary" onClick={() => setStep(1)}>{t.matchPrevious}</button>
            <button className="btn-primary" onClick={() => setStep(3)}>{t.matchNext}</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="wizard-content">
          <h3>{t.matchReview}</h3>

          <div className="wizard-review-score">
            <span>{homeRoster?.name}</span>
            <span className="review-score">{homeScore} - {awayScore}</span>
            <span>{awayRoster?.name}</span>
          </div>

          <div className="wizard-review-section">
            <h4>{homeRoster?.name}</h4>
            <table className="review-table">
              <thead>
                <tr>
                  <th>{t.name}</th>
                  <th><AppTooltip content={t.tipSPP}><span tabIndex={0} className="cursor-help">{t.matchSPP}</span></AppTooltip></th>
                  <th>{t.compPostMatchStatus}</th>
                </tr>
              </thead>
              <tbody>
                {homePlayers.filter(p => calcMatchPlayerSPP(p) > 0 || p.postMatchStatus !== 'ok').map(p => (
                  <tr key={p.uid}>
                    <td>{p.name}</td>
                    <td>{calcMatchPlayerSPP(p)}</td>
                    <td className={`pms-${p.postMatchStatus}`}>
                      {(t[`compPMS_${p.postMatchStatus}` as keyof typeof t] as string)}
                      {p.postMatchStatus === 'si' && ` (${t[`compInjury_${p.injuryDetail || 'niggle'}` as keyof typeof t]})`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="wizard-review-section">
            <h4>{awayRoster?.name}</h4>
            <table className="review-table">
              <thead>
                <tr>
                  <th>{t.name}</th>
                  <th><AppTooltip content={t.tipSPP}><span tabIndex={0} className="cursor-help">{t.matchSPP}</span></AppTooltip></th>
                  <th>{t.compPostMatchStatus}</th>
                </tr>
              </thead>
              <tbody>
                {awayPlayers.filter(p => calcMatchPlayerSPP(p) > 0 || p.postMatchStatus !== 'ok').map(p => (
                  <tr key={p.uid}>
                    <td>{p.name}</td>
                    <td>{calcMatchPlayerSPP(p)}</td>
                    <td className={`pms-${p.postMatchStatus}`}>
                      {(t[`compPMS_${p.postMatchStatus}` as keyof typeof t] as string)}
                      {p.postMatchStatus === 'si' && ` (${t[`compInjury_${p.injuryDetail || 'niggle'}` as keyof typeof t]})`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="wizard-nav">
            <button className="btn-secondary" onClick={() => setStep(2)}>{t.matchPrevious}</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? t.matchSaving : t.matchSave}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
