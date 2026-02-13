import { useState, useMemo } from 'react';
import { useLang } from '../i18n';
import { skillNameToCategoryClass } from '../utils/skillUtils';
import type { TeamData, StarPlayerData, RosterStarPlayer } from '../types';
import starPlayersRaw from '../data/starPlayers.json';

const allStarPlayers = starPlayersRaw as StarPlayerData[];

interface Props {
  team: TeamData;
  starPlayers: RosterStarPlayer[];
  onAdd: (name: string, cost: number) => void;
  onRemove: (uid: string) => void;
}

export default function StarPlayers({ team, starPlayers, onAdd, onRemove }: Props) {
  const [search, setSearch] = useState('');
  const { lang, t } = useLang();

  const available = useMemo(() => {
    const teamName = team.name;
    const teamRules = team.specialRules;
    return allStarPlayers.filter((sp) => {
      if (sp.teams.includes('any')) return true;
      if (sp.teams.includes('any_except_sylvanian') && !teamRules.includes('Sylvanian Spotlight')) return true;
      return sp.teams.some((t) => t === teamName || teamRules.includes(t));
    });
  }, [team]);

  const filtered = useMemo(() => {
    if (!search) return available;
    const q = search.toLowerCase();
    return available.filter((sp) =>
      sp.name.toLowerCase().includes(q) || sp.skills.some((s) => s.toLowerCase().includes(q))
    );
  }, [available, search]);

  const alreadyHired = new Set((starPlayers || []).map((sp) => sp.name));

  return (
    <div className="star-players-section">
      <h3 className="section-subtitle">{t.starPlayers}</h3>

      {(starPlayers || []).length > 0 && (
        <div className="hired-stars">
          {starPlayers.map((sp) => (
            <div key={sp.uid} className="hired-star-card">
              <span className="hired-star-name">{sp.name}</span>
              <span className="hired-star-cost">{sp.cost}k</span>
              <button className="btn-remove" onClick={() => onRemove(sp.uid)} title={t.remove}>&times;</button>
            </div>
          ))}
        </div>
      )}

      <input
        type="text"
        className="search-input star-search"
        placeholder={t.searchStar}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="star-list">
        {filtered.map((sp) => {
          const hired = alreadyHired.has(sp.name);
          return (
            <div key={sp.name} className={`star-card ${hired ? 'star-hired' : ''}`}>
              <div className="star-card-top">
                <span className="star-card-name">{sp.name}</span>
                <span className="star-card-cost">{sp.cost}k</span>
                <button
                  className="btn-add"
                  onClick={() => onAdd(sp.name, sp.cost)}
                  disabled={hired}
                  title={hired ? t.alreadyHired : t.hire}
                >+</button>
              </div>
              <div className="star-card-stats">
                {(['MA', 'ST', 'AG', 'PA', 'AV'] as const).map((label, i) => {
                  const val = [sp.MA, sp.ST, sp.AG, sp.PA, sp.AV][i];
                  const display = (i === 2 || i === 3) ? (val === 0 ? '-' : `${val}+`) : (val === 0 ? '-' : String(val));
                  return (
                    <span key={label} className="mobile-stat">
                      <span className="mobile-stat-label">{label}</span>
                      <span className="mobile-stat-value">{display}</span>
                    </span>
                  );
                })}
              </div>
              <div className="star-card-skills">
                {sp.skills.map((s) => (
                  <span key={s} className={`skill-badge ${skillNameToCategoryClass[s] || 'skill-t'}`}>{s}</span>
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="no-results">
            <div className="empty-state">
              <div className="empty-state-icon">&#11088;</div>
              <p className="empty-state-hint">{t.noStarsAvailable}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
