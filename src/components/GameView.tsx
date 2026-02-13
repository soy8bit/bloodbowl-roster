import { useState, useCallback, useEffect, useRef, useMemo, type RefObject } from 'react';
import type { Roster, TeamData, InducementData } from '../types';
import { useLang } from '../i18n';
import { formatGold, formatStat, calculateTVBreakdown } from '../utils/rosterUtils';
import { categoryClass, skillNameToCategoryClass } from '../utils/skillUtils';
import InfoButton from './InfoButton';
import inducementsData from '../data/inducements.json';
import starPlayersRaw from '../data/starPlayers.json';
import type { StarPlayerData } from '../types';

const inducementMap = new Map((inducementsData as InducementData[]).map(i => [i.id, i]));
const allStarPlayers = starPlayersRaw as StarPlayerData[];

type PlayerStatus = 'ok' | 'ko' | 'bh' | 'si' | 'dead' | 'sent';
const STATUS_CYCLE: PlayerStatus[] = ['ok', 'ko', 'bh', 'si', 'dead', 'sent'];
const STATUS_SORT_ORDER: Record<PlayerStatus, number> = {
  ok: 0, ko: 1, bh: 2, si: 3, dead: 4, sent: 5,
};

interface GameState {
  playerStatuses: Record<string, PlayerStatus>;
  usedRerolls: number;
  scoreHome: number;
  scoreAway: number;
  turn: number;
  half: 1 | 2;
}

const INITIAL_STATE: GameState = {
  playerStatuses: {},
  usedRerolls: 0,
  scoreHome: 0,
  scoreAway: 0,
  turn: 1,
  half: 1,
};

function loadGameState(rosterId: string): GameState {
  try {
    const raw = sessionStorage.getItem(`bb_game_${rosterId}`);
    if (raw) return { ...INITIAL_STATE, ...JSON.parse(raw) };
  } catch {}
  return { ...INITIAL_STATE };
}

function saveGameState(rosterId: string, state: GameState) {
  try {
    sessionStorage.setItem(`bb_game_${rosterId}`, JSON.stringify(state));
  } catch {}
}

interface Props {
  roster: Roster;
  team: TeamData;
  skills: Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;
  onSkillClick: (skillId: number) => void;
}

const STAT_LABELS = ['MA', 'ST', 'AG', 'PA', 'AV'];
const SWIPE_THRESHOLD = 60;

