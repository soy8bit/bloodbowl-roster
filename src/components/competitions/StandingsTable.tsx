import { useLang } from '../../i18n';
import AppTooltip from '../AppTooltip';
import type { StandingRow } from '../../types';

interface Props {
  standings: StandingRow[];
}

export default function StandingsTable({ standings }: Props) {
  const { t } = useLang();

  if (standings.length === 0) {
    return <p className="comp-empty-state">{t.compNoRosters}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>{t.compStandingsTeam}</th>
            <th>{t.compStandingsCoach}</th>
            <th>{t.compStandingsRace}</th>
            <th><AppTooltip content={t.tipP}><span tabIndex={0} className="cursor-help">{t.matchStatsP}</span></AppTooltip></th>
            <th><AppTooltip content={t.tipW}><span tabIndex={0} className="cursor-help">{t.matchStatsW}</span></AppTooltip></th>
            <th><AppTooltip content={t.tipD}><span tabIndex={0} className="cursor-help">{t.matchStatsD}</span></AppTooltip></th>
            <th><AppTooltip content={t.tipL}><span tabIndex={0} className="cursor-help">{t.matchStatsL}</span></AppTooltip></th>
            <th><AppTooltip content={t.tipTDF}><span tabIndex={0} className="cursor-help">{t.matchStatsTDF}</span></AppTooltip></th>
            <th><AppTooltip content={t.tipTDA}><span tabIndex={0} className="cursor-help">{t.matchStatsTDA}</span></AppTooltip></th>
            <th><AppTooltip content={t.tipDiff}><span tabIndex={0} className="cursor-help">+/-</span></AppTooltip></th>
            <th><AppTooltip content={t.tipCAS}><span tabIndex={0} className="cursor-help">{t.matchStatsCAS}</span></AppTooltip></th>
            <th><AppTooltip content={t.tipPts}><span tabIndex={0} className="cursor-help">{t.matchStatsPts}</span></AppTooltip></th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, idx) => (
            <tr key={row.rosterId} className="standings-row">
              <td className="standings-pos">{idx + 1}</td>
              <td className="standings-team">{row.teamName}</td>
              <td>{row.coachName}</td>
              <td>{row.race}</td>
              <td>{row.played}</td>
              <td>{row.won}</td>
              <td>{row.drawn}</td>
              <td>{row.lost}</td>
              <td>{row.tdFor}</td>
              <td>{row.tdAgainst}</td>
              <td className={row.tdDiff > 0 ? 'td-positive' : row.tdDiff < 0 ? 'td-negative' : ''}>{row.tdDiff > 0 ? `+${row.tdDiff}` : row.tdDiff}</td>
              <td>{row.casFor}</td>
              <td className="standings-pts">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
