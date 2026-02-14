import { useState, useMemo, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Roster, TeamData, PlayerData, RosterPlayer, StarPlayerData, PlayerUpgrade, PlayerInjury, SPPRecord, GameRecord } from '../types';
import { formatGold, formatStat, validateRoster } from '../utils/rosterUtils';
import { exportRoster, importRoster } from '../utils/exportImport';
import { exportRosterPdf } from '../utils/pdfExport';
import { skillNameToCategoryClass } from '../utils/skillUtils';
import { generateRandomName } from '../utils/nameGenerator';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { useLang } from '../i18n';
import PlayerRow from './PlayerRow';
import AvailablePlayers from './AvailablePlayers';
import StarPlayers from './StarPlayers';
import Inducements from './Inducements';
import ProgressionTab from './ProgressionTab';
import GamesTab from './GamesTab';
import starPlayersRaw from '../data/starPlayers.json';

const allStarPlayers = starPlayersRaw as StarPlayerData[];

type Tab = 'roster' | 'progression' | 'games' | 'stars' | 'inducements' | 'staff';

interface RosterActions {
  setRerolls: (n: number) => void;
  setAssistantCoaches: (n: number) => void;
  setCheerleaders: (n: number) => void;
  setDedicatedFans: (n: number) => void;
  setApothecary: (v: boolean) => void;
  setTreasury: (n: number) => void;
  importRoster: (roster: Roster) => void;
  addStarPlayer: (name: string, cost: number) => void;
  removeStarPlayer: (uid: string) => void;
  setInducement: (id: string, quantity: number) => void;
  setPlayerName: (uid: string, name: string) => void;
  addPlayerUpgrade: (uid: string, upgrade: PlayerUpgrade) => void;
  removePlayerUpgrade: (uid: string, upgradeId: string) => void;
  addPlayerInjury: (uid: string, injury: PlayerInjury) => void;
  removePlayerInjury: (uid: string, injuryId: string) => void;
  setPlayerMNG: (uid: string, mng: boolean) => void;
  addPlayerSPP: (uid: string, sppDelta: Partial<SPPRecord>) => void;
  addGame: (game: GameRecord) => void;
  updateGame: (gameId: string, game: GameRecord) => void;
  deleteGame: (gameId: string) => void;
}

interface Props {
  roster: Roster;
  rosterId: string;
  team: TeamData;
  playerMap: Map<number, PlayerData>;
  skills: Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;
  rosterActions: RosterActions;
  displayedPlayers: RosterPlayer[];
  onAddPlayer: (p: PlayerData) => void;
  onRemovePlayer: (uid: string) => void;
  onSkillClick: (skillId: number) => void;
}

const TOKEN_KEY = 'bb_token';

function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

