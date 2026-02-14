import { useState, useRef, useEffect, useMemo } from 'react';
import skillsRaw from '../../data/skills.json';
import { categoryClass } from '../../utils/skillUtils';

interface SkillEntry {
  name: string;
  nameEs: string;
  category: string;
}

const skillsMap = skillsRaw as Record<string, SkillEntry>;

const CATEGORY_LABELS: Record<string, string> = {
  A: 'Agility',
  G: 'General',
  M: 'Mutation',
  P: 'Passing',
  S: 'Strength',
  D: 'Devious',
  T: 'Trait',
  NA: 'Other',
};

const CATEGORY_ORDER = ['G', 'A', 'S', 'M', 'P', 'D', 'T', 'NA'];

interface Props {
  selected: number[];
  onChange: (skills: number[]) => void;
}

export default function SkillMultiSelect({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const allSkills = useMemo(() => {
    return Object.entries(skillsMap)
      .map(([id, s]) => ({ id: parseInt(id), name: s.name, category: s.category }))
      .sort((a, b) => {
        const catDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
        if (catDiff !== 0) return catDiff;
        return a.name.localeCompare(b.name);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!search) return allSkills;
    const q = search.toLowerCase();
    return allSkills.filter(s => s.name.toLowerCase().includes(q) || String(s.id).includes(q));
  }, [allSkills, search]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const s of filtered) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [filtered]);

  const selectedSet = new Set(selected);

  const toggle = (id: number) => {
    if (selectedSet.has(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const remove = (id: number) => {
    onChange(selected.filter(s => s !== id));
  };

  // Sorted selected skills for display
  const selectedSkills = selected
    .map(id => {
      const s = skillsMap[String(id)];
      return s ? { id, name: s.name, category: s.category } : null;
    })
    .filter(Boolean) as { id: number; name: string; category: string }[];

  return (
    <div className="skill-multi-select" ref={ref}>
      {/* Selected skills as badges */}
      <div
        className="skill-multi-selected"
        onClick={() => setOpen(!open)}
      >
        {selectedSkills.length === 0 && (
          <span className="skill-multi-placeholder">Select skills...</span>
        )}
        {selectedSkills.map(s => {
          const cls = categoryClass[s.category] || 'skill-t';
          return (
            <span
              key={s.id}
              className={`skill-multi-badge ${cls}`}
            >
              {s.name}
              <button
                className="skill-multi-badge-remove"
                onClick={(e) => { e.stopPropagation(); remove(s.id); }}
              >&times;</button>
            </span>
          );
        })}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="skill-multi-dropdown">
          <input
            ref={searchRef}
            type="text"
            className="skill-multi-search"
            placeholder="Search skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="skill-multi-list">
            {CATEGORY_ORDER.map(cat => {
              const skills = grouped[cat];
              if (!skills || skills.length === 0) return null;
              return (
                <div key={cat} className="skill-multi-group">
                  <div className="skill-multi-group-label">{CATEGORY_LABELS[cat] || cat}</div>
                  {skills.map(s => {
                    const isSelected = selectedSet.has(s.id);
                    const cls = categoryClass[s.category] || 'skill-t';
                    return (
                      <button
                        key={s.id}
                        className={`skill-multi-option ${isSelected ? 'skill-multi-option-selected' : ''}`}
                        onClick={() => toggle(s.id)}
                      >
                        <span className={`skill-multi-dot ${cls}`} />
                        <span className="skill-multi-option-name">{s.name}</span>
                        <span className="skill-multi-option-id">#{s.id}</span>
                        {isSelected && <span className="skill-multi-check">&#10003;</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="skill-multi-empty">No skills found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
