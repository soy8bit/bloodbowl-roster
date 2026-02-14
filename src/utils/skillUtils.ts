import skillsRaw from '../data/skills.json';

const skills = skillsRaw as Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;

export const categoryClass: Record<string, string> = {
  A: 'skill-a',
  G: 'skill-g',
  M: 'skill-m',
  P: 'skill-p',
  S: 'skill-s',
  D: 'skill-d',
  T: 'skill-t',
  NA: 'skill-t',
};

/** Lookup: skill name (English) → CSS class for that skill's category */
export const skillNameToCategoryClass: Record<string, string> = {};

for (const [, skill] of Object.entries(skills)) {
  skillNameToCategoryClass[skill.name] = categoryClass[skill.category] || 'skill-t';
  skillNameToCategoryClass[skill.nameEs] = categoryClass[skill.category] || 'skill-t';
}
