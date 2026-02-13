import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Roster, TeamData, PlayerData } from '../types';
import { useLang } from '../i18n';
import PlayerRow from './PlayerRow';
import AvailablePlayers from './AvailablePlayers';
import RosterSummary from './RosterSummary';
import SkillModal from './SkillModal';

interface RosterActions {
  setName: (name: string) => void;
  addPlayer: (player: PlayerData, team: TeamData) => void;
  removePlayer: (uid: string) => void;
  setPlayerName: (uid: string, name: string) => void;
  setRerolls: (n: number) => void;
  setAssistantCoaches: (n: number) => void;
  setCheerleaders: (n: number) => void;
  setDedicatedFans: (n: number) => void;
  setApothecary: (v: boolean) => void;
  setTreasury: (n: number) => void;
  importRoster: (roster: Roster) => void;
}

interface Props {
  roster: Roster;
  team: TeamData;
  playerMap: Map<number, PlayerData>;
  skills: Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;
  rosterActions: RosterActions;
  onBack: () => void;
}

export default function RosterBuilder({
  roster,
  team,
  playerMap,
  skills,
  rosterActions,
  onBack,
}: Props) {
  const [showAvailable, setShowAvailable] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<{ name: string; nameEs: string; category: string; description: string; descriptionEs: string } | null>(null);
  const statLabels = ['MA', 'ST', 'AG', 'PA', 'AV'];
  const { lang, t } = useLang();

  const handleSkillClick = useCallback((skillId: number) => {
    const s = skills[String(skillId)];
    if (s) setSelectedSkill(s);
  }, [skills]);

  return (
    <div className="roster-builder">
      <div className="builder-header">
        <button className="btn-back" onClick={onBack}>&larr; {t.back}</button>
        <div className="team-info">
          <input
            type="text"
            className="team-name-input"
            placeholder={t.teamNamePlaceholder}
            value={roster.name}
            onChange={(e) => rosterActions.setName(e.target.value)}
          />
          <div className="team-meta">
            <span className="team-type">{team.name}</span>
            {team.specialRules.length > 0 && (
              <span className="team-rules">{team.specialRules.join(' | ')}</span>
            )}
          </div>
        </div>
      </div>

      <div className="builder-content">
        <div className="builder-main">
          {/* Available players FIRST so roster grows below without pushing it */}
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
                    onAdd={(p) => rosterActions.addPlayer(p, team)}
                    onSkillClick={handleSkillClick}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="roster-section">
            <div className="section-header">
              <h3 className="section-subtitle">{t.roster} ({roster.players.length}/16)</h3>
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
                    {roster.players.map((player, i) => (
                      <PlayerRow
                        key={player.uid}
                        player={player}
                        index={i}
                        skills={skills}
                        onRemove={rosterActions.removePlayer}
                        onNameChange={rosterActions.setPlayerName}
                        onSkillClick={handleSkillClick}
                      />
                    ))}
                    {roster.players.length === 0 && (
                      <tr>
                        <td colSpan={10} className="empty-roster">
                          {t.addPlayersHint}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </AnimatePresence>
              </table>
            </div>
          </div>
        </div>

        <div className="builder-sidebar">
          <RosterSummary
            roster={roster}
            team={team}
            skills={skills}
            onRerolls={rosterActions.setRerolls}
            onCoaches={rosterActions.setAssistantCoaches}
            onCheerleaders={rosterActions.setCheerleaders}
            onFans={rosterActions.setDedicatedFans}
            onApothecary={rosterActions.setApothecary}
            onTreasury={rosterActions.setTreasury}
            onImport={rosterActions.importRoster}
          />
        </div>
      </div>

      <SkillModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
    </div>
  );
}
