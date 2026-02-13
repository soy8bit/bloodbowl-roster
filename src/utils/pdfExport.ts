import type { Roster, TeamData } from '../types';
import { calculateTeamValue, formatStat, formatGold } from './rosterUtils';
import { getStrings, type Lang } from '../i18n';
import starPlayersRaw from '../data/starPlayers.json';
import type { StarPlayerData } from '../types';

const allStarPlayers = starPlayersRaw as StarPlayerData[];

export function exportRosterPdf(
  roster: Roster,
  team: TeamData,
  skills: Record<string, { name: string; nameEs: string; category: string }>,
  lang: Lang = 'en',
): void {
  const t = getStrings(lang);
  const tv = calculateTeamValue(roster, team);
  const statHeaders = ['MA', 'ST', 'AG', 'PA', 'AV'];

  const playerRows = roster.players
    .map((p, i) => {
      const skillNames = p.skills
        .map((id) => {
          const s = skills[String(id)];
          if (!s) return '';
          return lang === 'es' ? s.nameEs : s.name;
        })
        .filter(Boolean)
        .join(', ');
      const stats = p.playerStats
        .map((s, si) => `<td class="stat">${formatStat(s, si)}</td>`)
        .join('');
      return `<tr>
        <td class="num">${i + 1}</td>
        <td class="name">${p.name || p.position}</td>
        <td class="pos">${p.position}</td>
        ${stats}
        <td class="skills">${skillNames}</td>
        <td class="cost">${p.cost}k</td>
      </tr>`;
    })
    .join('\n');

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
  .star-name { color: #8b6914; }
  .staff-section { margin-bottom: 14px; }
  .staff-title { font-size: 16px; font-weight: 700; color: #2a2a2a; margin-bottom: 8px; border-bottom: 2px solid #8b0000; padding-bottom: 4px; }
  .staff-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 32px; font-size: 14px; }
  .staff-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
  .staff-val { font-weight: 700; }
  .summary-bar { display: flex; gap: 32px; font-size: 14px; margin-bottom: 10px; padding: 8px 12px; background: #f5f5f5; border-radius: 4px; }
  .summary-label { font-weight: 700; color: #555; margin-right: 4px; }
  .footer { margin-top: 20px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
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
