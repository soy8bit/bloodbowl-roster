import type { MatchReport, MatchPlayer } from '../types';
import { getStrings, type Lang } from '../i18n';

function calcSPP(p: MatchPlayer): number {
  return p.tds * 3 + p.cas * 2 + (p.cp || 0) * 1 + (p.int || 0) * 2 + (p.def || 0) * 1 + (p.mvp ? 4 : 0);
}

export function exportMatchPdf(match: MatchReport, lang: Lang = 'en'): void {
  const t = getStrings(lang);

  const renderTeamTable = (team: typeof match.homeTeam, label: string) => {
    const rows = team.players
      .map(
        (p, i) =>
          `<tr class="${p.tds > 0 || p.cas > 0 || (p.cp || 0) > 0 || (p.int || 0) > 0 || (p.def || 0) > 0 || p.mvp ? 'highlight' : ''}">
            <td class="num">${i + 1}</td>
            <td class="name">${p.name}</td>
            <td class="pos">${p.position}</td>
            <td class="stat">${p.tds || '-'}</td>
            <td class="stat">${p.cas || '-'}</td>
            <td class="stat">${(p.cp || 0) || '-'}</td>
            <td class="stat">${(p.int || 0) || '-'}</td>
            <td class="stat">${(p.def || 0) || '-'}</td>
            <td class="stat">${p.mvp ? '\u2605' : '-'}</td>
            <td class="stat spp">${calcSPP(p) || '-'}</td>
          </tr>`,
      )
      .join('\n');

    const totalTds = team.players.reduce((s, p) => s + p.tds, 0);
    const totalCas = team.players.reduce((s, p) => s + p.cas, 0);
    const totalCp = team.players.reduce((s, p) => s + (p.cp || 0), 0);
    const totalInt = team.players.reduce((s, p) => s + (p.int || 0), 0);
    const totalDef = team.players.reduce((s, p) => s + (p.def || 0), 0);
    const totalMvp = team.players.filter((p) => p.mvp).length;
    const totalSpp = team.players.reduce((s, p) => s + calcSPP(p), 0);

    return `
      <div class="team-section">
        <h2>${label}: ${team.name} <span class="race">(${team.race})</span></h2>
        ${team.coach ? `<div class="coach">${t.coach}: ${team.coach}</div>` : ''}
        <table>
          <thead><tr>
            <th>#</th><th>${t.name}</th><th>${t.position}</th>
            <th>${t.matchTD}</th><th>${t.matchCAS}</th><th>${t.matchCP}</th><th>${t.matchINT}</th><th>${t.matchDEF}</th><th>${t.matchMVP}</th><th>${t.matchSPP}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr>
            <td></td><td><strong>${t.matchTotal}</strong></td><td></td>
            <td class="stat">${totalTds}</td><td class="stat">${totalCas}</td>
            <td class="stat">${totalCp}</td><td class="stat">${totalInt}</td><td class="stat">${totalDef}</td>
            <td class="stat">${totalMvp}</td><td class="stat spp"><strong>${totalSpp}</strong></td>
          </tr></tfoot>
        </table>
      </div>`;
  };

  const title = match.competition
    ? `${match.competition}${match.round ? ' - ' + match.round : ''}`
    : t.matchesTitle;

  const html = `<!DOCTYPE html>
<html lang="${lang}"><head>
<meta charset="UTF-8">
<title>${match.homeTeam.name} vs ${match.awayTeam.name} - ${t.matchesTitle}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #1a1a1a; font-size: 14px; line-height: 1.4; }
  .header { text-align: center; margin-bottom: 20px; }
  .header h1 { font-size: 22px; color: #8b0000; margin-bottom: 4px; }
  .header .date { color: #555; font-size: 14px; }
  .scoreboard { display: flex; align-items: center; justify-content: center; gap: 24px; margin-bottom: 24px; padding: 16px; background: #f5f5f5; border-radius: 6px; }
  .scoreboard .side { text-align: center; flex: 1; }
  .scoreboard .team-name { font-size: 18px; font-weight: 700; }
  .scoreboard .team-race { font-size: 12px; color: #666; }
  .scoreboard .big-score { font-size: 36px; font-weight: 900; color: #8b0000; }
  .team-section { margin-bottom: 20px; }
  .team-section h2 { font-size: 16px; color: #2a2a2a; border-bottom: 2px solid #8b0000; padding-bottom: 4px; margin-bottom: 8px; }
  .race { font-weight: 400; color: #666; font-size: 14px; }
  .coach { color: #555; font-size: 13px; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th { background: #2a2a2a; color: white; padding: 6px 8px; text-align: left; font-size: 12px; text-transform: uppercase; }
  td { padding: 5px 8px; border-bottom: 1px solid #ddd; font-size: 13px; }
  tr:nth-child(even) { background: #f7f7f7; }
  .highlight { background: #fff8e7 !important; }
  .num { width: 30px; text-align: center; color: #888; }
  .stat { text-align: center; width: 45px; font-weight: 600; }
  .spp { color: #8b0000; }
  .name { font-weight: 600; }
  .pos { color: #555; font-size: 12px; }
  tfoot td { border-top: 2px solid #333; font-size: 13px; }
  .notes { margin-top: 12px; padding: 10px; background: #f9f9f9; border-left: 3px solid #8b0000; font-size: 13px; }
  .footer { margin-top: 20px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
  @media print { body { padding: 12px; } @page { margin: 14mm; } }
</style>
</head><body>

<div class="header">
  <h1>${title}</h1>
  <div class="date">${match.date}</div>
</div>

<div class="scoreboard">
  <div class="side">
    <div class="team-name">${match.homeTeam.name}</div>
    <div class="team-race">${match.homeTeam.race}</div>
  </div>
  <div class="big-score">${match.homeScore} - ${match.awayScore}</div>
  <div class="side">
    <div class="team-name">${match.awayTeam.name}</div>
    <div class="team-race">${match.awayTeam.race}</div>
  </div>
</div>

${renderTeamTable(match.homeTeam, t.matchHomeTeam)}
${renderTeamTable(match.awayTeam, t.matchAwayTeam)}

${match.notes ? `<div class="notes"><strong>${t.matchNotes}:</strong> ${match.notes}</div>` : ''}

<div class="footer">Blood Bowl Match Report — ${t.matchesTitle}</div>

<script>window.onload = function() { window.print(); }</script>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onafterprint = () => URL.revokeObjectURL(url);
  }
}
