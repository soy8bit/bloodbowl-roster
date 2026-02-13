import type { Roster, TeamData } from '../types';
import { calculateTeamValue, formatStat, formatGold } from './rosterUtils';
import { getStrings, type Lang } from '../i18n';

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

  const html = `<!DOCTYPE html>
<html lang="${lang}"><head>
<meta charset="UTF-8">
<title>${roster.name || roster.teamName} - ${t.pdfTitle}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1a1a1a; font-size: 11px; }
  h1 { font-size: 22px; margin-bottom: 2px; color: #8b0000; }
  .subtitle { color: #555; font-size: 12px; margin-bottom: 12px; }
  .meta-row { display: flex; gap: 24px; margin-bottom: 14px; font-size: 11px; }
  .meta-item { display: flex; gap: 4px; }
  .meta-label { font-weight: 700; color: #555; }
  .tv-box { background: #8b0000; color: white; padding: 6px 16px; border-radius: 4px; font-size: 16px; font-weight: 700; display: inline-block; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  th { background: #2a2a2a; color: white; padding: 5px 6px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
  td { padding: 4px 6px; border-bottom: 1px solid #ddd; }
  tr:nth-child(even) { background: #f7f7f7; }
  .num { width: 24px; text-align: center; color: #888; }
  .stat { text-align: center; width: 30px; font-weight: 600; }
  .cost { text-align: right; font-weight: 600; color: #8b0000; }
  .skills { font-size: 9px; color: #444; max-width: 220px; }
  .name { font-weight: 500; }
  .pos { color: #555; white-space: nowrap; }
  .staff-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; font-size: 11px; margin-bottom: 10px; }
  .staff-item { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #eee; }
  .staff-val { font-weight: 700; }
  .footer { margin-top: 16px; font-size: 9px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 8px; }
  @media print {
    body { padding: 10px; }
    @page { margin: 12mm; }
  }
</style>
</head><body>

<h1>${roster.name || t.unnamedTeam}</h1>
<div class="subtitle">${team.name} ${team.specialRules.length ? '| ' + team.specialRules.join(', ') : ''}</div>
<div class="tv-box">${t.pdfTeamValue} ${formatGold(tv)} gp</div>

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
    ${roster.players.length === 0 ? `<tr><td colspan="10" style="text-align:center;color:#999;padding:16px">${t.noPlayers}</td></tr>` : ''}
  </tbody>
</table>

<div class="staff-grid">
  <div class="staff-item"><span>${t.pdfRerolls}</span><span class="staff-val">${roster.rerolls} (${team.reroll.cost}k ${t.each})</span></div>
  <div class="staff-item"><span>${t.pdfCoaches}</span><span class="staff-val">${roster.assistantCoaches}</span></div>
  <div class="staff-item"><span>${t.pdfCheerleaders}</span><span class="staff-val">${roster.cheerleaders}</span></div>
  <div class="staff-item"><span>${t.pdfFans}</span><span class="staff-val">${roster.dedicatedFans}</span></div>
  <div class="staff-item"><span>${t.pdfApothecary}</span><span class="staff-val">${roster.apothecary ? t.yes : t.no}</span></div>
  <div class="staff-item"><span>${t.pdfTreasury}</span><span class="staff-val">${formatGold(roster.treasury)} gp</span></div>
</div>

<div class="meta-row">
  <div class="meta-item"><span class="meta-label">${t.pdfPlayers}</span> ${roster.players.length}/16</div>
  <div class="meta-item"><span class="meta-label">${t.pdfTeamValue}</span> ${formatGold(tv)} gp</div>
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
