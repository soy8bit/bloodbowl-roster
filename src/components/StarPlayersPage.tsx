import { useState, useMemo } from 'react';
import { useLang } from '../i18n';
import { skillNameToCategoryClass } from '../utils/skillUtils';
import SkillModal from './SkillModal';
import starPlayersRaw from '../data/starPlayers.json';
import skillsRaw from '../data/skills.json';

interface StarPlayer {
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

interface SkillData {
  name: string;
  nameEs: string;
  category: string;
  description: string;
  descriptionEs: string;
}

const starPlayers = starPlayersRaw as StarPlayer[];
const skills = skillsRaw as Record<string, SkillData>;

// Build name→SkillData lookup (English + Spanish names)
const skillByName = new Map<string, SkillData>();
// Build English→Spanish skill name map
const skillEnToEs = new Map<string, string>();
for (const [, skill] of Object.entries(skills)) {
  skillByName.set(skill.name.toLowerCase(), skill);
  skillByName.set(skill.nameEs.toLowerCase(), skill);
  skillEnToEs.set(skill.name.toLowerCase(), skill.nameEs);
}

// Team name translations
const teamNameEs: Record<string, string> = {
  'Amazon': 'Amazonas',
  'Black Orc': 'Orco Negro',
  'Chaos Chosen': 'Elegidos del Caos',
  'Chaos Dwarf': 'Enano del Caos',
  'Chaos Renegade': 'Renegados del Caos',
  'Dark Elf': 'Elfo Oscuro',
  'Dwarf': 'Enano',
  'Elven Union': 'Union Elfica',
  'Gnome': 'Gnomo',
  'Goblin': 'Goblin',
  'Halfling': 'Halfling',
  'High Elf': 'Alto Elfo',
  'Human': 'Humano',
  'Imperial Nobility': 'Nobleza Imperial',
  'Khorne': 'Khorne',
  'Lizardmen': 'Hombres Lagarto',
  'Necromantic Horror': 'Horror Necromantico',
  'Norse': 'Nordico',
  'Nurgle': 'Nurgle',
  'Ogre': 'Ogro',
  'Old World Alliance': 'Alianza del Viejo Mundo',
  'Orc': 'Orco',
  'Shambling Undead': 'No Muertos',
  'Skaven': 'Skaven',
  'Slann': 'Slann',
  'Snotling': 'Snotling',
  'Tomb Kings': 'Reyes Funerarios',
  'Underworld Denizens': 'Moradores del Submundo',
  'Vampire': 'Vampiro',
  'Wood Elf': 'Elfo Silvano',
};

// Special skills that aren't in the standard skills DB (traits with parameters)
function findSkill(name: string): SkillData | null {
  const exact = skillByName.get(name.toLowerCase());
  if (exact) return exact;
  // Handle parametric skills like "Loner (4+)", "Mighty Blow (+1)", "Dirty Player (+1)"
  const base = name.replace(/\s*\([^)]+\)/, '').trim();
  return skillByName.get(base.toLowerCase()) || null;
}

// Determine if a skill is a "key" skill (combat/utility) vs secondary (Loner, Stunty, etc.)
const SECONDARY_SKILLS = new Set([
  'loner', 'stunty', 'titchy', 'right stuff', 'no hands',
  'bone head', 'really stupid', 'wild animal', 'unchannelled fury',
  'animal savagery', 'always hungry', 'projectile vomit',
  'bloodlust', 'decay', 'foul appearance',
]);

function isSecondarySkill(name: string): boolean {
  const base = name.replace(/\s*\([^)]+\)/, '').trim().toLowerCase();
  return SECONDARY_SKILLS.has(base);
}

// Detect "once per" special abilities
function isSpecialAbility(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes('once per') || lower.includes('secret weapon')
    || lower.includes('bombardier') || lower.includes('chainsaw')
    || lower.includes('ball and chain') || lower.includes('cannoneer');
}

