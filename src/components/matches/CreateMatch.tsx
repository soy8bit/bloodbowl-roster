import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMatches } from '../../hooks/useMatches';
import { useLang } from '../../i18n';
import type { Roster, MatchReport, MatchPlayer, MatchTeam } from '../../types';

const ROSTERS_KEY = 'bb_rosters';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function calcSPP(p: MatchPlayer): number {
  return p.tds * 3 + p.cas * 2 + p.cp * 1 + p.int * 2 + p.def * 1 + (p.mvp ? 4 : 0);
}

function loadRosters(): Record<string, Roster> {
  try {
    const raw = localStorage.getItem(ROSTERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function updateRosterSPP(rosterId: string, players: MatchPlayer[]) {
  try {
    const raw = localStorage.getItem(ROSTERS_KEY);
    if (!raw) return;
    const allRosters: Record<string, Roster> = JSON.parse(raw);
    const roster = allRosters[rosterId];
    if (!roster) return;

    let changed = false;
    for (const mp of players) {
      const rp = roster.players.find((p) => p.uid === mp.uid);
      if (!rp) continue;
      const hasSPP = mp.tds > 0 || mp.cas > 0 || mp.cp > 0 || mp.int > 0 || mp.def > 0 || mp.mvp;
      if (!hasSPP) continue;

      const spp = rp.spp || { cp: 0, td: 0, def: 0, int: 0, bh: 0, si: 0, kill: 0, mvp: 0 };
      spp.td += mp.tds;
      spp.cp += mp.cp;
      spp.int += mp.int;
      spp.def += mp.def;
      // cas maps to bh (casualty = badly hurt equivalent for SPP)
      spp.bh += mp.cas;
      if (mp.mvp) spp.mvp += 1;
      rp.spp = spp;
      changed = true;
    }

    if (changed) {
      roster.updatedAt = Date.now();
      allRosters[rosterId] = roster;
      localStorage.setItem(ROSTERS_KEY, JSON.stringify(allRosters));
    }
  } catch {}
}

export default function CreateMatch() {
  const { user } = useAuth();
  const { createMatch, updateMatch, fetchMatch } = useMatches();
  const { t } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [step, setStep] = useState(1);
  const [homeRosterId, setHomeRosterId] = useState('');
  const [awayRosterId, setAwayRosterId] = useState('');
  const [date, setDate] = useState(getTodayStr());
  const [round, setRound] = useState('');
  const [competition, setCompetition] = useState('');
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [notes, setNotes] = useState('');
  const [homePlayers, setHomePlayers] = useState<MatchPlayer[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<MatchPlayer[]>([]);
  const [saving, setSaving] = useState(false);
  const [editLoaded, setEditLoaded] = useState(false);

  const rosters = useMemo(() => loadRosters(), []);
  const rosterList = useMemo(
    () => Object.values(rosters).sort((a, b) => b.updatedAt - a.updatedAt),
    [rosters],
  );

  // Load existing match for editing
  useEffect(() => {
    if (!editId || !user || editLoaded) return;
    fetchMatch(editId).then((m) => {
      if (!m) return;
      setHomeRosterId(m.homeTeam.rosterId);
      setAwayRosterId(m.awayTeam.rosterId);
      setDate(m.date);
      setRound(m.round || '');
      setCompetition(m.competition || '');
      setHomeScore(m.homeScore);
      setAwayScore(m.awayScore);
      setNotes(m.notes || '');
      setHomePlayers(m.homeTeam.players);
      setAwayPlayers(m.awayTeam.players);
      setStep(2);
      setEditLoaded(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, user]);

  const homeRoster = homeRosterId ? rosters[homeRosterId] : null;
  const awayRoster = awayRosterId ? rosters[awayRosterId] : null;

  if (!user) {
    return (
      <div className="matches-page">
        <h2 className="matches-title">{t.newMatch}</h2>
        <div className="matches-empty">
          <p>{t.matchLoginRequired}</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>
            {t.navLogin}
          </button>
        </div>
      </div>
    );
  }

  const stepLabels = [t.matchStep1, t.matchStep2, t.matchStep3, t.matchStep4];

  // --- Step 1: Select teams ---
  const initPlayers = (roster: Roster): MatchPlayer[] =>
    roster.players.map((p) => ({
      uid: p.uid,
      name: p.name || p.position,
      position: p.position,
      tds: 0,
      cas: 0,
      cp: 0,
      int: 0,
      def: 0,
      mvp: false,
    }));

  const handleStep1Next = () => {
    if (!homeRosterId || !awayRosterId) return;
    if (homeRosterId === awayRosterId) return;
    setHomePlayers(initPlayers(rosters[homeRosterId]));
    setAwayPlayers(initPlayers(rosters[awayRosterId]));
    setStep(2);
  };

  // --- Step 3: Player events helpers ---
  const updatePlayer = (
    side: 'home' | 'away',
    uid: string,
    field: 'tds' | 'cas' | 'cp' | 'int' | 'def' | 'mvp',
    value: number | boolean,
  ) => {
    const setter = side === 'home' ? setHomePlayers : setAwayPlayers;
    setter((prev) =>
      prev.map((p) => {
        if (field === 'mvp' && value === true) {
          // exclusive: uncheck others
          return p.uid === uid ? { ...p, mvp: true } : { ...p, mvp: false };
        }
        if (p.uid !== uid) return p;
        return { ...p, [field]: value };
      }),
    );
  };

  // --- Step 4: Save ---
  const handleSave = async () => {
    if (!homeRoster || !awayRoster) return;
    setSaving(true);

    const now = Date.now();
    const match: MatchReport = {
      id: editId || generateId(),
      date,
      round: round || undefined,
      competition: competition || undefined,
      homeTeam: {
        rosterId: homeRosterId,
        name: homeRoster.name || homeRoster.teamName,
        coach: homeRoster.coachName || '',
        race: homeRoster.teamName,
        players: homePlayers,
      },
      awayTeam: {
        rosterId: awayRosterId,
        name: awayRoster.name || awayRoster.teamName,
        coach: awayRoster.coachName || '',
        race: awayRoster.teamName,
        players: awayPlayers,
      },
      homeScore,
      awayScore,
      notes: notes || undefined,
      createdAt: now,
      updatedAt: now,
    };

    let ok: boolean;
    if (editId) {
      ok = await updateMatch(editId, match);
    } else {
      ok = await createMatch(match);
      // Auto-update roster SPP only on new match creation
      if (ok) {
        updateRosterSPP(homeRosterId, homePlayers);
        updateRosterSPP(awayRosterId, awayPlayers);
      }
    }
    setSaving(false);
    if (ok) navigate(`/matches/${match.id}`);
  };

  const canStep1 = homeRosterId && awayRosterId && homeRosterId !== awayRosterId;
  const canStep2 = date.length > 0;

  // --- Render ---
  return (
    <div className="matches-page">
      <div className="matches-header">
        <h2 className="matches-title">{editId ? t.matchEdit : t.newMatch}</h2>
      </div>

      {/* Step indicator */}
      <div className="match-wizard-steps">
        {stepLabels.map((label, i) => (
          <div
            key={i}
            className={`match-step-indicator ${i + 1 === step ? 'active' : ''} ${i + 1 < step ? 'done' : ''}`}
          >
            <span className="step-num">{i + 1}</span>
            <span className="step-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="match-wizard">
        {/* STEP 1: Select teams */}
        {step === 1 && (
          <div className="match-wizard-content">
            {rosterList.length === 0 ? (
              <div className="matches-empty">
                <p>{t.matchNoRosters}</p>
                <button className="btn-primary" onClick={() => navigate('/create')}>
                  {t.newTeam}
                </button>
              </div>
            ) : (
              <>
                <div className="match-roster-select">
                  <label>{t.matchHomeTeam}</label>
                  <select
                    value={homeRosterId}
                    onChange={(e) => setHomeRosterId(e.target.value)}
                  >
                    <option value="">{t.matchSelectRoster}</option>
                    {rosterList.map((r) => (
                      <option key={r.id} value={r.id} disabled={r.id === awayRosterId}>
                        {r.name || r.teamName} ({r.teamName}) — {r.players.length} {t.matchPlayers}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="match-roster-select">
                  <label>{t.matchAwayTeam}</label>
                  <select
                    value={awayRosterId}
                    onChange={(e) => setAwayRosterId(e.target.value)}
                  >
                    <option value="">{t.matchSelectRoster}</option>
                    {rosterList.map((r) => (
                      <option key={r.id} value={r.id} disabled={r.id === homeRosterId}>
                        {r.name || r.teamName} ({r.teamName}) — {r.players.length} {t.matchPlayers}
                      </option>
                    ))}
                  </select>
                </div>

                {homeRosterId && awayRosterId && homeRosterId === awayRosterId && (
                  <div className="matches-error">{t.matchSameRosterError}</div>
                )}

                <div className="match-wizard-nav">
                  <button className="btn-secondary" onClick={() => navigate('/matches')}>
                    {t.cancel}
                  </button>
                  <button className="btn-primary" disabled={!canStep1} onClick={handleStep1Next}>
                    {t.matchNext}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 2: Match details */}
        {step === 2 && (
          <div className="match-wizard-content">
            <div className="match-form-group">
              <label>{t.matchDate}</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="match-form-group">
              <label>{t.matchCompetition}</label>
              <input
                type="text"
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
                placeholder={t.matchCompetition}
              />
            </div>
            <div className="match-form-group">
              <label>{t.matchRound}</label>
              <input
                type="text"
                value={round}
                onChange={(e) => setRound(e.target.value)}
                placeholder={t.matchRound}
              />
            </div>
            <div className="match-form-group">
              <label>{t.matchScore}</label>
              <div className="match-score-input">
                <span className="match-score-team">{homeRoster?.name || homeRoster?.teamName}</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={homeScore}
                  onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
                  className="match-score-num"
                />
                <span className="match-score-sep">-</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={awayScore}
                  onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
                  className="match-score-num"
                />
                <span className="match-score-team">{awayRoster?.name || awayRoster?.teamName}</span>
              </div>
            </div>
            <div className="match-form-group">
              <label>{t.matchNotes}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={t.matchNotes}
              />
            </div>
            <div className="match-wizard-nav">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                {t.matchPrevious}
              </button>
              <button className="btn-primary" disabled={!canStep2} onClick={() => setStep(3)}>
                {t.matchNext}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Player events */}
        {step === 3 && (
          <div className="match-wizard-content">
            {(['home', 'away'] as const).map((side) => {
              const players = side === 'home' ? homePlayers : awayPlayers;
              const roster = side === 'home' ? homeRoster : awayRoster;
              const label = side === 'home' ? t.matchHomeTeam : t.matchAwayTeam;
              return (
                <div key={side} className="match-team-events">
                  <h3 className="match-team-events-title">
                    {label}: {roster?.name || roster?.teamName}
                  </h3>
                  <div className="match-events-table-wrap">
                    <table className="match-events-table">
                      <thead>
                        <tr>
                          <th>{t.name}</th>
                          <th>{t.position}</th>
                          <th title={t.tipTD}>{t.matchTD}</th>
                          <th title={t.tipCAS}>{t.matchCAS}</th>
                          <th title={t.tipCP}>{t.matchCP}</th>
                          <th title={t.tipINT}>{t.matchINT}</th>
                          <th title={t.tipDEF}>{t.matchDEF}</th>
                          <th title={t.tipMVP}>{t.matchMVP}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.map((p) => (
                          <tr key={p.uid}>
                            <td className="match-ev-name">{p.name}</td>
                            <td className="match-ev-pos">{p.position}</td>
                            {(['tds', 'cas', 'cp', 'int', 'def'] as const).map((field) => (
                              <td key={field}>
                                <input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={p[field]}
                                  onChange={(e) =>
                                    updatePlayer(side, p.uid, field, Math.max(0, parseInt(e.target.value) || 0))
                                  }
                                  className="match-ev-input"
                                />
                              </td>
                            ))}
                            <td className="match-ev-mvp-cell">
                              <input
                                type="checkbox"
                                checked={p.mvp}
                                onChange={(e) => updatePlayer(side, p.uid, 'mvp', e.target.checked)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            {/* TD vs Score warnings */}
            {(() => {
              const homeTdSum = homePlayers.reduce((s, p) => s + p.tds, 0);
              const awayTdSum = awayPlayers.reduce((s, p) => s + p.tds, 0);
              const warnings: string[] = [];
              if (homeTdSum !== homeScore) warnings.push(t.matchTdWarning(homeRoster?.name || '', homeTdSum, homeScore));
              if (awayTdSum !== awayScore) warnings.push(t.matchTdWarning(awayRoster?.name || '', awayTdSum, awayScore));
              return warnings.length > 0 ? (
                <div className="match-td-warning">
                  {warnings.map((w, i) => <div key={i}>{w}</div>)}
                </div>
              ) : null;
            })()}

            <div className="match-wizard-nav">
              <button className="btn-secondary" onClick={() => setStep(2)}>
                {t.matchPrevious}
              </button>
              <button className="btn-primary" onClick={() => setStep(4)}>
                {t.matchNext}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <div className="match-wizard-content">
            <div className="match-review">
              <div className="match-review-header">
                {competition && <span className="match-review-comp">{competition}</span>}
                {round && <span className="match-review-round">{round}</span>}
                <span className="match-review-date">{date}</span>
              </div>
              <div className="match-review-score">
                <span className="match-review-team">{homeRoster?.name || homeRoster?.teamName}</span>
                <span className="match-review-result">{homeScore} - {awayScore}</span>
                <span className="match-review-team">{awayRoster?.name || awayRoster?.teamName}</span>
              </div>

              {(['home', 'away'] as const).map((side) => {
                const players = side === 'home' ? homePlayers : awayPlayers;
                const roster = side === 'home' ? homeRoster : awayRoster;
                const label = side === 'home' ? t.matchHomeTeam : t.matchAwayTeam;
                const totalSPP = players.reduce((s, p) => s + calcSPP(p), 0);
                return (
                  <div key={side} className="match-review-team-section">
                    <h4>{label}: {roster?.name || roster?.teamName}</h4>
                    <table className="match-events-table">
                      <thead>
                        <tr>
                          <th>{t.name}</th>
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
                        {players.filter(p => p.tds > 0 || p.cas > 0 || p.cp > 0 || p.int > 0 || p.def > 0 || p.mvp).map((p) => (
                          <tr key={p.uid}>
                            <td>{p.name}</td>
                            <td className="center">{p.tds || '-'}</td>
                            <td className="center">{p.cas || '-'}</td>
                            <td className="center">{p.cp || '-'}</td>
                            <td className="center">{p.int || '-'}</td>
                            <td className="center">{p.def || '-'}</td>
                            <td className="center">{p.mvp ? '\u2605' : '-'}</td>
                            <td className="center match-spp-cell">{calcSPP(p)}</td>
                          </tr>
                        ))}
                        {players.every(p => p.tds === 0 && p.cas === 0 && p.cp === 0 && p.int === 0 && p.def === 0 && !p.mvp) && (
                          <tr><td colSpan={8} className="center muted">-</td></tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td><strong>{t.matchTotal}</strong></td>
                          <td className="center">{players.reduce((s, p) => s + p.tds, 0)}</td>
                          <td className="center">{players.reduce((s, p) => s + p.cas, 0)}</td>
                          <td className="center">{players.reduce((s, p) => s + p.cp, 0)}</td>
                          <td className="center">{players.reduce((s, p) => s + p.int, 0)}</td>
                          <td className="center">{players.reduce((s, p) => s + p.def, 0)}</td>
                          <td className="center">{players.filter(p => p.mvp).length}</td>
                          <td className="center match-spp-cell"><strong>{totalSPP}</strong></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                );
              })}

              {notes && (
                <div className="match-review-notes">
                  <strong>{t.matchNotes}:</strong> {notes}
                </div>
              )}
            </div>

            <div className="match-wizard-nav">
              <button className="btn-secondary" onClick={() => setStep(3)}>
                {t.matchPrevious}
              </button>
              <button className="btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? t.matchSaving : t.matchSave}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
