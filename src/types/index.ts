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

export interface Roster {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  players: RosterPlayer[];
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