// Translate a skill name from English to Spanish
function translateSkill(name: string): string {
  // Try exact match
  const exact = skillEnToEs.get(name.toLowerCase());
  if (exact) return exact;
  // Try base name without params, then re-attach params
  const paramMatch = name.match(/^(.+?)(\s*\([^)]+\))$/);
  if (paramMatch) {
    const baseName = paramMatch[1].trim();
    const params = paramMatch[2];
    const baseEs = skillEnToEs.get(baseName.toLowerCase());
    if (baseEs) {
      // Remove params from baseEs if it already has them, then add original params
      const baseEsClean = baseEs.replace(/\s*\([^)]+\)$/, '');
      return baseEsClean + params;
    }
  }
  return name;
}

// Translate team name
function translateTeam(name: string, lang: string): string {
  if (lang !== 'es') return name;
  return teamNameEs[name] || name;
}

export default function StarPlayersPage() {
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<SkillData | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const { lang, t } = useLang();

  const allTeams = useMemo(() => {
    const teamSet = new Set<string>();
    starPlayers.forEach((sp) => {
      sp.teams.forEach((team) => {
        if (team !== 'any' && team !== 'any_except_sylvanian') {
          teamSet.add(team);
        }
      });
    });
    return Array.from(teamSet).sort();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return starPlayers.filter((sp) => {
      if (filterTeam !== 'all') {
        const hasTeam = sp.teams.includes(filterTeam) || sp.teams.includes('any') || sp.teams.includes('any_except_sylvanian');
        if (!hasTeam) return false;
      }
      if (q) {
        const nameMatch = sp.name.toLowerCase().includes(q);
        const skillMatch = sp.skills.some((s) => {
          if (s.toLowerCase().includes(q)) return true;
          if (lang === 'es') {
            const esName = translateSkill(s);
            if (esName.toLowerCase().includes(q)) return true;
          }
          return false;
        });
        const ruleMatch = sp.specialRule?.toLowerCase().includes(q)
          || (lang === 'es' && sp.specialRuleEs?.toLowerCase().includes(q))
          || false;
        if (!nameMatch && !skillMatch && !ruleMatch) return false;
      }
      return true;
    });
  }, [search, filterTeam, lang]);

  const formatCost = (cost: number) => `${cost}k`;

  const handleSkillClick = (skillName: string) => {
    const skill = findSkill(skillName);
    if (skill) setSelectedSkill(skill);
  };

  const getSkillCategoryClass = (skillName: string): string => {
    // Try exact match first
    const cls = skillNameToCategoryClass[skillName];
    if (cls) return cls;
    // Try base name without params
    const base = skillName.replace(/\s*\([^)]+\)/, '').trim();
    return skillNameToCategoryClass[base] || 'skill-t';
  };

  return (
    <div className="stars-page">
      <h2 className="section-title">{t.navStarPlayers}</h2>
      <div className="stars-controls">
        <input
          type="text"
          className="search-input"
          placeholder={lang === 'es' ? 'Buscar por nombre o habilidad...' : 'Search by name or skill...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="stars-team-filter"
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
        >
          <option value="all">{lang === 'es' ? 'Todos los equipos' : 'All teams'}</option>
          {allTeams.map((team) => (
            <option key={team} value={team}>{translateTeam(team, lang)}</option>
          ))}
        </select>
      </div>
      <div className="stars-count">
        {filtered.length} {lang === 'es' ? 'jugadores estrella' : 'star players'}
      </div>
      <div className="stars-grid">
        {filtered.map((sp) => {
          const keySkills = sp.skills.filter(s => !isSecondarySkill(s));
          const secondarySkills = sp.skills.filter(s => isSecondarySkill(s));

          return (
            <div key={sp.name} className="sp-card">
              {/* Header: Name + Cost */}
              <div className="sp-card-header">
                <h3 className="sp-card-name">{sp.name}</h3>
                <span className="sp-card-cost">{formatCost(sp.cost)}</span>
              </div>

              {/* Stats bar */}
              <div className="sp-stats-bar">
                {(['MA', 'ST', 'AG', 'PA', 'AV'] as const).map(stat => {
                  const val = sp[stat];
                  const display = stat === 'AG' || stat === 'PA' || stat === 'AV'
                    ? (val > 0 ? `${val}+` : '-')
                    : `${val}`;
                  return (
                    <div key={stat} className="sp-stat">
                      <span className="sp-stat-label">{stat}</span>
                      <span className="sp-stat-value">{display}</span>
                    </div>
                  );
                })}
              </div>

              {/* Key skills */}
              <div className="sp-skills-section">
                <div className="sp-skills-row">
                  {keySkills.map((skill) => {
                    const catCls = getSkillCategoryClass(skill);
                    const hasDetail = !!findSkill(skill);
                    const isSpecial = isSpecialAbility(skill);
                    const displaySkill = lang === 'es' ? translateSkill(skill) : skill;
                    return (
                      <span
                        key={skill}
                        className={`skill-badge ${catCls} ${hasDetail ? 'clickable' : ''} ${isSpecial ? 'sp-skill-special' : ''}`}
                        onClick={hasDetail ? () => handleSkillClick(skill) : undefined}
                        role={hasDetail ? 'button' : undefined}
                        tabIndex={hasDetail ? 0 : undefined}
                        onKeyDown={hasDetail ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSkillClick(skill); } } : undefined}
                      >
                        {displaySkill}
                      </span>
                    );
                  })}
                </div>
                {/* Secondary / trait skills */}
                {secondarySkills.length > 0 && (
                  <div className="sp-skills-secondary">
                    {secondarySkills.map((skill) => {
                      const catCls = getSkillCategoryClass(skill);
                      const hasDetail = !!findSkill(skill);
                      const displaySkill = lang === 'es' ? translateSkill(skill) : skill;
                      return (
                        <span
                          key={skill}
                          className={`skill-badge ${catCls} sp-skill-dim ${hasDetail ? 'clickable' : ''}`}
                          onClick={hasDetail ? () => handleSkillClick(skill) : undefined}
                          role={hasDetail ? 'button' : undefined}
                          tabIndex={hasDetail ? 0 : undefined}
                          onKeyDown={hasDetail ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSkillClick(skill); } } : undefined}
                        >
                          {displaySkill}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Special Rule */}
              {sp.specialRule && (
                <div
                  className={`sp-special-rule ${expandedRule === sp.name ? 'expanded' : ''}`}
                  onClick={() => setExpandedRule(expandedRule === sp.name ? null : sp.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedRule(expandedRule === sp.name ? null : sp.name); } }}
                >
                  <div className="sp-special-rule-header">
                    <span className="sp-special-rule-icon">&#9733;</span>
                    <span className="sp-special-rule-name">
                      {lang === 'es' && sp.specialRuleEs ? sp.specialRuleEs : sp.specialRule}
                    </span>
                    <span className="sp-special-rule-toggle">{expandedRule === sp.name ? '\u25B2' : '\u25BC'}</span>
                  </div>
                  {expandedRule === sp.name && (
                    <div className="sp-special-rule-desc">
                      {lang === 'es' && sp.specialRuleDescriptionEs ? sp.specialRuleDescriptionEs : sp.specialRuleDescription}
                    </div>
                  )}
                </div>
              )}

              {/* Teams */}
              <div className="sp-card-teams">
                {sp.teams.includes('any')
                  ? (lang === 'es' ? 'Cualquier equipo' : 'Any team')
                  : sp.teams.includes('any_except_sylvanian')
                  ? (lang === 'es' ? 'Cualquier equipo (excepto Sylvanian)' : 'Any team (except Sylvanian)')
                  : sp.teams.map(t => translateTeam(t, lang)).join(' \u00b7 ')}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="no-results">
            {lang === 'es' ? 'No se encontraron jugadores estrella' : 'No star players found'}
          </div>
        )}
      </div>
      <SkillModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
    </div>
  );
}