async function apiFetch(url: string, opts: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.headers) Object.assign(headers, opts.headers);
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export default function BuilderTabs({
  roster,
  rosterId,
  team,
  playerMap,
  skills,
  rosterActions,
  displayedPlayers,
  onAddPlayer,
  onRemovePlayer,
  onSkillClick,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('roster');
  const [showAvailable, setShowAvailable] = useState(true);
  const statLabels = ['MA', 'ST', 'AG', 'PA', 'AV'] as const;
  const { lang, t } = useLang();
  const statTips: Record<string, string> = { MA: t.tipMA, ST: t.tipST, AG: t.tipAG, PA: t.tipPA, AV: t.tipAV };
  const { showToast } = useToast();
  const { user } = useAuth();

  // Share state
  const [shareId, setShareId] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareChecked, setShareChecked] = useState(false);

  // Check existing share_id on mount (if logged in)
  useEffect(() => {
    if (!user || !rosterId || shareChecked) return;
    apiFetch(`/api/rosters/${rosterId}`)
      .then((data) => {
        if (data.share_id) setShareId(data.share_id);
      })
      .catch(() => {})
      .finally(() => setShareChecked(true));
  }, [user, rosterId, shareChecked]);

  const handleShare = useCallback(async () => {
    if (!user) { showToast(t.shareRequiresLogin, 'error'); return; }
    setShareLoading(true);
    try {
      const data = await apiFetch(`/api/rosters/${rosterId}/share`, { method: 'POST' });
      setShareId(data.shareId);
      const url = `${window.location.origin}/roster/shared/${data.shareId}`;
      await navigator.clipboard.writeText(url);
      showToast(t.shareCopied, 'success');
    } catch {
      showToast(t.shareRequiresCloud, 'error');
    } finally {
      setShareLoading(false);
    }
  }, [user, rosterId, showToast, t]);

  const handleCopyLink = useCallback(async () => {
    if (!shareId) return;
    const url = `${window.location.origin}/roster/shared/${shareId}`;
    await navigator.clipboard.writeText(url);
    showToast(t.shareCopied, 'success');
  }, [shareId, showToast, t]);

  const handleUnshare = useCallback(async () => {
    setShareLoading(true);
    try {
      await apiFetch(`/api/rosters/${rosterId}/share`, { method: 'DELETE' });
      setShareId(null);
    } catch {}
    setShareLoading(false);
  }, [rosterId]);

  const handleRandomName = useCallback((uid: string) => {
    const existingNames = displayedPlayers
      .filter(p => p.uid !== uid && p.name)
      .map(p => p.name);
    const name = generateRandomName(roster.teamId, existingNames);
    if (name) rosterActions.setPlayerName(uid, name);
  }, [displayedPlayers, roster.teamId, rosterActions]);

  const hiredStarData = useMemo(() => {
    return (roster.starPlayers || []).map(sp => {
      const data = allStarPlayers.find(s => s.name === sp.name);
      return { rosterStar: sp, data };
    });
  }, [roster.starPlayers]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'roster', label: t.tabRoster },
    { id: 'progression', label: t.tabProgression },
    { id: 'games', label: t.tabGames },
    { id: 'stars', label: t.tabStarPlayers },
    { id: 'inducements', label: t.tabInducements },
    { id: 'staff', label: t.tabStaff },
  ];

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const imported = await importRoster(file);
        rosterActions.importRoster(imported);
        showToast(t.importSuccess, 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : t.importFailed, 'error');
      }
    };
    input.click();
  };

  const handleExportPdf = () => {
    exportRosterPdf(roster, team, skills, lang);
    showToast(t.exportSuccess, 'info');
  };

  const handleExportJson = () => {
    exportRoster(roster);
    showToast(t.exportSuccess, 'info');
  };

  return (
    <div className="builder-tabs">
      <div className="tab-bar" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'roster' && (
          <div className="tab-panel">
            <div className="available-section">
              <button
                className="toggle-available"
                onClick={() => setShowAvailable(!showAvailable)}
              >
                {showAvailable ? t.hideAvailable : t.showAvailable}
              </button>
              <AnimatePresence initial={false}>
                {showAvailable && (
                  <motion.div
                    key="available-players"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <AvailablePlayers
                      team={team}
                      roster={roster}
                      playerMap={playerMap}
                      skills={skills}
                      onAdd={onAddPlayer}
                      onSkillClick={onSkillClick}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="roster-section">
              <div className="section-header">
                <h3 className="section-subtitle">{t.roster} ({displayedPlayers.length}/16)</h3>
              </div>
              <div className="table-wrapper">
                <table className="roster-table current-roster">
                  <thead>
                    <tr>
                      <th className="col-num-h">#</th>
                      <th className="col-name-h">{t.name}</th>
                      <th className="col-pos-h">{t.position}</th>
                      {statLabels.map((l) => (
                        <th key={l} className="col-stat-h" title={statTips[l]}>{l}</th>
                      ))}
                      <th>{t.skills}</th>
                      <th className="col-cost">{t.cost}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <AnimatePresence initial={false}>
                    <tbody>
                      {displayedPlayers.map((player, i) => (
                        <PlayerRow
                          key={player.uid}
                          player={player}
                          index={i}
                          skills={skills}
                          onRemove={onRemovePlayer}
                          onNameChange={rosterActions.setPlayerName}
                          onSkillClick={onSkillClick}
                          onRandomName={handleRandomName}
                        />
                      ))}
                      {displayedPlayers.length === 0 && (
                        <tr>
                          <td colSpan={10} className="empty-roster">
                            <div className="empty-state">
                              <div className="empty-state-icon">&#127944;</div>
                              <h4 className="empty-state-heading">{t.emptyRosterHeading}</h4>
                              <p className="empty-state-hint">{t.emptyRosterHint}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </AnimatePresence>
                </table>
              </div>
            </div>

            {hiredStarData.length > 0 && (
              <div className="roster-stars-section">
                <h3 className="section-subtitle">{t.starPlayers} ({hiredStarData.length})</h3>
                <div className="roster-stars-list">
                  {hiredStarData.map(({ rosterStar, data }) => (
                    <div key={rosterStar.uid} className="roster-star-card">
                      <div className="roster-star-top">
                        <span className="roster-star-name">{rosterStar.name}</span>
                        <span className="roster-star-cost">{formatGold(rosterStar.cost)}</span>
                        <button
                          className="btn-remove"
                          onClick={() => rosterActions.removeStarPlayer(rosterStar.uid)}
                          title={t.remove}
                        >&times;</button>
                      </div>
                      {data && (
                        <>
                          <div className="roster-star-stats">
                            {[data.MA, data.ST, data.AG, data.PA, data.AV].map((val, i) => (
                              <span key={i} className="mobile-stat">
                                <span className="mobile-stat-label">{statLabels[i]}</span>
                                <span className="mobile-stat-value">{formatStat(val, i)}</span>
                              </span>
                            ))}
                          </div>
                          {data.skills.length > 0 && (
                            <div className="roster-star-skills">
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
              </div>
            )}
          </div>
        )}

        {activeTab === 'progression' && (
          <div className="tab-panel">
            <ProgressionTab
              roster={roster}
              playerMap={playerMap}
              skills={skills}
              onAddUpgrade={rosterActions.addPlayerUpgrade}
              onRemoveUpgrade={rosterActions.removePlayerUpgrade}
              onAddInjury={rosterActions.addPlayerInjury}
              onRemoveInjury={rosterActions.removePlayerInjury}
              onSetMNG={rosterActions.setPlayerMNG}
              onSkillClick={onSkillClick}
            />
          </div>
        )}

        {activeTab === 'games' && (
          <div className="tab-panel">
            <GamesTab
              roster={roster}
              onAddGame={rosterActions.addGame}
              onUpdateGame={rosterActions.updateGame}
              onDeleteGame={rosterActions.deleteGame}
              onAddPlayerSPP={rosterActions.addPlayerSPP}
            />
          </div>
        )}

        {activeTab === 'stars' && (
          <div className="tab-panel">
            <StarPlayers
              team={team}
              starPlayers={roster.starPlayers || []}
              onAdd={rosterActions.addStarPlayer}
              onRemove={rosterActions.removeStarPlayer}
            />
          </div>
        )}

        {activeTab === 'inducements' && (
          <div className="tab-panel">
            <Inducements
              inducements={roster.inducements || []}
              onSet={rosterActions.setInducement}
            />
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="tab-panel">
            <div className="staff-config">
              <div className="summary-grid">
                <div className="summary-row">
                  <span>{t.rerolls} ({team.reroll.cost}k {t.each})</span>
                  <div className="counter">
                    <button
                      onClick={() => rosterActions.setRerolls(roster.rerolls - 1)}
                      disabled={roster.rerolls <= 0}
                      aria-label={t.ariaDecreaseRerolls}
                    >-</button>
                    <span aria-live="polite">{roster.rerolls}/{team.reroll.max}</span>
                    <button
                      onClick={() => rosterActions.setRerolls(roster.rerolls + 1)}
                      disabled={roster.rerolls >= team.reroll.max}
                      aria-label={t.ariaIncreaseRerolls}
                    >+</button>
                  </div>
                </div>

                <div className="summary-row">
                  <span>{t.assistantCoaches} (10k)</span>
                  <div className="counter">
                    <button
                      onClick={() => rosterActions.setAssistantCoaches(roster.assistantCoaches - 1)}
                      disabled={roster.assistantCoaches <= 0}
                      aria-label={t.ariaDecreaseCoaches}
                    >-</button>
                    <span aria-live="polite">{roster.assistantCoaches}/6</span>
                    <button
                      onClick={() => rosterActions.setAssistantCoaches(roster.assistantCoaches + 1)}
                      disabled={roster.assistantCoaches >= 6}
                      aria-label={t.ariaIncreaseCoaches}
                    >+</button>
                  </div>
                </div>

                <div className="summary-row">
                  <span>{t.cheerleaders} (10k)</span>
                  <div className="counter">
                    <button
                      onClick={() => rosterActions.setCheerleaders(roster.cheerleaders - 1)}
                      disabled={roster.cheerleaders <= 0}
                      aria-label={t.ariaDecreaseCheerleaders}
                    >-</button>
                    <span aria-live="polite">{roster.cheerleaders}/6</span>
                    <button
                      onClick={() => rosterActions.setCheerleaders(roster.cheerleaders + 1)}
                      disabled={roster.cheerleaders >= 6}
                      aria-label={t.ariaIncreaseCheerleaders}
                    >+</button>
                  </div>
                </div>

                <div className="summary-row">
                  <span>{t.dedicatedFans} (10k)</span>
                  <div className="counter">
                    <button
                      onClick={() => rosterActions.setDedicatedFans(roster.dedicatedFans - 1)}
                      disabled={roster.dedicatedFans <= 1}
                      aria-label={t.ariaDecreaseFans}
                    >-</button>
                    <span aria-live="polite">{roster.dedicatedFans}/6</span>
                    <button
                      onClick={() => rosterActions.setDedicatedFans(roster.dedicatedFans + 1)}
                      disabled={roster.dedicatedFans >= 6}
                      aria-label={t.ariaIncreaseFans}
                    >+</button>
                  </div>
                </div>

                {team.allowedApothecary && (
                  <div className="summary-row">
                    <span>{t.apothecary} (50k)</span>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={roster.apothecary}
                        onChange={(e) => rosterActions.setApothecary(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                )}

                <div className="summary-row">
                  <span>{t.treasury}</span>
                  <div className="treasury-input">
                    <input
                      type="number"
                      value={roster.treasury}
                      onChange={(e) => rosterActions.setTreasury(Number(e.target.value))}
                      min={0}
                      step={10}
                    />
                    <span className="gold-suffix">,000 gp</span>
                  </div>
                </div>
              </div>

              <div className="summary-actions">
                <button className="btn-primary btn-pdf" onClick={handleExportPdf}>
                  {t.exportPdf}
                </button>
                <button className="btn-secondary" onClick={handleExportJson}>
                  {t.exportJson}
                </button>
                <button className="btn-secondary" onClick={handleImport}>
                  {t.import_}
                </button>
              </div>

              <div className="share-section">
                <h4 className="share-section-title">{t.shareLink}</h4>
                {shareId ? (
                  <div className="share-url-row">
                    <input
                      className="share-url-input"
                      readOnly
                      value={`${window.location.origin}/roster/shared/${shareId}`}
                      onFocus={(e) => e.target.select()}
                    />
                    <button className="btn-secondary btn-small" onClick={handleCopyLink} title={t.shareCopied}>
                      {t.shareRoster}
                    </button>
                    <button className="btn-danger btn-small" onClick={handleUnshare} disabled={shareLoading}>
                      {t.unshareRoster}
                    </button>
                  </div>
                ) : (
                  <button className="btn-secondary" onClick={handleShare} disabled={shareLoading}>
                    {shareLoading ? '...' : t.shareRoster}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
