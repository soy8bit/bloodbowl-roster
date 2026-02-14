import type { TeamData, PlayerData, Roster } from '../types';
import { formatStat, getPositionCount, canAddPlayer } from '../utils/rosterUtils';
import { categoryClass } from '../utils/skillUtils';
import { useLang } from '../i18n';

interface Props {
  team: TeamData;
  roster: Roster;
  playerMap: Map<number, PlayerData>;
  skills: Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;
  onAdd: (player: PlayerData) => void;
  onSkillClick: (skillId: number) => void;
}

export default function AvailablePlayers({ team, roster, playerMap, skills, onAdd, onSkillClick }: Props) {
  const statLabels = ['MA', 'ST', 'AG', 'PA', 'AV'] as const;
  const { lang, t } = useLang();
  const statTips: Record<string, string> = { MA: t.tipMA, ST: t.tipST, AG: t.tipAG, PA: t.tipPA, AV: t.tipAV };

  return (
    <div className="available-players">
      <h3 className="section-subtitle">{t.availablePlayers}</h3>
      <div className="table-wrapper">
        <table className="roster-table">
          <thead>
            <tr>
              <th>{t.position}</th>
              {statLabels.map((l) => (
                <th key={l} className="col-stat-h" title={statTips[l]}>{l}</th>
              ))}
              <th>{t.skills}</th>
              <th className="col-cost">{t.cost}</th>
              <th className="col-qty">{t.qty}</th>
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
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSkillClick(skillId); } }}
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
                  {/* Mobile-only: stats summary */}
                  <td className="col-mobile-stats">
                    <div className="mobile-stats-row">
                      {statLabels.map((label, i) => (
                        <span key={label} className="mobile-stat">
                          <span className="mobile-stat-label">{label}</span>
                          <span className="mobile-stat-value">{formatStat(pd.playerStats[i], i)}</span>
                        </span>
                      ))}
                    </div>
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
