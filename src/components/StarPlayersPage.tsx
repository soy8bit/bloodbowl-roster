import { useState, useMemo } from 'react';
import { useLang } from '../i18n';
import starPlayersRaw from '../data/starPlayers.json';

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
}

const starPlayers = starPlayersRaw as StarPlayer[];

export default function StarPlayersPage() {
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState<string>('all');
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
        const skillMatch = sp.skills.some((s) => s.toLowerCase().includes(q));
        if (!nameMatch && !skillMatch) return false;
      }
      return true;
    });
  }, [search, filterTeam]);

  const formatCost = (cost: number) => `${cost}k`;

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
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
      </div>
      <div className="stars-count">
        {filtered.length} {lang === 'es' ? 'jugadores estrella' : 'star players'}
      </div>
      <div className="stars-list">
        {filtered.map((sp) => (
          <div key={sp.name} className="stars-card">
            <div className="stars-card-header">
              <span className="stars-card-name">{sp.name}</span>
              <span className="stars-card-cost">{formatCost(sp.cost)}</span>
            </div>
            <div className="stars-card-stats">
              <span className="stars-stat"><span className="stars-stat-label">MA</span>{sp.MA}</span>
              <span className="stars-stat"><span className="stars-stat-label">ST</span>{sp.ST}</span>
              <span className="stars-stat"><span className="stars-stat-label">AG</span>{sp.AG}+</span>
              <span className="stars-stat"><span className="stars-stat-label">PA</span>{sp.PA > 0 ? `${sp.PA}+` : '-'}</span>
              <span className="stars-stat"><span className="stars-stat-label">AV</span>{sp.AV}+</span>
            </div>
            <div className="stars-card-skills">
              {sp.skills.map((skill) => (
                <span key={skill} className="stars-skill-chip">{skill}</span>
              ))}
            </div>
            <div className="stars-card-teams">
              {sp.teams.includes('any')
                ? (lang === 'es' ? 'Cualquier equipo' : 'Any team')
                : sp.teams.includes('any_except_sylvanian')
                ? (lang === 'es' ? 'Cualquier equipo (excepto Sylvanian)' : 'Any team (except Sylvanian)')
                : sp.teams.join(', ')}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="no-results">
            {lang === 'es' ? 'No se encontraron jugadores estrella' : 'No star players found'}
          </div>
        )}
      </div>
    </div>
  );
}
