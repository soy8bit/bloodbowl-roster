export type SkillCategory = 'A' | 'G' | 'M' | 'P' | 'S' | 'D' | 'T' | 'NA';

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

export interface PlayerUpgrade {
  id: string;
  type: 'primary_chosen' | 'primary_random' | 'secondary_chosen' | 'secondary_random' | 'stat';
  skillId?: number;
  stat?: 'MA' | 'ST' | 'AG' | 'PA' | 'AV';
  statDelta?: number;
  sppCost: number;
  tvIncrease: number;
}

export interface SPPRecord {
  cp: number;
  td: number;
  def: number;
  int: number;
  bh: number;
  si: number;
  kill: number;
  mvp: number;
}

export interface PlayerInjury {
  id: string;
  type: 'niggle' | 'MA' | 'AV' | 'AG' | 'PA' | 'ST';
  gameId?: string;
}

export interface GameRecord {
  id: string;
  date: number;
  opponentName: string;
  opponentRace: string;
  tdScored: number;
  tdConceded: number;
  casualties: number;
  result: 'W' | 'T' | 'L';
  notes: string;
  playerSPP: Record<string, Partial<SPPRecord>>;
}

export interface RosterPlayer {
  uid: string; // unique instance id
  playerId: number;
  name: string;
  position: string;
  playerStats: [number, number, number, number, number];
  cost: number;
  skills: number[];
  upgrades?: PlayerUpgrade[];
  spp?: SPPRecord;
  injuries?: PlayerInjury[];
  missNextGame?: boolean;
  dead?: boolean;
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
  specialRule?: string;
  specialRuleDescription?: string;
  specialRuleEs?: string;
  specialRuleDescriptionEs?: string;
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
  games?: GameRecord[];
}

export interface SavedRosterMeta {
  id: string;
  name: string;
  teamName: string;
  updatedAt: number;
  playerCount: number;
  teamValue: number;
}

// --- Match Report (Acta de Partido) ---

export interface MatchPlayer {
  uid: string;
  name: string;
  position: string;
  tds: number;
  cas: number;
  cp: number;
  int: number;
  def: number;
  mvp: boolean;
}

export interface MatchTeam {
  rosterId: string;
  name: string;
  coach: string;
  race: string;
  players: MatchPlayer[];
}

export interface MatchReport {
  id: string;
  date: string;
  round?: string;
  competition?: string;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  homeScore: number;
  awayScore: number;
  notes?: string;
  shareId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MatchSummary {
  id: string;
  date: string;
  competition?: string;
  round?: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  createdAt: string;
}

// --- Competitions ---

export type CompetitionType = 'league' | 'tournament';
export type CompetitionStatus = 'active' | 'finished' | 'archived';
export type PostMatchStatus = 'ok' | 'ko' | 'bh' | 'si' | 'dead' | 'mng';

export interface Competition {
  id: string;
  name: string;
  type: CompetitionType;
  status: CompetitionStatus;
  ownerId: number;
  joinCode: string | null;
  data: { description?: string; rounds?: number; currentRound?: number };
  rosterCount?: number;
  matchCount?: number;
  role?: string;
  createdAt: string;
}

export interface CompetitionSummary {
  id: string;
  name: string;
  type: CompetitionType;
  status: CompetitionStatus;
  role: string;
  rosterCount: number;
  matchCount: number;
  createdAt: string;
}

export interface CompetitionRoster {
  id: string;
  competitionId: string;
  userId: number;
  originalRosterId?: string;
  name: string;
  teamId: string;
  teamName: string;
  coachName: string;
  data: Roster;
}

export interface CompetitionRosterSummary {
  id: string;
  userId: number;
  name: string;
  teamId: string;
  teamName: string;
  coachName: string;
  playerCount: number;
  teamValue: number;
}

export interface CompetitionMatchPlayer {
  uid: string;
  name: string;
  position: string;
  tds: number;
  cas: number;
  cp: number;
  int: number;
  def: number;
  mvp: boolean;
  postMatchStatus: PostMatchStatus;
  injuryDetail?: PlayerInjury['type'];
}

export interface CompetitionMatchTeam {
  rosterId: string;
  name: string;
  coach: string;
  race: string;
  players: CompetitionMatchPlayer[];
}

export interface CompetitionMatchData {
  date: string;
  homeTeam: CompetitionMatchTeam;
  awayTeam: CompetitionMatchTeam;
  homeScore: number;
  awayScore: number;
  notes?: string;
}

export type CompetitionMatchStatus = 'scheduled' | 'played';

export interface CompetitionMatch {
  id: string;
  competitionId: string;
  homeRosterId: string;
  awayRosterId: string;
  round: string;
  status: CompetitionMatchStatus;
  data: CompetitionMatchData;
  createdAt: string;
}

export interface CompetitionMatchSummary {
  id: string;
  round: string;
  status: CompetitionMatchStatus;
  date: string;
  homeTeamName: string;
  awayTeamName: string;
  homeRosterId: string;
  awayRosterId: string;
  homeScore: number;
  awayScore: number;
}

export interface StandingRow {
  rosterId: string;
  teamName: string;
  coachName: string;
  race: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  tdFor: number;
  tdAgainst: number;
  tdDiff: number;
  casFor: number;
  points: number;
}
