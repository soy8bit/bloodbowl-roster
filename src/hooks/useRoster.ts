import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Roster, TeamData, PlayerData, SavedRosterMeta, RosterStarPlayer, RosterInducement, PlayerUpgrade, PlayerInjury, SPPRecord, GameRecord } from '../types';
import { emptySPP } from '../utils/progressionUtils';
import {
  createEmptyRoster,
  createRosterPlayer,
  calculateTeamValue,
  canAddPlayer,
  validateRoster,
} from '../utils/rosterUtils';

const ROSTERS_KEY = 'bb_rosters';
const CURRENT_KEY = 'bb_current_roster_id';
const TOKEN_KEY = 'bb_token';

function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

/** Sync roster to cloud (fire-and-forget). Tries PUT, falls back to POST. */
async function syncToCloud(roster: Roster): Promise<void> {
  const token = getToken();
  if (!token) return;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
  const body = JSON.stringify({
    id: roster.id,
    name: roster.name,
    teamId: roster.teamId,
    teamName: roster.teamName,
    data: roster,
  });
  try {
    // Try update first
    const res = await fetch(`/api/rosters/${roster.id}`, { method: 'PUT', headers, body });
    if (res.status === 404) {
      // Not in cloud yet — create
      await fetch('/api/rosters', { method: 'POST', headers, body });
    }
  } catch {
    // Cloud sync failed silently — localStorage is primary
  }
}

