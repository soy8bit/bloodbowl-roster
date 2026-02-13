import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Roster, TeamData, PlayerData, SavedRosterMeta, RosterStarPlayer, RosterInducement } from '../types';
import {
  createEmptyRoster,
  createRosterPlayer,
  calculateTeamValue,
  canAddPlayer,
  validateRoster,
} from '../utils/rosterUtils';

const ROSTERS_KEY = 'bb_rosters';
const CURRENT_KEY = 'bb_current_roster_id';

export function useRoster() {
  const [rosters, setRosters] = useLocalStorage<Record<string, Roster>>(ROSTERS_KEY, {});
  const [currentId, setCurrentId] = useLocalStorage<string | null>(CURRENT_KEY, null);

  const currentRoster = currentId ? rosters[currentId] ?? null : null;

  const updateRoster = useCallback(
    (updater: (roster: Roster) => Roster) => {
      if (!currentId) return;
      setRosters((prev) => {
        const roster = prev[currentId];
        if (!roster) return prev;
        const updated = updater(roster);
        updated.updatedAt = Date.now();
        return { ...prev, [currentId]: updated };
      });
    },
    [currentId, setRosters],
  );

  const newRoster = useCallback(
    (team: TeamData) => {
      const roster = createEmptyRoster(team);
      setRosters((prev) => ({ ...prev, [roster.id]: roster }));
      setCurrentId(roster.id);
      return roster;
    },
    [setRosters, setCurrentId],
  );

  const loadRoster = useCallback(
    (id: string) => {
      setCurrentId(id);
    },
    [setCurrentId],
  );

  const deleteRoster = useCallback(
    (id: string) => {
      setRosters((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (currentId === id) {
        setCurrentId(null);
      }
    },
    [currentId, setRosters, setCurrentId],
  );

  const importRoster = useCallback(
    (roster: Roster) => {
      const id = roster.id;
      setRosters((prev) => ({ ...prev, [id]: roster }));
      setCurrentId(id);
    },
    [setRosters, setCurrentId],
  );

  const setName = useCallback(
    (name: string) => updateRoster((r) => ({ ...r, name })),
    [updateRoster],
  );

  const setCoachName = useCallback(
    (coachName: string) => updateRoster((r) => ({ ...r, coachName })),
    [updateRoster],
  );

  const addPlayer = useCallback(
    (playerData: PlayerData, team: TeamData) => {
      updateRoster((roster) => {
        const check = canAddPlayer(roster, playerData.id, team);
        if (!check.allowed) return roster;
        const player = createRosterPlayer(playerData);
        return { ...roster, players: [...roster.players, player] };
      });
    },
    [updateRoster],
  );

  const removePlayer = useCallback(
    (uid: string) => {
      updateRoster((roster) => ({
        ...roster,
        players: roster.players.filter((p) => p.uid !== uid),
      }));
    },
    [updateRoster],
  );

  const setPlayerName = useCallback(
    (uid: string, name: string) => {
      updateRoster((roster) => ({
        ...roster,
        players: roster.players.map((p) => (p.uid === uid ? { ...p, name } : p)),
      }));
    },
    [updateRoster],
  );

  const setRerolls = useCallback(
    (rerolls: number) => updateRoster((r) => ({ ...r, rerolls: Math.max(0, rerolls) })),
    [updateRoster],
  );

  const setAssistantCoaches = useCallback(
    (assistantCoaches: number) =>
      updateRoster((r) => ({ ...r, assistantCoaches: Math.max(0, assistantCoaches) })),
    [updateRoster],
  );

  const setCheerleaders = useCallback(
    (cheerleaders: number) =>
      updateRoster((r) => ({ ...r, cheerleaders: Math.max(0, cheerleaders) })),
    [updateRoster],
  );

  const setDedicatedFans = useCallback(
    (dedicatedFans: number) =>
      updateRoster((r) => ({ ...r, dedicatedFans: Math.max(1, Math.min(6, dedicatedFans)) })),
    [updateRoster],
  );

  const setApothecary = useCallback(
    (apothecary: boolean) => updateRoster((r) => ({ ...r, apothecary })),
    [updateRoster],
  );

  const setTreasury = useCallback(
    (treasury: number) => updateRoster((r) => ({ ...r, treasury: Math.max(0, treasury) })),
    [updateRoster],
  );

  const addStarPlayer = useCallback(
    (name: string, cost: number) => {
      updateRoster((r) => ({
        ...r,
        starPlayers: [...(r.starPlayers || []), { uid: Date.now().toString(36) + Math.random().toString(36).substring(2, 9), name, cost }],
      }));
    },
    [updateRoster],
  );

  const removeStarPlayer = useCallback(
    (uid: string) => {
      updateRoster((r) => ({
        ...r,
        starPlayers: (r.starPlayers || []).filter((sp) => sp.uid !== uid),
      }));
    },
    [updateRoster],
  );

  const setInducement = useCallback(
    (id: string, quantity: number) => {
      updateRoster((r) => {
        const inducements = [...(r.inducements || [])];
        const idx = inducements.findIndex((i) => i.id === id);
        if (quantity <= 0) {
          if (idx >= 0) inducements.splice(idx, 1);
        } else {
          if (idx >= 0) inducements[idx] = { id, quantity };
          else inducements.push({ id, quantity });
        }
        return { ...r, inducements };
      });
    },
    [updateRoster],
  );

  const goBack = useCallback(() => {
    setCurrentId(null);
  }, [setCurrentId]);

  const savedRostersList = useMemo((): SavedRosterMeta[] => {
    return Object.values(rosters)
      .map((r) => ({
        id: r.id,
        name: r.name || r.teamName,
        teamName: r.teamName,
        updatedAt: r.updatedAt,
        playerCount: r.players.length,
        teamValue: 0, // calculated lazily
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [rosters]);

  return {
    currentRoster,
    currentId,
    newRoster,
    loadRoster,
    deleteRoster,
    importRoster,
    goBack,
    setName,
    setCoachName,
    addPlayer,
    removePlayer,
    setPlayerName,
    setRerolls,
    setAssistantCoaches,
    setCheerleaders,
    setDedicatedFans,
    setApothecary,
    setTreasury,
    addStarPlayer,
    removeStarPlayer,
    setInducement,
    savedRostersList,
    calculateTeamValue,
    validateRoster,
  };
}
