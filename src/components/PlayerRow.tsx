import { motion } from 'motion/react';
import type { RosterPlayer } from '../types';
import { formatStat } from '../utils/rosterUtils';
import { useLang } from '../i18n';

interface Props {
  player: RosterPlayer;
  index: number;
  skills: Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;
  onRemove: (uid: string) => void;
  onNameChange: (uid: string, name: string) => void;
  onSkillClick: (skillId: number) => void;
}

const categoryClass: Record<string, string> = {
  A: 'skill-a',
  G: 'skill-g',
  M: 'skill-m',
  P: 'skill-p',
  S: 'skill-s',
  T: 'skill-t',
  NA: 'skill-t',
};

export default function PlayerRow({ player, index, skills, onRemove, onNameChange, onSkillClick }: Props) {
  const statLabels = ['MA', 'ST', 'AG', 'PA', 'AV'];
  const { lang, t } = useLang();

  return (
    <motion.tr
      className="player-row"
      layout
      initial={{ opacity: 0, backgroundColor: 'rgba(201, 162, 39, 0.25)' }}
      animate={{ opacity: 1, backgroundColor: 'rgba(201, 162, 39, 0)' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
    >
      <td className="col-num">{index + 1}</td>
      <td className="col-name">
        <input
          type="text"
          className="player-name-input"
          placeholder={player.position}
          value={player.name}
          onChange={(e) => onNameChange(player.uid, e.target.value)}
        />
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
              >
                {lang === 'es' ? skill.nameEs : skill.name}
              </span>
            );
          })}
        </div>
      </td>
      <td className="col-cost">{player.cost}k</td>
      <td className="col-action">
        <button
          className="btn-remove"
          onClick={() => onRemove(player.uid)}
          title={t.removePlayer}
        >
          &times;
        </button>
      </td>
    </motion.tr>
  );
}
