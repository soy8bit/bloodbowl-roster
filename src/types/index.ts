export type SkillCategory = 'A' | 'G' | 'M' | 'P' | 'S' | 'T' | 'NA';

export interface SkillInfo {
  name: string;
  category: SkillCategory;
  description: string;
  nameEs: string;
  descriptionEs: string;
}

export interface PlayerData {
  id: number;
  position: string;
  playerStats: [number, number, number, number, number]; // MA, ST, AG, PA, AV
  cost: number;
  skills: number[];
  primary?: SkillCategory[];
  secondary?: SkillCategory[];
  bigGuy?: boolean;
}

export interface TeamPlayerSlot {
  id: number;
  max: number;
}

export interface TeamData {
  name: string;
  id: string;
  players: TeamPlayerSlot[];
  reroll: { cost: number; max: number };
  allowedApothecary: boolean;
  tier: number;
  specialRules: string[];
  maxBigGuys?: number;
  retired?: boolean;
}

export interface RosterPlayer {
  uid: string; // unique instance id
  playerId: number;
  name: string;
  position: string;
  playerStats: [number, number, number, number, number];
  cost: number;
  skills: number[];
}

export interface StarPlayerData {
  name: string;
  cost: number;
  MA: number;
  ST: number;
  AG: number;
  PA: number;
  AV: number;
  skills: string[];
  teams: string[];
}

export interface InducementData {
  id: string;
  name: string;
  nameEs: string;
  cost: number;
  max: number;
}

export interface RosterStarPlayer {
  uid: string;
  name: string;
  cost: number;
}

export interface RosterInducement {
  id: string;
  quantity: number;
}

export interface Roster {
  id: string;
  name: string;
  coachName: string;
  teamId: string;
  teamName: string;
  logo?: string;
  players: RosterPlayer[];
  starPlayers: RosterStarPlayer[];
  inducements: RosterInducement[];
  rerolls: number;
  assistantCoaches: number;
  cheerleaders: number;
  dedicatedFans: number;
  apothecary: boolean;
  treasury: number;
  createdAt: number;
  updatedAt: number;
}

export interface SavedRosterMeta {
  id: string;
  name: string;
  teamName: string;
  updatedAt: number;
  playerCount: number;
  teamValue: number;
}
