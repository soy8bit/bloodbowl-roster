import type { Roster, TeamData } from '../types';
import { calculateTeamValue, formatStat, formatGold } from './rosterUtils';
import { calculateTotalSPP, calculatePlayerValue } from './progressionUtils';
import { getStrings, type Lang } from '../i18n';
import starPlayersRaw from '../data/starPlayers.json';
import type { StarPlayerData } from '../types';

const allStarPlayers = starPlayersRaw as StarPlayerData[];

export function exportRosterPdf(
  roster: Roster,
  team: TeamData,
  skills: Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>,
  lang: Lang = 'en',
): void {
  const t = getStrings(lang);
  const tv = calculateTeamValue(roster, team);
  const statHeaders = ['MA', 'ST', 'AG', 'PA', 'AV'];

  const playerRows = roster.players
    .map((p, i) => {
      const baseSkillNames = p.skills
        .map((id) => {
          const s = skills[String(id)];
          if (!s) return '';
          return lang === 'es' ? s.nameEs : s.name;
        })
        .filter(Boolean);
      const upgradeSkillNames = (p.upgrades || [])
        .filter(u => u.skillId != null)
        .map(u => {
          const s = skills[String(u.skillId)];
          if (!s) return '';
          return `<u>${lang === 'es' ? s.nameEs : s.name}</u>`;
        })
        .filter(Boolean);
      const statUpgrades = (p.upgrades || [])
        .filter(u => u.type === 'stat')
        .map(u => `<u>+1 ${u.stat}</u>`);
      const allSkills = [...baseSkillNames, ...upgradeSkillNames, ...statUpgrades].join(', ');
      const stats = p.playerStats
        .map((s, si) => `<td class="stat">${formatStat(s, si)}</td>`)
        .join('');
      const spp = calculateTotalSPP(p.spp);
      const playerVal = calculatePlayerValue(p);
      const sppBadge = spp > 0 ? ` <span class="pdf-spp">${spp} SPP</span>` : '';
      const mngBadge = p.missNextGame ? ' <span class="pdf-mng">MNG</span>' : '';
      return `<tr>
        <td class="num">${i + 1}</td>
        <td class="name">${p.name || p.position}${sppBadge}${mngBadge}</td>
        <td class="pos">${p.position}</td>
        ${stats}
        <td class="skills">${allSkills}</td>
        <td class="cost">${playerVal}k</td>
      </tr>`;
    })
    .join('\n');

  // Collect all unique skill IDs from roster players (base + upgrades)
  const skillIdSet = new Set<string>();
  roster.players.forEach((p) => {
    p.skills.forEach((id) => skillIdSet.add(String(id)));
    (p.upgrades || []).forEach((u) => { if (u.skillId != null) skillIdSet.add(String(u.skillId)); });
  });

  // Collect skill names from star players (they use string names, not IDs)
  const starSkillNames = new Set<string>();
  (roster.starPlayers || []).forEach((sp) => {
    const data = allStarPlayers.find((s) => s.name === sp.name);
    if (data) {
      data.skills.forEach((name) => starSkillNames.add(name));
    }
  });

  // Build skills reference list: player skills by ID + star player skills by name match
  const skillNameToEntry = new Map<string, { name: string; description: string }>();

  // Add roster player skills (by ID)
  skillIdSet.forEach((id) => {
    const s = skills[id];
    if (s) {
      const name = lang === 'es' ? s.nameEs || s.name : s.name;
      const desc = lang === 'es' ? s.descriptionEs || s.description : s.description;
      skillNameToEntry.set(name, { name, description: desc });
    }
  });

  // Add star player skills (by name match)
  const skillEntries = Object.values(skills);
  starSkillNames.forEach((skillName) => {
    if (!skillNameToEntry.has(skillName)) {
      const match = skillEntries.find((s) => s.name === skillName);
      if (match) {
        const name = lang === 'es' ? match.nameEs || match.name : match.name;
        const desc = lang === 'es' ? match.descriptionEs || match.description : match.description;
        skillNameToEntry.set(name, { name, description: desc });
      }
    }
  });

  const sortedSkills = Array.from(skillNameToEntry.values()).sort((a, b) => a.name.localeCompare(b.name));

  // Split into two columns
  const mid = Math.ceil(sortedSkills.length / 2);
  const col1 = sortedSkills.slice(0, mid);
  const col2 = sortedSkills.slice(mid);

  const renderSkillItem = (s: { name: string; description: string }) =>
    `<div class="ref-skill"><span class="ref-skill-name">${s.name}</span><span class="ref-skill-desc">${s.description}</span></div>`;

  const skillsRefPage = sortedSkills.length > 0 ? `
<div class="skills-ref-page">
  <h2 class="skills-ref-title">${lang === 'es' ? 'Referencia de Habilidades' : 'Skills Reference'}</h2>
  <div class="skills-ref-grid">
    <div class="skills-ref-col">${col1.map(renderSkillItem).join('\n')}</div>
    <div class="skills-ref-col">${col2.map(renderSkillItem).join('\n')}</div>
  </div>
  <div class="footer">${t.pdfFooter}</div>
</div>` : '';

  // Star players rows
  const starRows = (roster.starPlayers || []).map(sp => {
    const data = allStarPlayers.find(s => s.name === sp.name);
    const stats = data
      ? [data.MA, data.ST, data.AG, data.PA, data.AV].map((v, i) => `<td class="stat">${formatStat(v, i)}</td>`).join('')
      : '<td class="stat" colspan="5">-</td>';
    const skillNames = data ? data.skills.join(', ') : '';
    return `<tr class="star-row">
      <td class="num">\u2605</td>
      <td class="name star-name">${sp.name}</td>
      <td class="pos">Star Player</td>
      ${stats}
      <td class="skills">${skillNames}</td>
      <td class="cost">${sp.cost}k</td>
    </tr>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="${lang}"><head>
<meta charset="UTF-8">
<title>${roster.name || roster.teamName} - ${t.pdfTitle}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #1a1a1a; font-size: 14px; line-height: 1.4; }
  h1 { font-size: 28px; margin-bottom: 4px; color: #8b0000; }
  .subtitle { color: #555; font-size: 15px; margin-bottom: 14px; }
  .header-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .header-left { flex: 1; }
  .tv-box { background: #8b0000; color: white; padding: 8px 20px; border-radius: 4px; font-size: 20px; font-weight: 700; white-space: nowrap; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  th { background: #2a2a2a; color: white; padding: 8px 10px; text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: 0.4px; }
  td { padding: 7px 10px; border-bottom: 1px solid #ddd; font-size: 14px; }
  tr:nth-child(even) { background: #f7f7f7; }
  .num { width: 30px; text-align: center; color: #888; font-size: 14px; }
  .stat { text-align: center; width: 40px; font-weight: 700; font-size: 15px; }
  .cost { text-align: right; font-weight: 700; color: #8b0000; font-size: 14px; }
  .skills { font-size: 12px; color: #333; max-width: 260px; line-height: 1.3; }
  .name { font-weight: 600; font-size: 14px; }
  .pos { color: #555; white-space: nowrap; font-size: 13px; }
  .star-row { background: #fff8e7 !important; }
  .star-name { color: #1a5276; }
  .staff-section { margin-bottom: 14px; }
  .staff-title { font-size: 16px; font-weight: 700; color: #2a2a2a; margin-bottom: 8px; border-bottom: 2px solid #8b0000; padding-bottom: 4px; }
  .staff-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 32px; font-size: 14px; }
  .staff-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
  .staff-val { font-weight: 700; }
  .summary-bar { display: flex; gap: 32px; font-size: 14px; margin-bottom: 10px; padding: 8px 12px; background: #f5f5f5; border-radius: 4px; }
  .summary-label { font-weight: 700; color: #555; margin-right: 4px; }
  .footer { margin-top: 20px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
  .skills-ref-page { page-break-before: always; padding-top: 12px; }
  .skills-ref-title { font-size: 22px; color: #8b0000; margin-bottom: 14px; border-bottom: 2px solid #8b0000; padding-bottom: 6px; }
  .skills-ref-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
  .skills-ref-col { display: flex; flex-direction: column; }
  .ref-skill { margin-bottom: 8px; line-height: 1.35; }
  .ref-skill-name { font-weight: 700; font-size: 12px; color: #2a2a2a; display: block; }
  .ref-skill-desc { font-size: 11px; color: #444; display: block; }
  .pdf-spp { background: #c9a227; color: #1a1a1a; padding: 1px 5px; border-radius: 8px; font-size: 10px; font-weight: 700; margin-left: 4px; }
  .pdf-mng { background: #c62828; color: white; padding: 1px 5px; border-radius: 8px; font-size: 10px; font-weight: 700; margin-left: 4px; }
  @media print {
    body { padding: 12px; }
    @page { margin: 14mm; }
  }
</style>
</head><body>

<div class="header-bar">
  <div class="header-left">
    <h1>${roster.name || t.unnamedTeam}</h1>
    <div class="subtitle">${team.name} ${team.specialRules.length ? '| ' + team.specialRules.join(', ') : ''}</div>
  </div>
  <div class="tv-box">${t.pdfTeamValue} ${formatGold(tv)} gp</div>
</div>

<table>
  <thead>
    <tr>
      <th>#</th>
      <th>${t.name}</th>
      <th>${t.position}</th>
      ${statHeaders.map((h) => `<th style="text-align:center">${h}</th>`).join('')}
      <th>${t.skills}</th>
      <th style="text-align:right">${t.cost}</th>
    </tr>
  </thead>
  <tbody>
    ${playerRows}
    ${starRows}
    ${roster.players.length === 0 && (roster.starPlayers || []).length === 0 ? `<tr><td colspan="10" style="text-align:center;color:#999;padding:20px;font-size:14px">${t.noPlayers}</td></tr>` : ''}
  </tbody>
</table>

<div class="staff-section">
  <div class="staff-grid">
    <div class="staff-item"><span>${t.pdfRerolls}</span><span class="staff-val">${roster.rerolls} (${team.reroll.cost}k ${t.each})</span></div>
    <div class="staff-item"><span>${t.pdfCoaches}</span><span class="staff-val">${roster.assistantCoaches}</span></div>
    <div class="staff-item"><span>${t.pdfCheerleaders}</span><span class="staff-val">${roster.cheerleaders}</span></div>
    <div class="staff-item"><span>${t.pdfFans}</span><span class="staff-val">${roster.dedicatedFans}</span></div>
    <div class="staff-item"><span>${t.pdfApothecary}</span><span class="staff-val">${roster.apothecary ? t.yes : t.no}</span></div>
    <div class="staff-item"><span>${t.pdfTreasury}</span><span class="staff-val">${formatGold(roster.treasury)} gp</span></div>
  </div>
</div>

<div class="summary-bar">
  <div><span class="summary-label">${t.pdfPlayers}</span> ${roster.players.length}/16</div>
  <div><span class="summary-label">${t.pdfTeamValue}</span> ${formatGold(tv)} gp</div>
</div>

<div class="footer">${t.pdfFooter}</div>

${skillsRefPage}

<script>window.onload = function() { window.print(); }</script>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onafterprint = () => {
      URL.revokeObjectURL(url);
    };
  }
}
