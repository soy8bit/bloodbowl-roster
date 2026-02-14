import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMatches } from '../../hooks/useMatches';
import { useLang } from '../../i18n';
import type { MatchReport, MatchPlayer } from '../../types';

function calcSPP(p: MatchPlayer): number {
  return p.tds * 3 + p.cas * 2 + (p.cp || 0) * 1 + (p.int || 0) * 2 + (p.def || 0) * 1 + (p.mvp ? 4 : 0);
}

interface TeamStats {
  name: string;
  race: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  tdFor: number;
  tdAgainst: number;
  casFor: number;
  totalSPP: number;
}

interface PlayerStats {
  name: string;
  position: string;
  teamName: string;
  games: number;
  tds: number;
  cas: number;
  cp: number;
  int: number;
  def: number;
  mvps: number;
  spp: number;
}

export default function MatchStats() {
  const { user } = useAuth();
  const { matches: summaries, fetchMatches, loading } = useMatches();
  const { t } = useLang();
  const navigate = useNavigate();
  const [allMatches, setAllMatches] = useState<MatchReport[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState<'teams' | 'players'>('teams');
  const { fetchMatch } = useMatches();

  useEffect(() => {
    if (user) fetchMatches();
  }, [user, fetchMatches]);

  useEffect(() => {
    if (summaries.length === 0) return;
    setLoadingDetail(true);
    Promise.all(summaries.map((s) => fetchMatch(s.id))).then((results) => {
      setAllMatches(results.filter(Boolean) as MatchReport[]);
      setLoadingDetail(false);
    });
  }, [summaries, fetchMatch]);

  const competitions = useMemo(() => {
    const set = new Set<string>();
    allMatches.forEach((m) => { if (m.competition) set.add(m.competition); });
    return Array.from(set).sort();
  }, [allMatches]);

  const filtered = useMemo(() => {
    if (!filter) return allMatches;
    return allMatches.filter((m) => m.competition === filter);
  }, [allMatches, filter]);

  const teamStats = useMemo(() => {
    const map = new Map<string, TeamStats>();

    const getOrCreate = (rosterId: string, name: string, race: string): TeamStats => {
      let s = map.get(rosterId);
      if (!s) {
        s = { name, race, played: 0, wins: 0, draws: 0, losses: 0, tdFor: 0, tdAgainst: 0, casFor: 0, totalSPP: 0 };
        map.set(rosterId, s);
      }
      return s;
    };

    for (const m of filtered) {
      const home = getOrCreate(m.homeTeam.rosterId, m.homeTeam.name, m.homeTeam.race);
      const away = getOrCreate(m.awayTeam.rosterId, m.awayTeam.name, m.awayTeam.race);

      home.played++;
      away.played++;
      home.tdFor += m.homeScore;
      home.tdAgainst += m.awayScore;
      away.tdFor += m.awayScore;
      away.tdAgainst += m.homeScore;
      home.casFor += m.homeTeam.players.reduce((s, p) => s + p.cas, 0);
      away.casFor += m.awayTeam.players.reduce((s, p) => s + p.cas, 0);
      home.totalSPP += m.homeTeam.players.reduce((s, p) => s + calcSPP(p), 0);
      away.totalSPP += m.awayTeam.players.reduce((s, p) => s + calcSPP(p), 0);

      if (m.homeScore > m.awayScore) { home.wins++; away.losses++; }
      else if (m.homeScore < m.awayScore) { away.wins++; home.losses++; }
      else { home.draws++; away.draws++; }
    }

    return Array.from(map.values()).sort((a, b) => {
      const ptsA = a.wins * 3 + a.draws;
      const ptsB = b.wins * 3 + b.draws;
      if (ptsB !== ptsA) return ptsB - ptsA;
      return (b.tdFor - b.tdAgainst) - (a.tdFor - a.tdAgainst);
    });
  }, [filtered]);

  const playerStats = useMemo(() => {
    const map = new Map<string, PlayerStats>();

    for (const m of filtered) {
      for (const team of [m.homeTeam, m.awayTeam]) {
        for (const p of team.players) {
          const key = `${team.rosterId}:${p.uid}`;
          let s = map.get(key);
          if (!s) {
            s = { name: p.name, position: p.position, teamName: team.name, games: 0, tds: 0, cas: 0, cp: 0, int: 0, def: 0, mvps: 0, spp: 0 };
            map.set(key, s);
          }
          s.games++;
          s.tds += p.tds;
          s.cas += p.cas;
          s.cp += p.cp || 0;
          s.int += p.int || 0;
          s.def += p.def || 0;
          if (p.mvp) s.mvps++;
          s.spp += calcSPP(p);
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.spp - a.spp);
  }, [filtered]);

  if (!user) {
    return (
      <div className="matches-page">
        <h2 className="matches-title">{t.matchStatsTitle}</h2>
        <div className="matches-empty">
          <p>{t.matchLoginRequired}</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>{t.navLogin}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="matches-page">
      <div className="matches-header">
        <h2 className="matches-title">{t.matchStatsTitle}</h2>
      </div>

      {(loading || loadingDetail) && <div className="matches-loading">...</div>}

      {!loading && !loadingDetail && allMatches.length === 0 && (
        <div className="matches-empty">
          <p>{t.matchNoMatches}</p>
        </div>
      )}

      {allMatches.length > 0 && (
        <>
          <div className="match-stats-controls">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="match-stats-filter">
              <option value="">{t.matchStatsAll}</option>
              {competitions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="match-stats-tabs">
              <button className={`match-stats-tab ${tab === 'teams' ? 'active' : ''}`} onClick={() => setTab('teams')}>
                {t.matchStatsTeams}
              </button>
              <button className={`match-stats-tab ${tab === 'players' ? 'active' : ''}`} onClick={() => setTab('players')}>
                {t.matchStatsPlayers}
              </button>
            </div>
          </div>

          {tab === 'teams' && (
            <div className="match-events-table-wrap">
              <table className="match-events-table">
                <thead>
                  <tr>
                    <th>{t.name}</th>
                    <th>{t.matchStatsRace}</th>
                    <th title={t.tipP}>{t.matchStatsP}</th>
                    <th title={t.tipW}>{t.matchStatsW}</th>
                    <th title={t.tipD}>{t.matchStatsD}</th>
                    <th title={t.tipL}>{t.matchStatsL}</th>
                    <th title={t.tipTDF}>{t.matchStatsTDF}</th>
                    <th title={t.tipTDA}>{t.matchStatsTDA}</th>
                    <th title={t.tipCAS}>{t.matchStatsCAS}</th>
                    <th title={t.tipSPP}>{t.matchSPP}</th>
                    <th title={t.tipPts}>{t.matchStatsPts}</th>
                  </tr>
                </thead>
                <tbody>
                  {teamStats.map((s, i) => (
                    <tr key={i}>
                      <td><strong>{s.name}</strong></td>
                      <td className="muted">{s.race}</td>
                      <td className="center">{s.played}</td>
                      <td className="center">{s.wins}</td>
                      <td className="center">{s.draws}</td>
                      <td className="center">{s.losses}</td>
                      <td className="center">{s.tdFor}</td>
                      <td className="center">{s.tdAgainst}</td>
                      <td className="center">{s.casFor}</td>
                      <td className="center match-spp-cell">{s.totalSPP}</td>
                      <td className="center"><strong>{s.wins * 3 + s.draws}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'players' && (
            <div className="match-events-table-wrap">
              <table className="match-events-table">
                <thead>
                  <tr>
                    <th>{t.name}</th>
                    <th>{t.position}</th>
                    <th>{t.matchStatsTeam}</th>
                    <th title={t.tipGP}>{t.matchStatsGames}</th>
                    <th title={t.tipTD}>{t.matchTD}</th>
                    <th title={t.tipCAS}>{t.matchCAS}</th>
                    <th title={t.tipCP}>{t.matchCP}</th>
                    <th title={t.tipINT}>{t.matchINT}</th>
                    <th title={t.tipDEF}>{t.matchDEF}</th>
                    <th title={t.tipMVP}>{t.matchMVP}</th>
                    <th title={t.tipSPP}>{t.matchSPP}</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.slice(0, 50).map((s, i) => (
                    <tr key={i}>
                      <td><strong>{s.name}</strong></td>
                      <td className="muted">{s.position}</td>
                      <td className="muted">{s.teamName}</td>
                      <td className="center">{s.games}</td>
                      <td className="center">{s.tds || '-'}</td>
                      <td className="center">{s.cas || '-'}</td>
                      <td className="center">{s.cp || '-'}</td>
                      <td className="center">{s.int || '-'}</td>
                      <td className="center">{s.def || '-'}</td>
                      <td className="center">{s.mvps || '-'}</td>
                      <td className="center match-spp-cell"><strong>{s.spp}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
