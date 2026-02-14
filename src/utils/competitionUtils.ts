import type { CompetitionMatchPlayer, CompetitionMatch, CompetitionRosterSummary, StandingRow } from '../types';

export function calcMatchPlayerSPP(p: CompetitionMatchPlayer): number {
  return p.tds * 3 + p.cas * 2 + p.cp * 1 + p.int * 2 + p.def * 1 + (p.mvp ? 4 : 0);
}

export function calcTeamSPP(players: CompetitionMatchPlayer[]): number {
  return players.reduce((sum, p) => sum + calcMatchPlayerSPP(p), 0);
}

export function buildStandings(matches: CompetitionMatch[], rosters: CompetitionRosterSummary[]): StandingRow[] {
  const map = new Map<string, StandingRow>();

  for (const r of rosters) {
    map.set(r.id, {
      rosterId: r.id,
      teamName: r.name,
      coachName: r.coachName,
      race: r.teamName,
      played: 0, won: 0, drawn: 0, lost: 0,
      tdFor: 0, tdAgainst: 0, tdDiff: 0, casFor: 0, points: 0,
    });
  }

  for (const match of matches) {
    const d = match.data;
    const homeId = match.homeRosterId;
    const awayId = match.awayRosterId;
    const hs = d.homeScore;
    const as_ = d.awayScore;

    const homeCas = d.homeTeam.players.reduce((s, p) => s + p.cas, 0);
    const awayCas = d.awayTeam.players.reduce((s, p) => s + p.cas, 0);

    const home = map.get(homeId);
    const away = map.get(awayId);

    if (home) {
      home.played++;
      home.tdFor += hs;
      home.tdAgainst += as_;
      home.casFor += homeCas;
      if (hs > as_) { home.won++; home.points += 3; }
      else if (hs === as_) { home.drawn++; home.points += 1; }
      else { home.lost++; }
    }

    if (away) {
      away.played++;
      away.tdFor += as_;
      away.tdAgainst += hs;
      away.casFor += awayCas;
      if (as_ > hs) { away.won++; away.points += 3; }
      else if (as_ === hs) { away.drawn++; away.points += 1; }
      else { away.lost++; }
    }
  }

  return Array.from(map.values())
    .map(s => ({ ...s, tdDiff: s.tdFor - s.tdAgainst }))
    .sort((a, b) => b.points - a.points || b.tdDiff - a.tdDiff || b.tdFor - a.tdFor);
}
