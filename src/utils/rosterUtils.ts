import type { Roster, RosterPlayer, TeamData, PlayerData, InducementData } from '../types';
import inducementsData from '../data/inducements.json';
import { getStrings, type Lang } from '../i18n';

const ASSISTANT_COACH_COST = 10;
const CHEERLEADER_COST = 10;
const DEDICATED_FANS_COST = 10;
const APOTHECARY_COST = 50;
const MAX_PLAYERS = 16;
const MIN_PLAYERS = 11;

const inducementMap = new Map((inducementsData as InducementData[]).map(i => [i.id, i]));

export interface TVBreakdown {
  players: number;
  stars: number;
  inducements: number;
  rerolls: number;
  staff: number;
  total: number;
}

export function calculateTVBreakdown(roster: Roster, team: TeamData): TVBreakdown {
  const players = roster.players.reduce((sum, p) => {
    const upgradeTV = (p.upgrades || []).reduce((s, u) => s + u.tvIncrease, 0);
    return sum + p.cost + upgradeTV;
  }, 0);
  const stars = (roster.starPlayers || []).reduce((sum, sp) => sum + sp.cost, 0);
  const inducements = (roster.inducements || []).reduce((sum, ind) => {
    const data = inducementMap.get(ind.id);
    return sum + (data ? data.cost * ind.quantity : 0);
  }, 0);
  const rerolls = roster.rerolls * team.reroll.cost;
  const staff =
    roster.assistantCoaches * ASSISTANT_COACH_COST +
    roster.cheerleaders * CHEERLEADER_COST +
    roster.dedicatedFans * DEDICATED_FANS_COST +
    (roster.apothecary ? APOTHECARY_COST : 0);
  return { players, stars, inducements, rerolls, staff, total: players + stars + inducements + rerolls + staff };
}

export function calculateTeamValue(roster: Roster, team: TeamData): number {
  return calculateTVBreakdown(roster, team).total;
}

export function getPositionCount(roster: Roster, playerId: number): number {
  return roster.players.filter((p) => p.playerId === playerId).length;
}

export function canAddPlayer(
  roster: Roster,
  playerId: number,
  team: TeamData,
): { allowed: boolean; reason?: string } {
  if (roster.players.length >= MAX_PLAYERS) {
    return { allowed: false, reason: 'Maximum 16 players reached' };
  }

  const slot = team.players.find((p) => p.id === playerId);
  if (!slot) {
    return { allowed: false, reason: 'Player not available for this team' };
  }

  const current = getPositionCount(roster, playerId);
  if (current >= slot.max) {
    return { allowed: false, reason: `Maximum ${slot.max} of this position` };
  }

  return { allowed: true };
}

export interface RosterValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateRoster(roster: Roster, team: TeamData, lang: Lang = 'en'): RosterValidation {
  const t = getStrings(lang);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (roster.players.length > MAX_PLAYERS) {
    errors.push(t.tooManyPlayers(roster.players.length, MAX_PLAYERS));
  }

  if (roster.players.length < MIN_PLAYERS) {
    warnings.push(t.needMinPlayers(MIN_PLAYERS, roster.players.length));
  }

  if (roster.rerolls > team.reroll.max) {
    errors.push(t.tooManyRerolls(roster.rerolls, team.reroll.max));
  }

  for (const slot of team.players) {
    const count = getPositionCount(roster, slot.id);
    if (count > slot.max) {
      errors.push(t.tooManyPosition(slot.id, count, slot.max));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function formatGold(value: number): string {
  return `${value},000`;
}

export function formatStat(value: number, index: number): string {
  // AG (index 2) and PA (index 3) display with "+" suffix
  if (index === 2 || index === 3) {
    return value === 0 ? '-' : `${value}+`;
  }
  return value === 0 ? '-' : String(value);
}

export function createEmptyRoster(team: TeamData): Roster {
  return {
    id: generateId(),
    name: '',
    coachName: '',
    teamId: team.id,
    teamName: team.name,
    players: [],
    starPlayers: [],
    inducements: [],
    rerolls: 0,
    assistantCoaches: 0,
    cheerleaders: 0,
    dedicatedFans: 1,
    apothecary: false,
    treasury: 1000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createRosterPlayer(playerData: PlayerData): RosterPlayer {
  return {
    uid: generateId(),
    playerId: playerData.id,
    name: '',
    position: playerData.position,
    playerStats: [...playerData.playerStats] as [number, number, number, number, number],
    cost: playerData.cost,
    skills: [...playerData.skills],
  };
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
