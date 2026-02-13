import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Roster, TeamData, PlayerData, RosterPlayer } from '../types';
import { formatGold, validateRoster } from '../utils/rosterUtils';
import { exportRoster, importRoster } from '../utils/exportImport';
import { exportRosterPdf } from '../utils/pdfExport';
import { useToast } from '../hooks/useToast';
import { useLang } from '../i18n';
import PlayerRow from './PlayerRow';
import AvailablePlayers from './AvailablePlayers';
import StarPlayers from './StarPlayers';
import Inducements from './Inducements';

type Tab = 'roster' | 'stars' | 'inducements' | 'staff';

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
}

interface Props {
  roster: Roster;
  team: TeamData;
  playerMap: Map<number, PlayerData>;
  skills: Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;
  rosterActions: RosterActions;
  displayedPlayers: RosterPlayer[];
  onAddPlayer: (p: PlayerData) => void;
  onRemovePlayer: (uid: string) => void;
  onSkillClick: (skillId: number) => void;
}

export default function BuilderTabs({
  roster,
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
  const statLabels = ['MA', 'ST', 'AG', 'PA', 'AV'];
  const { lang, t } = useLang();
  const { showToast } = useToast();

  const tabs: { id: Tab; label: string }[] = [
    { id: 'roster', label: t.tabRoster },
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
                        <th key={l} className="col-stat-h">{l}</th>
                      ))}
                      <th>{t.skills}</th>
                      <th>{t.cost}</th>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
