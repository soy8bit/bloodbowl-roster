import { useState, useMemo } from 'react';
import { useLang } from '../i18n';
import skillsRaw from '../data/skills.json';

const skills = skillsRaw as Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;

const CATEGORY_LABELS: Record<string, string> = {
  A: 'Agility',
  G: 'General',
  M: 'Mutation',
  P: 'Passing',
  S: 'Strength',
  T: 'Trait',
};

export default function SkillsPage() {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const { lang } = useLang();

  const skillList = useMemo(() => {
    return Object.entries(skills)
      .map(([id, s]) => ({
        id,
        name: lang === 'es' ? s.nameEs || s.name : s.name,
        description: lang === 'es' ? s.descriptionEs || s.description : s.description,
        category: s.category,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [lang]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return skillList.filter((s) => {
      if (filterCat !== 'all' && s.category !== filterCat) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [skillList, search, filterCat]);

  const categories = ['all', 'A', 'G', 'M', 'P', 'S', 'T'];

  return (
    <div className="skills-page">
      <h2 className="section-title">{lang === 'es' ? 'Habilidades' : 'Skills'}</h2>
      <div className="skills-controls">
        <input
          type="text"
          className="search-input"
          placeholder={lang === 'es' ? 'Buscar habilidad...' : 'Search skill...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="skills-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`skills-filter-btn ${filterCat === cat ? 'active' : ''} ${cat !== 'all' ? `filter-${cat.toLowerCase()}` : ''}`}
              onClick={() => setFilterCat(cat)}
            >
              {cat === 'all' ? (lang === 'es' ? 'Todas' : 'All') : cat}
            </button>
          ))}
        </div>
      </div>
      <div className="skills-count">
        {filtered.length} {lang === 'es' ? 'habilidades' : 'skills'}
      </div>
      <div className="skills-list">
        {filtered.map((s) => (
          <div key={s.id} className="skills-card">
            <div className="skills-card-header">
              <span className="skills-card-name">{s.name}</span>
              <span className={`skill-badge skill-${s.category.toLowerCase()}`}>
                {CATEGORY_LABELS[s.category] || s.category}
              </span>
            </div>
            <p className="skills-card-desc">{s.description}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="no-results">
            {lang === 'es' ? 'No se encontraron habilidades' : 'No skills found'}
          </div>
        )}
      </div>
    </div>
  );
}
