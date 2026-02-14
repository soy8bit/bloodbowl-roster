import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLang } from '../i18n';
import { formatGold, formatStat } from '../utils/rosterUtils';
import { exportRosterPdf } from '../utils/pdfExport';
import { skillNameToCategoryClass } from '../utils/skillUtils';
import type { Roster, TeamData } from '../types';
import teamsRaw from '../data/teams.json';
import skillsRaw from '../data/skills.json';
import starPlayersRaw from '../data/starPlayers.json';
import type { StarPlayerData } from '../types';

const teams = teamsRaw as TeamData[];
const skills = skillsRaw as Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;
const allStarPlayers = starPlayersRaw as StarPlayerData[];

const teamMap = new Map<string, TeamData>();
teams.forEach((t) => teamMap.set(t.id, t));

const statLabels = ['MA', 'ST', 'AG', 'PA', 'AV'] as const;

export default function SharedRosterView() {
  const { shareId } = useParams<{ shareId: string }>();
  const { t, lang } = useLang();
  const [roster, setRoster] = useState<Roster | null>(null);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) return;
    setLoading(true);
    fetch(`/api/shared/${shareId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('not found');
        const json = await res.json();
        setRoster(json.data as Roster);
        setTeamName(json.team_name || '');
      })
      .catch(() => setError(t.sharedRosterNotFound))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) return <div className="shared-roster-page"><div className="shared-roster-loading">...</div></div>;
  if (error || !roster) return <div className="shared-roster-page"><div className="shared-roster-error">{error || t.sharedRosterNotFound}</div></div>;

  const team = teamMap.get(roster.teamId) ?? null;

  const hiredStarData = (roster.starPlayers || []).map(sp => {
    const data = allStarPlayers.find(s => s.name === sp.name);
    return { rosterStar: sp, data };
  });

  const handleExportPdf = () => {
    if (team) exportRosterPdf(roster, team, skills, lang);
  };

  return (
    <div className="shared-roster-page">
      <div className="shared-roster-card">
        <div className="shared-roster-header">
          {roster.logo && <img src={roster.logo} alt="" className="shared-roster-logo" />}
          <div className="shared-roster-info">
            <h2 className="shared-roster-name">{roster.name || t.sharedRosterTitle}</h2>
            {roster.coachName && <div className="shared-roster-coach">{t.coach}: {roster.coachName}</div>}
            <div className="shared-roster-meta">
              <span className="team-type">{teamName || roster.teamName}</span>
              {team && team.specialRules.length > 0 && (
                <span className="team-rules">{team.specialRules.join(' | ')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Budget summary */}
        <div className="shared-roster-budget">
          <span>{t.teamValue}: <strong>{formatGold(
            roster.players.reduce((s, p) => s + p.cost, 0) +
            (roster.starPlayers || []).reduce((s, sp) => s + sp.cost, 0) +
            (team ? roster.rerolls * team.reroll.cost * 1000 : 0) +
            roster.assistantCoaches * 10000 +
            roster.cheerleaders * 10000 +
            (roster.dedicatedFans - 1) * 10000 +
            (roster.apothecary ? 50000 : 0)
          )}</strong></span>
          <span>{t.players}: <strong>{roster.players.length}</strong></span>
        </div>

        {/* Players table */}
        <div className="table-wrapper">
          <table className="roster-table shared-roster-table">
            <thead>
              <tr>
                <th className="col-num-h">#</th>
                <th className="col-name-h">{t.name}</th>
                <th className="col-pos-h">{t.position}</th>
                {statLabels.map((l) => (
                  <th key={l} className="col-stat-h">{l}</th>
                ))}
                <th>{t.skills}</th>
                <th className="col-cost">{t.cost}</th>
              </tr>
            </thead>
            <tbody>
              {roster.players.map((player, i) => (
                <tr key={player.uid}>
                  <td className="col-num">{i + 1}</td>
                  <td className="col-name">{player.name || '-'}</td>
                  <td className="col-pos">{player.position}</td>
                  {player.playerStats.map((val, si) => (
                    <td key={si} className="col-stat">{formatStat(val, si)}</td>
                  ))}
                  <td className="col-skills">
                    {player.skills.map((skillId) => {
                      const s = skills[String(skillId)];
                      if (!s) return null;
                      const catClass = `skill-${s.category?.charAt(0).toLowerCase() || 'g'}`;
                      return (
                        <span key={skillId} className={`skill-badge ${catClass}`}>
                          {lang === 'es' ? s.nameEs : s.name}
                        </span>
                      );
                    })}
                    {(player.upgrades || []).filter(u => u.skillId).map(u => {
                      const us = skills[String(u.skillId)];
                      if (!us) return null;
                      const uCat = `skill-${us.category?.charAt(0).toLowerCase() || 'g'}`;
                      return (
                        <span key={u.id} className={`skill-badge ${uCat} upgrade-badge`}>
                          {lang === 'es' ? us.nameEs : us.name}
                        </span>
                      );
                    })}
                  </td>
                  <td className="col-cost">{formatGold(player.cost)}</td>
                </tr>
              ))}
              {roster.players.length === 0 && (
                <tr><td colSpan={9} className="empty-roster">{t.emptyRosterHeading}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Star Players */}
        {hiredStarData.length > 0 && (
          <div className="shared-roster-stars">
            <h3 className="section-subtitle">{t.starPlayers} ({hiredStarData.length})</h3>
            <div className="roster-stars-list">
              {hiredStarData.map(({ rosterStar, data }) => (
                <div key={rosterStar.uid} className="roster-star-card">
                  <div className="roster-star-top">
                    <span className="roster-star-name">{rosterStar.name}</span>
                    <span className="roster-star-cost">{formatGold(rosterStar.cost)}</span>
                  </div>
                  {data && (
                    <>
                      <div className="roster-star-stats">
                        {[data.MA, data.ST, data.AG, data.PA, data.AV].map((val, i) => (
                          <span key={i} className="mobile-stat">
                            <span className="mobile-stat-label">{statLabels[i]}</span>
                            <span className="mobile-stat-value">{formatStat(val, i)}</span>
                          </span>
                        ))}
                      </div>
                      {data.skills.length > 0 && (
                        <div className="roster-star-skills">
                          {data.skills.map((skillName, i) => {
                            const cls = skillNameToCategoryClass[skillName] || 'skill-t';
                            return (
                              <span key={i} className={`skill-badge ${cls}`}>{skillName}</span>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staff summary */}
        <div className="shared-roster-staff">
          <h3 className="section-subtitle">{t.tabStaff}</h3>
          <div className="shared-staff-grid">
            <div className="shared-staff-item"><span>{t.rerolls}</span><strong>{roster.rerolls}</strong></div>
            <div className="shared-staff-item"><span>{t.assistantCoaches}</span><strong>{roster.assistantCoaches}</strong></div>
            <div className="shared-staff-item"><span>{t.cheerleaders}</span><strong>{roster.cheerleaders}</strong></div>
            <div className="shared-staff-item"><span>{t.dedicatedFans}</span><strong>{roster.dedicatedFans}</strong></div>
            {roster.apothecary && <div className="shared-staff-item"><span>{t.apothecary}</span><strong>{t.yes}</strong></div>}
          </div>
        </div>

        {/* Export PDF */}
        {team && (
          <div className="shared-roster-actions">
            <button className="btn-primary" onClick={handleExportPdf}>
              {t.exportPdf}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
