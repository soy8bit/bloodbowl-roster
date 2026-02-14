import { motion } from 'motion/react';
import type { RosterPlayer } from '../types';
import { formatStat } from '../utils/rosterUtils';
import { categoryClass } from '../utils/skillUtils';
import { calculateTotalSPP, calculatePlayerValue } from '../utils/progressionUtils';
import { useLang } from '../i18n';
import AppTooltip from './AppTooltip';

interface Props {
  player: RosterPlayer;
  index: number;
  skills: Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;
  onRemove: (uid: string) => void;
  onNameChange: (uid: string, name: string) => void;
  onSkillClick: (skillId: number) => void;
  onRandomName: (uid: string) => void;
}

export default function PlayerRow({ player, index, skills, onRemove, onNameChange, onSkillClick, onRandomName }: Props) {
  const statLabels = ['MA', 'ST', 'AG', 'PA', 'AV'];
  const { lang, t } = useLang();

  const totalSPP = calculateTotalSPP(player.spp);
  const playerValue = calculatePlayerValue(player);
  const upgradeSkills = (player.upgrades || []).filter(u => u.skillId != null);
  const hasProgression = totalSPP > 0 || upgradeSkills.length > 0 || player.missNextGame || (player.injuries || []).length > 0;

  return (
    <motion.tr
      className={`player-row ${player.missNextGame ? 'player-mng' : ''}`}
      layout
      initial={{ opacity: 0, backgroundColor: 'rgba(201, 162, 39, 0.25)' }}
      animate={{ opacity: 1, backgroundColor: 'rgba(201, 162, 39, 0)' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
    >
      <td className="col-num">{index + 1}</td>
      <td className="col-name">
        <div className="player-name-wrapper">
          <input
            type="text"
            className="player-name-input"
            placeholder={player.position}
            value={player.name}
            onChange={(e) => onNameChange(player.uid, e.target.value)}
          />
          <AppTooltip content={t.generateRandomName}>
            <button className="btn-random-name" onClick={() => onRandomName(player.uid)} type="button">
              🎲
            </button>
          </AppTooltip>
        </div>
        {hasProgression && (
          <div className="player-progression-badges">
            {totalSPP > 0 && (
              <span className="badge-inline badge-spp-inline">{totalSPP} SPP</span>
            )}
            {player.missNextGame && (
              <span className="badge-inline badge-mng-inline">MNG</span>
            )}
            {(player.injuries || []).length > 0 && (
              <span className="badge-inline badge-injury-inline">
                {(player.injuries || []).length} inj.
              </span>
            )}
          </div>
        )}
      </td>
      <td className="col-pos">{player.position}</td>
      {player.playerStats.map((stat, i) => (
        <td key={statLabels[i]} className="col-stat">
          {formatStat(stat, i)}
        </td>
      ))}
      <td className="col-skills">
        <div className="skill-badges">
          {player.skills.map((skillId) => {
            const skill = skills[String(skillId)];
            if (!skill) return null;
            return (
              <span
                key={skillId}
                className={`skill-badge clickable ${categoryClass[skill.category] || 'skill-t'}`}
                onClick={() => onSkillClick(skillId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSkillClick(skillId); } }}
              >
                {lang === 'es' ? skill.nameEs : skill.name}
              </span>
            );
          })}
          {upgradeSkills.map((upg) => {
            const skill = skills[String(upg.skillId)];
            if (!skill) return null;
            return (
              <span
                key={`upg-${upg.id}`}
                className={`skill-badge clickable upgrade-skill-badge ${categoryClass[skill.category] || 'skill-t'}`}
                onClick={() => upg.skillId && onSkillClick(upg.skillId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); upg.skillId && onSkillClick(upg.skillId); } }}
              >
                {lang === 'es' ? skill.nameEs : skill.name}
              </span>
            );
          })}
          {(player.upgrades || []).filter(u => u.type === 'stat').map((upg) => (
            <span key={`stat-${upg.id}`} className="skill-badge upgrade-skill-badge skill-stat">
              +1 {upg.stat}
            </span>
          ))}
        </div>
      </td>
      <td className="col-cost">{playerValue}k</td>
      <td className="col-action">
        <button
          className="btn-remove"
          onClick={() => onRemove(player.uid)}
          title={t.removePlayer}
        >
          &times;
        </button>
      </td>
      {/* Mobile-only: stats + cost summary row */}
      <td className="col-mobile-stats">
        <div className="mobile-stats-row">
          {statLabels.map((label, i) => (
            <span key={label} className="mobile-stat">
              <span className="mobile-stat-label">{label}</span>
              <span className="mobile-stat-value">{formatStat(player.playerStats[i], i)}</span>
            </span>
          ))}
          <span className="mobile-stat mobile-stat-cost">
            <span className="mobile-stat-value">{playerValue}k</span>
          </span>
        </div>
      </td>
    </motion.tr>
  );
}