function StatusDropdown({ status, onChangeStatus, statusLabel, onOpenChange }: {
  status: PlayerStatus;
  onChangeStatus: (s: PlayerStatus) => void;
  statusLabel: (s: PlayerStatus) => string;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggle = (v: boolean) => {
    setOpen(v);
    onOpenChange?.(v);
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) toggle(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="game-status-dropdown" ref={ref}>
      <button
        className={`game-status-trigger game-status-trigger-${status}`}
        onClick={() => toggle(!open)}
      >
        {statusLabel(status)}
        <span className="game-status-arrow">{open ? '\u25B2' : '\u25BC'}</span>
      </button>
      {open && (
        <div className="game-status-menu">
          {STATUS_CYCLE.map(s => (
            <button
              key={s}
              className={`game-status-option game-status-option-${s} ${s === status ? 'selected' : ''}`}
              onClick={() => { onChangeStatus(s); toggle(false); }}
            >
              {statusLabel(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GameView({ roster, team, skills, onSkillClick }: Props) {
  const { t, lang } = useLang();
  const [gameState, setGameState] = useState<GameState>(() => loadGameState(roster.id));

  // Persist to sessionStorage on every state change
  useEffect(() => {
    saveGameState(roster.id, gameState);
  }, [roster.id, gameState]);

  // Hide header/footer when game view mounts
  useEffect(() => {
    document.body.setAttribute('data-game-mode', 'true');
    return () => {
      document.body.removeAttribute('data-game-mode');
    };
  }, []);

  const [openDropdownUid, setOpenDropdownUid] = useState<string | null>(null);
  const { playerStatuses, usedRerolls, scoreHome, scoreAway, turn, half } = gameState;

  const tv = calculateTVBreakdown(roster, team);

  const setStatus = useCallback((uid: string, status: PlayerStatus) => {
    if (navigator.vibrate) navigator.vibrate(10);
    setGameState(prev => ({
      ...prev,
      playerStatuses: { ...prev.playerStatuses, [uid]: status },
    }));
  }, []);

  const cycleStatus = useCallback((uid: string) => {
    setGameState(prev => {
      const current = prev.playerStatuses[uid] || 'ok';
      const idx = STATUS_CYCLE.indexOf(current);
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      if (navigator.vibrate) navigator.vibrate(10);
      return { ...prev, playerStatuses: { ...prev.playerStatuses, [uid]: next } };
    });
  }, []);

  const statusLabel = (s: PlayerStatus): string => {
    const map: Record<PlayerStatus, string> = {
      ok: t.statusOk, ko: t.statusKo, bh: t.statusBh,
      si: t.statusSi, dead: t.statusDead, sent: t.statusSent,
    };
    return map[s];
  };

  // Status summary counts
  const statusCounts = useMemo(() => {
    const counts: Record<PlayerStatus, number> = { ok: 0, ko: 0, bh: 0, si: 0, dead: 0, sent: 0 };
    roster.players.forEach(p => {
      const s = playerStatuses[p.uid] || 'ok';
      counts[s]++;
    });
    return counts;
  }, [roster.players, playerStatuses]);

  // Sorted players: ok first, then ko/bh/si, then dead/sent
  const sortedPlayers = useMemo(() => {
    return [...roster.players].sort((a, b) => {
      const sa = playerStatuses[a.uid] || 'ok';
      const sb = playerStatuses[b.uid] || 'ok';
      return STATUS_SORT_ORDER[sa] - STATUS_SORT_ORDER[sb];
    });
  }, [roster.players, playerStatuses]);

  const activeInducements = (roster.inducements || [])
    .filter(ind => ind.quantity > 0)
    .map(ind => {
      const data = inducementMap.get(ind.id);
      return data ? { ...data, quantity: ind.quantity } : null;
    })
    .filter(Boolean) as (InducementData & { quantity: number })[];

  const hiredStarData = (roster.starPlayers || []).map(sp => {
    const data = allStarPlayers.find(s => s.name === sp.name);
    return { rosterStar: sp, data };
  });

  // Swipe tracking refs
  const touchStartX = useRef<number | null>(null);
  const touchStartUid = useRef<string | null>(null);

  const handleTouchStart = (uid: string, e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartUid.current = uid;
  };

  const handleTouchEnd = (uid: string, e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartUid.current !== uid) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX < -SWIPE_THRESHOLD) {
      cycleStatus(uid);
    }
    touchStartX.current = null;
    touchStartUid.current = null;
  };

  return (
    <div className="game-view">
      {/* Scoreboard — the hero of the view */}
      <div className="game-scoreboard">
        <div className="game-scoreboard-top">
          <span className="game-team-name">{roster.name || team.name}</span>
          <span className="game-tv">{formatGold(tv.total)} TV</span>
          <InfoButton text={t.helpGameModeDesc} />
        </div>
        <div className="game-scoreboard-main">
          <div className="game-score-side">
            <span className="game-score-team-label">{t.home}</span>
            <div className="game-score-counter">
              <button className="game-score-btn" onClick={() => setGameState(s => ({ ...s, scoreHome: Math.max(0, s.scoreHome - 1) }))}>-</button>
              <span className="game-score-value">{scoreHome}</span>
              <button className="game-score-btn" onClick={() => setGameState(s => ({ ...s, scoreHome: s.scoreHome + 1 }))}>+</button>
            </div>
          </div>
          <div className="game-turn-block">
            <div className="game-half-toggle">
              <button
                className={`game-half-btn ${half === 1 ? 'active' : ''}`}
                onClick={() => setGameState(s => ({ ...s, half: 1 }))}
              >{t.half1}</button>
              <button
                className={`game-half-btn ${half === 2 ? 'active' : ''}`}
                onClick={() => setGameState(s => ({ ...s, half: 2 }))}
              >{t.half2}</button>
            </div>
            <div className="game-turn-counter">
              <button className="game-turn-btn" onClick={() => setGameState(s => ({ ...s, turn: Math.max(1, s.turn - 1) }))}>-</button>
              <span className="game-turn-value">{turn}<span className="game-turn-max">/8</span></span>
              <button className="game-turn-btn" onClick={() => setGameState(s => ({ ...s, turn: Math.min(8, s.turn + 1) }))}>+</button>
            </div>
          </div>
          <div className="game-score-side">
            <span className="game-score-team-label">{t.away}</span>
            <div className="game-score-counter">
              <button className="game-score-btn" onClick={() => setGameState(s => ({ ...s, scoreAway: Math.max(0, s.scoreAway - 1) }))}>-</button>
              <span className="game-score-value">{scoreAway}</span>
              <button className="game-score-btn" onClick={() => setGameState(s => ({ ...s, scoreAway: s.scoreAway + 1 }))}>+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Resources bar — compact single strip */}
      <div className="game-resources">
        <button
          className={`game-resource-pill game-resource-reroll ${usedRerolls >= roster.rerolls ? 'game-resource-used' : ''}`}
          onClick={() => setGameState(s => ({ ...s, usedRerolls: s.usedRerolls < roster.rerolls ? s.usedRerolls + 1 : 0 }))}
        >
          RR: {roster.rerolls - usedRerolls}/{roster.rerolls}
        </button>
        {roster.apothecary && (
          <span className="game-resource-pill game-resource-apo">Apo</span>
        )}
        <span className="game-resource-pill">AC: {roster.assistantCoaches}</span>
        <span className="game-resource-pill">CL: {roster.cheerleaders}</span>
        <span className="game-resource-pill">FF: {roster.dedicatedFans}</span>
        <span className="game-resource-pill game-resource-summary">
          {statusCounts.ok} OK
          {statusCounts.ko > 0 && <> / {statusCounts.ko} KO</>}
          {statusCounts.bh > 0 && <> / {statusCounts.bh} BH</>}
          {statusCounts.si > 0 && <> / {statusCounts.si} SI</>}
          {statusCounts.dead > 0 && <> / {statusCounts.dead} D</>}
          {statusCounts.sent > 0 && <> / {statusCounts.sent} S</>}
        </span>
      </div>

      {/* Player cards - sorted by status */}
      <div className="game-players-list">
        {sortedPlayers.map((player, idx) => {
          const status = playerStatuses[player.uid] || 'ok';
          const originalIdx = roster.players.indexOf(player);
          return (
            <div
              key={player.uid}
              className={`game-player-card game-status-${status} ${openDropdownUid === player.uid ? 'dropdown-open' : ''}`}
              onTouchStart={(e) => handleTouchStart(player.uid, e)}
              onTouchEnd={(e) => handleTouchEnd(player.uid, e)}
            >
              <div className="game-player-top">
                <span className="game-player-num">#{originalIdx + 1}</span>
                <span className="game-player-name">
                  {player.name || player.position}
                </span>
                {player.name && (
                  <span className="game-player-pos">{player.position}</span>
                )}
                <StatusDropdown
                  status={status}
                  onChangeStatus={(s) => setStatus(player.uid, s)}
                  statusLabel={statusLabel}
                  onOpenChange={(open) => setOpenDropdownUid(open ? player.uid : null)}
                />
              </div>
              <div className="game-player-stats">
                {player.playerStats.map((val, i) => (
                  <span key={i} className="game-stat">
                    <span className="game-stat-label">{STAT_LABELS[i]}</span>
                    <span className="game-stat-value">{formatStat(val, i)}</span>
                  </span>
                ))}
              </div>
              {player.skills.length > 0 && (
                <div className="game-player-skills">
                  {player.skills.map(skillId => {
                    const s = skills[String(skillId)];
                    if (!s) return null;
                    const cls = categoryClass[s.category] || 'skill-t';
                    return (
                      <button
                        key={skillId}
                        className={`skill-badge ${cls} clickable`}
                        onClick={() => onSkillClick(skillId)}
                      >
                        {lang === 'es' ? s.nameEs : s.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hiredStarData.length > 0 && (
        <div className="game-stars-section">
          <div className="section-subtitle">{t.gameStarPlayers}</div>
          {hiredStarData.map(({ rosterStar, data }) => (
            <div key={rosterStar.uid} className="game-star-card">
              <div className="game-star-top">
                <span className="game-star-name">{rosterStar.name}</span>
                <span className="game-star-cost">{formatGold(rosterStar.cost)}</span>
              </div>
              {data && (
                <>
                  <div className="game-player-stats">
                    {[data.MA, data.ST, data.AG, data.PA, data.AV].map((val, i) => (
                      <span key={i} className="game-stat">
                        <span className="game-stat-label">{STAT_LABELS[i]}</span>
                        <span className="game-stat-value">{formatStat(val, i)}</span>
                      </span>
                    ))}
                  </div>
                  {data.skills.length > 0 && (
                    <div className="game-player-skills">
                      {data.skills.map((skillName, i) => {
                        const cls = skillNameToCategoryClass[skillName] || 'skill-t';
                        return (
                          <span key={i} className={`skill-badge ${cls}`}>
                            {skillName}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {activeInducements.length > 0 && (
        <div className="game-inducements-section">
          <div className="section-subtitle">{t.gameInducements}</div>
          {activeInducements.map(ind => (
            <div key={ind.id} className="game-inducement-row">
              <span>{lang === 'es' ? ind.nameEs : ind.name}</span>
              {ind.quantity > 1 && <span>&times;{ind.quantity}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
