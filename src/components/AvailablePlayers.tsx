import type { TeamData, PlayerData, Roster } from '../types';
import { formatStat, getPositionCount, canAddPlayer } from '../utils/rosterUtils';
import { useLang } from '../i18n';

interface Props {
  team: TeamData;
  roster: Roster;
  playerMap: Map<number, PlayerData>;
  skills: Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;
  onAdd: (player: PlayerData) => void;
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

export default function AvailablePlayers({ team, roster, playerMap, skills, onAdd, onSkillClick }: Props) {
  const statLabels = ['MA', 'ST', 'AG', 'PA', 'AV'];
  const { lang, t } = useLang();

  return (
    <div className="available-players">
      <h3 className="section-subtitle">{t.availablePlayers}</h3>
      <div className="table-wrapper">
        <table className="roster-table">
          <thead>
            <tr>
              <th>{t.position}</th>
              {statLabels.map((l) => (
                <th key={l} className="col-stat-h">{l}</th>
              ))}
              <th>{t.skills}</th>
              <th>{t.cost}</th>
              <th>{t.qty}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {team.players.map((slot) => {
              const pd = playerMap.get(slot.id);
              if (!pd) return null;
              const count = getPositionCount(roster, slot.id);
              const check = canAddPlayer(roster, slot.id, team);

              return (
                <tr key={slot.id} className={!check.allowed ? 'row-disabled' : ''}>
                  <td className="col-pos">{pd.position}</td>
                  {pd.playerStats.map((stat, i) => (
                    <td key={statLabels[i]} className="col-stat">
                      {formatStat(stat, i)}
                    </td>
                  ))}
                  <td className="col-skills">
                    <div className="skill-badges">
                      {pd.skills.map((skillId) => {
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
                      {pd.skills.length === 0 && (
                        <span className="no-skills">{t.none}</span>
                      )}
                    </div>
                  </td>
                  <td className="col-cost">{pd.cost}k</td>
                  <td className="col-qty">
                    {count}/{slot.max}
                  </td>
                  <td className="col-action">
                    <button
                      className="btn-add"
                      onClick={() => onAdd(pd)}
                      disabled={!check.allowed}
                      title={check.reason || t.addPlayer}
                    >
                      +
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
