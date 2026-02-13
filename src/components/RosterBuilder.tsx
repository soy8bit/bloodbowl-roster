import { useState, useCallback, useRef } from 'react';
import type { Roster, TeamData, PlayerData } from '../types';
import { useToast } from '../hooks/useToast';
import { useLang } from '../i18n';
import BudgetBar from './BudgetBar';
import BuilderTabs from './BuilderTabs';
import SkillModal from './SkillModal';

interface RosterActions {
  setName: (name: string) => void;
  setCoachName: (name: string) => void;
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
  addStarPlayer: (name: string, cost: number) => void;
  removeStarPlayer: (uid: string) => void;
  setInducement: (id: string, quantity: number) => void;
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
  const [selectedSkill, setSelectedSkill] = useState<{ name: string; nameEs: string; category: string; description: string; descriptionEs: string } | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<{ uid: string; position: string } | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useLang();
  const { showToast } = useToast();

  const handleSkillClick = useCallback((skillId: number) => {
    const s = skills[String(skillId)];
    if (s) setSelectedSkill(s);
  }, [skills]);

  const handleAddPlayer = useCallback((p: PlayerData) => {
    rosterActions.addPlayer(p, team);
    showToast(t.playerAdded(p.position), 'success');
  }, [rosterActions, team, showToast, t]);

  const handleRemovePlayer = useCallback((uid: string) => {
    const player = roster.players.find((p) => p.uid === uid);
    if (!player) return;

    // Cancel any existing pending removal
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      if (pendingRemoval) {
        rosterActions.removePlayer(pendingRemoval.uid);
      }
    }

    setPendingRemoval({ uid, position: player.position });

    const timer = setTimeout(() => {
      rosterActions.removePlayer(uid);
      setPendingRemoval(null);
      pendingTimerRef.current = null;
    }, 5000);
    pendingTimerRef.current = timer;

    showToast(t.playerRemoved(player.position), 'info', {
      action: {
        label: t.undoRemove,
        onClick: () => {
          clearTimeout(timer);
          setPendingRemoval(null);
          pendingTimerRef.current = null;
        },
      },
      duration: 5000,
    });
  }, [roster.players, rosterActions, showToast, t, pendingRemoval]);

  const displayedPlayers = pendingRemoval
    ? roster.players.filter((p) => p.uid !== pendingRemoval.uid)
    : roster.players;

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
          <input
            type="text"
            className="coach-name-input"
            placeholder={t.coachNamePlaceholder}
            value={roster.coachName || ''}
            onChange={(e) => rosterActions.setCoachName(e.target.value)}
          />
          <div className="team-meta">
            <span className="team-type">{team.name}</span>
            {team.specialRules.length > 0 && (
              <span className="team-rules">{team.specialRules.join(' | ')}</span>
            )}
          </div>
        </div>
      </div>

      <BudgetBar roster={roster} team={team} />

      <BuilderTabs
        roster={roster}
        team={team}
        playerMap={playerMap}
        skills={skills}
        rosterActions={rosterActions}
        displayedPlayers={displayedPlayers}
        onAddPlayer={handleAddPlayer}
        onRemovePlayer={handleRemovePlayer}
        onSkillClick={handleSkillClick}
      />

      <SkillModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
    </div>
  );
}
