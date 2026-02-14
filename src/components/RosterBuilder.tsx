import { useState, useCallback, useRef, useEffect, type ChangeEvent } from 'react';
import type { Roster, TeamData, PlayerData, PlayerUpgrade, PlayerInjury, SPPRecord, GameRecord } from '../types';
import { useToast } from '../hooks/useToast';
import { useLang } from '../i18n';
import BudgetBar from './BudgetBar';
import BuilderTabs from './BuilderTabs';
import GameView from './GameView';
import SkillModal from './SkillModal';
import ConfirmModal from './ConfirmModal';

interface RosterActions {
  setName: (name: string) => void;
  setCoachName: (name: string) => void;
  setLogo: (logo: string | undefined) => void;
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
  team: TeamData;
  playerMap: Map<number, PlayerData>;
  skills: Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;
  rosterActions: RosterActions;
  onBack: () => void;
  hasUnsavedChanges: boolean;
  onSave: () => { success: boolean; error?: string };
  onDiscard: () => void;
}

export default function RosterBuilder({
  roster,
  team,
  playerMap,
  skills,
  rosterActions,
  onBack,
  hasUnsavedChanges,
  onSave,
  onDiscard,
}: Props) {
  const [gameMode, setGameMode] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<{ name: string; nameEs: string; category: string; description: string; descriptionEs: string } | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<{ uid: string; position: string } | null>(null);
  const [nameError, setNameError] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLang();
  const { showToast } = useToast();

  // Warn on browser tab close / refresh if unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // Note: useBlocker requires data router (createBrowserRouter).
  // We use BrowserRouter (legacy), so we rely on beforeunload + onBack confirm only.

  const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

  const handleLogoUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_SIZE) {
      showToast(t.logoTooLarge, 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      rosterActions.setLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [rosterActions, showToast, t]);

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

  const handleSave = useCallback(() => {
    const result = onSave();
    if (result.success) {
      showToast(t.rosterSaved, 'success');
      setNameError(false);
    } else if (result.error === 'rosterNameRequired') {
      setNameError(true);
      showToast(t.rosterNameRequired, 'error');
    }
  }, [onSave, showToast, t]);

  const handleBackClick = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowBackConfirm(true);
    } else {
      onBack();
    }
  }, [hasUnsavedChanges, onBack]);

  const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    rosterActions.setName(e.target.value);
    if (nameError && e.target.value.trim()) {
      setNameError(false);
    }
  }, [rosterActions, nameError]);

  const displayedPlayers = pendingRemoval
    ? roster.players.filter((p) => p.uid !== pendingRemoval.uid)
    : roster.players;

  return (
    <div className="roster-builder">
      <div className="builder-header">
        <button className="btn-back" onClick={handleBackClick}>&larr; {t.back}</button>
        {!gameMode && (
          <div
            className={`logo-upload-area ${roster.logo ? 'has-logo' : ''}`}
            onClick={() => !roster.logo && logoInputRef.current?.click()}
            title={roster.logo ? t.removeLogo : t.uploadLogo}
          >
            {roster.logo ? (
              <>
                <img src={roster.logo} alt="Logo" className="logo-upload-img" />
                <button
                  className="logo-upload-remove"
                  onClick={(e) => { e.stopPropagation(); rosterActions.setLogo(undefined); }}
                >&times;</button>
              </>
            ) : (
              <span className="logo-upload-icon">+</span>
            )}
            <input
              ref={logoInputRef}
              type="file"
              className="logo-upload-input"
              accept="image/*"
              onChange={handleLogoUpload}
            />
          </div>
        )}
        {gameMode && roster.logo && (
          <img src={roster.logo} alt="Logo" className="logo-upload-img" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
        )}
        <div className="team-info">
          {gameMode ? (
            <>
              <span className="team-name-display">{roster.name || team.name}</span>
              {roster.coachName && (
                <span className="coach-name-display">{roster.coachName}</span>
              )}
            </>
          ) : (
            <>
              <div className="input-with-label">
                <label className="input-label">{t.teamNamePlaceholder}</label>
                <input
                  type="text"
                  className={`team-name-input ${nameError ? 'team-name-input--error' : ''}`}
                  placeholder={t.teamNamePlaceholder}
                  value={roster.name}
                  onChange={handleNameChange}
                />
              </div>
              <div className="input-with-label">
                <label className="input-label">{t.coachNamePlaceholder}</label>
                <input
                  type="text"
                  className="coach-name-input"
                  placeholder={t.coachNamePlaceholder}
                  value={roster.coachName || ''}
                  onChange={(e) => rosterActions.setCoachName(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="team-meta">
            <span className="team-type">{team.name}</span>
            <span className="season-badge-sm">S3</span>
            {team.specialRules.length > 0 && (
              <span className="team-rules">{team.specialRules.join(' | ')}</span>
            )}
          </div>
        </div>
        <button
          className={`btn-game-mode ${gameMode ? 'active' : ''}`}
          onClick={() => setGameMode(!gameMode)}
        >
          {gameMode ? t.exitGameMode : t.gameMode}
        </button>
        {!gameMode && hasUnsavedChanges && (
          <div className="save-actions">
            <button className="btn-save" onClick={handleSave}>{t.save}</button>
            <button className="btn-discard" onClick={onDiscard}>{t.discard}</button>
          </div>
        )}
      </div>

      {gameMode ? (
        <GameView roster={roster} team={team} skills={skills} onSkillClick={handleSkillClick} />
      ) : (
        <>
          <BudgetBar roster={roster} team={team} />

          <BuilderTabs
            roster={roster}
            rosterId={roster.id}
            team={team}
            playerMap={playerMap}
            skills={skills}
            rosterActions={rosterActions}
            displayedPlayers={displayedPlayers}
            onAddPlayer={handleAddPlayer}
            onRemovePlayer={handleRemovePlayer}
            onSkillClick={handleSkillClick}
          />
        </>
      )}

      <SkillModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />

      <ConfirmModal
        open={showBackConfirm}
        title={t.unsavedChangesTitle}
        message={t.unsavedChangesMsg}
        confirmText={t.discardAndLeave}
        cancelText={t.cancel}
        onConfirm={() => {
          setShowBackConfirm(false);
          onDiscard();
          onBack();
        }}
        onCancel={() => setShowBackConfirm(false)}
        variant="warning"
      />

    </div>
  );
}
