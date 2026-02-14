import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { TeamData } from '../types';
import { useLang } from '../i18n';

interface Props {
  teams: TeamData[];
  onSelect: (team: TeamData) => void;
}

const tierClass: Record<number, string> = {
  1: 'tier-gold',
  2: 'tier-silver',
  3: 'tier-bronze',
};

const teamTierClass: Record<number, string> = {
  1: 'team-tier-1',
  2: 'team-tier-2',
  3: 'team-tier-3',
};

export default function TeamSelector({ teams, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [showRetired, setShowRetired] = useState(false);
  const { t } = useLang();

  const tierLabels: Record<number, string> = {
    1: t.tier1,
    2: t.tier2,
    3: t.tier3,
  };

  const filtered = useMemo(() => {
    return teams.filter((t) => {
      if (!showRetired && t.retired) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(s) ||
          t.specialRules.some((r) => r.toLowerCase().includes(s))
        );
      }
      return true;
    });
  }, [teams, search, showRetired]);

  return (
    <div className="team-selector">
      <h2 className="section-title">{t.chooseTeam} <span className="season-badge-sm">S3</span></h2>
      <div className="selector-controls">
        <input
          type="text"
          className="search-input"
          placeholder={t.searchTeams}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showRetired}
            onChange={(e) => setShowRetired(e.target.checked)}
          />
          {t.showRetired}
        </label>
      </div>
      <div className="team-grid">
        <AnimatePresence mode="popLayout">
          {filtered.map((team, i) => (
            <motion.button
              key={team.id}
              className={`team-card ${team.retired ? 'retired' : ''} ${teamTierClass[team.tier] || ''}`}
              onClick={() => onSelect(team)}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.2,
                delay: Math.min(i * 0.03, 0.3),
              }}
            >
              <div className="team-card-header">
                <span className="team-name">{team.name}</span>
                <span className={`team-tier ${tierClass[team.tier] || ''}`}>
                  {tierLabels[team.tier] || `Tier ${team.tier}`}
                </span>
              </div>
              <div className="team-card-rules">
                {team.specialRules.length > 0
                  ? team.specialRules.join(', ')
                  : t.noSpecialRules}
              </div>
              <div className="team-card-meta">
                <span>{t.rerollCost} {team.reroll.cost}k</span>
                <span>{team.players.length} {t.positions}</span>
                {team.allowedApothecary && <span className="apo-badge">{t.apoBadge}</span>}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
      {filtered.length === 0 && (
        <p className="no-results">{t.noTeamsMatch}</p>
      )}
    </div>
  );
}
