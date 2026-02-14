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

// Build name→category lookup
const skillByName = new Map<string, { name: string; category: string }>();
for (const [, s] of Object.entries(skillsMap)) {
  skillByName.set(s.name, { name: s.name, category: s.category });
}

interface Props {
  selected: string[];
  onChange: (skills: string[]) => void;
}

export default function SkillNameMultiSelect({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customInput, setCustomInput] = useState('');
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
      .map(([, s]) => ({ name: s.name, category: s.category }))
      .sort((a, b) => {
        const catDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
        if (catDiff !== 0) return catDiff;
        return a.name.localeCompare(b.name);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!search) return allSkills;
    const q = search.toLowerCase();
    return allSkills.filter(s => s.name.toLowerCase().includes(q));
  }, [allSkills, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const s of filtered) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [filtered]);

  const selectedSet = new Set(selected);

  const toggle = (name: string) => {
    if (selectedSet.has(name)) {
      onChange(selected.filter(s => s !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  const remove = (name: string) => {
    onChange(selected.filter(s => s !== name));
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selectedSet.has(trimmed)) {
      onChange([...selected, trimmed]);
      setCustomInput('');
    }
  };

  const getCategoryForSkill = (name: string): string => {
    const exact = skillByName.get(name);
    if (exact) return exact.category;
    const base = name.replace(/\s*\([^)]+\)/, '').trim();
    const baseMatch = skillByName.get(base);
    return baseMatch?.category || 'T';
  };

  return (
    <div className="skill-multi-select" ref={ref}>
      <div className="skill-multi-selected" onClick={() => setOpen(!open)}>
        {selected.length === 0 && (
          <span className="skill-multi-placeholder">Select skills...</span>
        )}
        {selected.map(name => {
          const cat = getCategoryForSkill(name);
          const cls = categoryClass[cat] || 'skill-t';
          return (
            <span key={name} className={`skill-multi-badge ${cls}`}>
              {name}
              <button
                className="skill-multi-badge-remove"
                onClick={(e) => { e.stopPropagation(); remove(name); }}
              >&times;</button>
            </span>
          );
        })}
      </div>

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
          <div className="skill-multi-custom-row">
            <input
              type="text"
              className="skill-multi-search"
              placeholder="Custom skill name..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
            />
            <button className="skill-multi-custom-add" onClick={addCustom} disabled={!customInput.trim()}>+</button>
          </div>
          <div className="skill-multi-list">
            {CATEGORY_ORDER.map(cat => {
              const skills = grouped[cat];
              if (!skills || skills.length === 0) return null;
              return (
                <div key={cat} className="skill-multi-group">
                  <div className="skill-multi-group-label">{CATEGORY_LABELS[cat] || cat}</div>
                  {skills.map(s => {
                    const isSelected = selectedSet.has(s.name);
                    const cls = categoryClass[s.category] || 'skill-t';
                    return (
                      <button
                        key={s.name}
                        className={`skill-multi-option ${isSelected ? 'skill-multi-option-selected' : ''}`}
                        onClick={() => toggle(s.name)}
                      >
                        <span className={`skill-multi-dot ${cls}`} />
                        <span className="skill-multi-option-name">{s.name}</span>
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
