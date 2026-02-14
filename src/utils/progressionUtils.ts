import type { RosterPlayer, PlayerUpgrade, SPPRecord, PlayerData, SkillCategory } from '../types';
import skillsRaw from '../data/skills.json';

const skills = skillsRaw as Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;

// SPP values per action
export const SPP_VALUES = {
  cp: 1,
  td: 3,
  def: 1,
  int: 2,
  bh: 2,
  si: 2,
  kill: 2,
  mvp: 4,
} as const;

// Upgrade costs BB2020
export const UPGRADE_COSTS: Record<PlayerUpgrade['type'], { spp: number; tv: number }> = {
  primary_random: { spp: 3, tv: 10 },
  primary_chosen: { spp: 6, tv: 20 },
  secondary_random: { spp: 6, tv: 20 },
  secondary_chosen: { spp: 12, tv: 40 },
  stat: { spp: 18, tv: 0 }, // tv varies by stat
};

export const STAT_UPGRADE_TV: Record<string, number> = {
  MA: 20,
  PA: 20,
  AV: 10,
  AG: 40,
  ST: 80,
};

export function emptySPP(): SPPRecord {
  return { cp: 0, td: 0, def: 0, int: 0, bh: 0, si: 0, kill: 0, mvp: 0 };
}

export function calculateTotalSPP(spp: SPPRecord | undefined): number {
  if (!spp) return 0;
  return (
    spp.cp * SPP_VALUES.cp +
    spp.td * SPP_VALUES.td +
    spp.def * SPP_VALUES.def +
    spp.int * SPP_VALUES.int +
    spp.bh * SPP_VALUES.bh +
    spp.si * SPP_VALUES.si +
    spp.kill * SPP_VALUES.kill +
    spp.mvp * SPP_VALUES.mvp
  );
}

export function calculateSpentSPP(upgrades: PlayerUpgrade[] | undefined): number {
  if (!upgrades) return 0;
  return upgrades.reduce((sum, u) => sum + u.sppCost, 0);
}

export function calculateUnspentSPP(player: RosterPlayer): number {
  return calculateTotalSPP(player.spp) - calculateSpentSPP(player.upgrades);
}

export function calculatePlayerValue(player: RosterPlayer): number {
  const upgradeTV = (player.upgrades || []).reduce((sum, u) => sum + u.tvIncrease, 0);
  return player.cost + upgradeTV;
}

export function getAvailableSkills(
  playerData: PlayerData,
  player: RosterPlayer,
  type: 'primary' | 'secondary',
): { id: number; name: string; nameEs: string; category: string }[] {
  const categories: SkillCategory[] = type === 'primary'
    ? (playerData.primary || [])
    : (playerData.secondary || []);

  const existingSkills = new Set([
    ...player.skills,
    ...(player.upgrades || []).filter(u => u.skillId != null).map(u => u.skillId!),
  ]);

  const result: { id: number; name: string; nameEs: string; category: string }[] = [];

  for (const [idStr, skill] of Object.entries(skills)) {
    const id = Number(idStr);
    if (existingSkills.has(id)) continue;
    if (categories.includes(skill.category as SkillCategory)) {
      result.push({ id, name: skill.name, nameEs: skill.nameEs, category: skill.category });
    }
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}