export function useRoster() {
  const [rosters, setRosters] = useLocalStorage<Record<string, Roster>>(ROSTERS_KEY, {});
  const [currentId, setCurrentId] = useLocalStorage<string | null>(CURRENT_KEY, null);
  const [draft, setDraft] = useState<Roster | null>(null);
  const isNewRosterRef = useRef(false);

  // When currentId changes and draft is null, load from persisted store (tab restore)
  useEffect(() => {
    if (currentId && !draft && rosters[currentId]) {
      setDraft(structuredClone(rosters[currentId]));
      isNewRosterRef.current = false;
    }
  }, [currentId]); // intentionally exclude draft/rosters to only run on id change

  const currentRoster = draft;

  const updateRoster = useCallback(
    (updater: (roster: Roster) => Roster) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const updated = updater(prev);
        updated.updatedAt = Date.now();
        return updated;
      });
    },
    [],
  );

  const newRoster = useCallback(
    (team: TeamData) => {
      const roster = createEmptyRoster(team);
      isNewRosterRef.current = true;
      setDraft(roster);
      setRosters((prev) => ({ ...prev, [roster.id]: roster }));
      setCurrentId(roster.id);
      return roster;
    },
    [setRosters, setCurrentId],
  );

  const loadRoster = useCallback(
    (id: string) => {
      setRosters((prev) => {
        const r = prev[id];
        if (r) {
          setDraft(structuredClone(r));
          isNewRosterRef.current = false;
        }
        return prev;
      });
      setCurrentId(id);
    },
    [setCurrentId, setRosters],
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
        setDraft(null);
      }
      // Cloud delete (fire-and-forget)
      const token = getToken();
      if (token) {
        fetch(`/api/rosters/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => {});
      }
    },
    [currentId, setRosters, setCurrentId],
  );

  const importRoster = useCallback(
    (roster: Roster) => {
      const id = roster.id;
      // Persist immediately and load into draft
      setRosters((prev) => ({ ...prev, [id]: roster }));
      setDraft(structuredClone(roster));
      isNewRosterRef.current = false;
      setCurrentId(id);
    },
    [setRosters, setCurrentId],
  );

  // --- Save / Discard ---

  const saveRoster = useCallback((): { success: boolean; error?: string } => {
    if (!draft || !currentId) return { success: false };
    if (!draft.name.trim()) {
      return { success: false, error: 'rosterNameRequired' };
    }
    const toSave = { ...draft, updatedAt: Date.now() };
    setRosters((prev) => ({ ...prev, [currentId]: toSave }));
    setDraft(toSave);
    isNewRosterRef.current = false;
    // Cloud sync (fire-and-forget)
    syncToCloud(toSave);
    return { success: true };
  }, [draft, currentId, setRosters]);

  const discardChanges = useCallback(() => {
    if (isNewRosterRef.current && currentId) {
      // New roster — remove from persisted store and abandon
      setRosters((prev) => {
        const next = { ...prev };
        delete next[currentId];
        return next;
      });
      setDraft(null);
      setCurrentId(null);
    } else if (currentId && rosters[currentId]) {
      // Existing roster — restore from persisted
      setDraft(structuredClone(rosters[currentId]));
    }
  }, [currentId, rosters, setCurrentId, setRosters]);

  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !currentId) return false;
    if (isNewRosterRef.current) return true;
    const persisted = rosters[currentId];
    if (!persisted) return true;
    return JSON.stringify(draft) !== JSON.stringify(persisted);
  }, [draft, currentId, rosters]);

  // --- Setters (all delegate to updateRoster → draft) ---

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

  const setLogo = useCallback(
    (logo: string | undefined) => updateRoster((r) => ({ ...r, logo })),
    [updateRoster],
  );

  // --- Progression actions ---

  const addPlayerUpgrade = useCallback(
    (uid: string, upgrade: PlayerUpgrade) => {
      updateRoster((r) => ({
        ...r,
        players: r.players.map((p) =>
          p.uid === uid ? { ...p, upgrades: [...(p.upgrades || []), upgrade] } : p,
        ),
      }));
    },
    [updateRoster],
  );

  const removePlayerUpgrade = useCallback(
    (uid: string, upgradeId: string) => {
      updateRoster((r) => ({
        ...r,
        players: r.players.map((p) =>
          p.uid === uid
            ? { ...p, upgrades: (p.upgrades || []).filter((u) => u.id !== upgradeId) }
            : p,
        ),
      }));
    },
    [updateRoster],
  );

  const addPlayerInjury = useCallback(
    (uid: string, injury: PlayerInjury) => {
      updateRoster((r) => ({
        ...r,
        players: r.players.map((p) =>
          p.uid === uid ? { ...p, injuries: [...(p.injuries || []), injury] } : p,
        ),
      }));
    },
    [updateRoster],
  );

  const removePlayerInjury = useCallback(
    (uid: string, injuryId: string) => {
      updateRoster((r) => ({
        ...r,
        players: r.players.map((p) =>
          p.uid === uid
            ? { ...p, injuries: (p.injuries || []).filter((inj) => inj.id !== injuryId) }
            : p,
        ),
      }));
    },
    [updateRoster],
  );

  const setPlayerMNG = useCallback(
    (uid: string, mng: boolean) => {
      updateRoster((r) => ({
        ...r,
        players: r.players.map((p) => (p.uid === uid ? { ...p, missNextGame: mng } : p)),
      }));
    },
    [updateRoster],
  );

  const addPlayerSPP = useCallback(
    (uid: string, sppDelta: Partial<SPPRecord>) => {
      updateRoster((r) => ({
        ...r,
        players: r.players.map((p) => {
          if (p.uid !== uid) return p;
          const current = p.spp || emptySPP();
          const updated: SPPRecord = { ...current };
          for (const key of Object.keys(sppDelta) as (keyof SPPRecord)[]) {
            updated[key] = current[key] + (sppDelta[key] || 0);
          }
          return { ...p, spp: updated };
        }),
      }));
    },
    [updateRoster],
  );

  const addGame = useCallback(
    (game: GameRecord) => {
      updateRoster((r) => ({
        ...r,
        games: [...(r.games || []), game],
      }));
    },
    [updateRoster],
  );

  const updateGame = useCallback(
    (gameId: string, game: GameRecord) => {
      updateRoster((r) => ({
        ...r,
        games: (r.games || []).map((g) => (g.id === gameId ? game : g)),
      }));
    },
    [updateRoster],
  );

  const deleteGame = useCallback(
    (gameId: string) => {
      updateRoster((r) => ({
        ...r,
        games: (r.games || []).filter((g) => g.id !== gameId),
      }));
    },
    [updateRoster],
  );

  const goBack = useCallback(() => {
    setDraft(null);
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
    hasUnsavedChanges,
    saveRoster,
    discardChanges,
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
    setLogo,
    addPlayerUpgrade,
    removePlayerUpgrade,
    addPlayerInjury,
    removePlayerInjury,
    setPlayerMNG,
    addPlayerSPP,
    addGame,
    updateGame,
    deleteGame,
    savedRostersList,
    calculateTeamValue,
    validateRoster,
  };
}
