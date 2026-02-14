import { useState, useCallback } from 'react';
import type {
  Competition,
  CompetitionSummary,
  CompetitionRoster,
  CompetitionRosterSummary,
  CompetitionMatch,
  CompetitionMatchSummary,
  CompetitionMatchData,
  StandingRow,
  Roster,
  CompetitionMatchStatus,
} from '../types';

const TOKEN_KEY = 'bb_token';

function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

async function apiFetch(url: string, opts: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.headers) Object.assign(headers, opts.headers);
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(url, { ...opts, headers });
  } catch {
    throw new Error('Network error — is the server running?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function useCompetitions() {
  const [competitions, setCompetitions] = useState<CompetitionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/competitions');
      setCompetitions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompetition = useCallback(async (id: string): Promise<Competition | null> => {
    setLoading(true);
    setError(null);
    try {
      return await apiFetch(`/api/competitions/${id}`);
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCompetition = useCallback(async (id: string, name: string, type: string, data?: any): Promise<boolean> => {
    setError(null);
    try {
      await apiFetch('/api/competitions', {
        method: 'POST',
        body: JSON.stringify({ id, name, type, data }),
      });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const updateCompetition = useCallback(async (id: string, updates: { name?: string; status?: string; data?: any }): Promise<boolean> => {
    setError(null);
    try {
      await apiFetch(`/api/competitions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const deleteCompetition = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await apiFetch(`/api/competitions/${id}`, { method: 'DELETE' });
      setCompetitions(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const fetchRosters = useCallback(async (compId: string): Promise<CompetitionRosterSummary[]> => {
    try {
      return await apiFetch(`/api/competitions/${compId}/rosters`);
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  const fetchRoster = useCallback(async (compId: string, rosterId: string): Promise<CompetitionRoster | null> => {
    try {
      return await apiFetch(`/api/competitions/${compId}/rosters/${rosterId}`);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const enrollRoster = useCallback(async (compId: string, roster: Roster): Promise<boolean> => {
    setError(null);
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    try {
      await apiFetch(`/api/competitions/${compId}/rosters`, {
        method: 'POST',
        body: JSON.stringify({
          id,
          originalRosterId: roster.id,
          name: roster.name,
          teamId: roster.teamId,
          teamName: roster.teamName,
          coachName: roster.coachName,
          data: roster,
        }),
      });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const removeRoster = useCallback(async (compId: string, rosterId: string): Promise<boolean> => {
    setError(null);
    try {
      await apiFetch(`/api/competitions/${compId}/rosters/${rosterId}`, { method: 'DELETE' });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const fetchMatches = useCallback(async (compId: string): Promise<CompetitionMatchSummary[]> => {
    try {
      return await apiFetch(`/api/competitions/${compId}/matches`);
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  const fetchMatch = useCallback(async (compId: string, matchId: string): Promise<CompetitionMatch | null> => {
    try {
      return await apiFetch(`/api/competitions/${compId}/matches/${matchId}`);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const createMatch = useCallback(async (
    compId: string,
    homeRosterId: string,
    awayRosterId: string,
    round: string,
    data: CompetitionMatchData
  ): Promise<boolean> => {
    setError(null);
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    try {
      await apiFetch(`/api/competitions/${compId}/matches`, {
        method: 'POST',
        body: JSON.stringify({ id, homeRosterId, awayRosterId, round, data }),
      });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const updateMatch = useCallback(async (compId: string, matchId: string, round: string, data: CompetitionMatchData): Promise<boolean> => {
    setError(null);
    try {
      await apiFetch(`/api/competitions/${compId}/matches/${matchId}`, {
        method: 'PUT',
        body: JSON.stringify({ round, data }),
      });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const deleteMatch = useCallback(async (compId: string, matchId: string): Promise<boolean> => {
    setError(null);
    try {
      await apiFetch(`/api/competitions/${compId}/matches/${matchId}`, { method: 'DELETE' });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const fetchStandings = useCallback(async (compId: string): Promise<StandingRow[]> => {
    try {
      return await apiFetch(`/api/competitions/${compId}/standings`);
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  // ─── Multi-user: join, schedule, my-matches, report ───

  const generateJoinCode = useCallback(async (compId: string): Promise<string | null> => {
    setError(null);
    try {
      const data = await apiFetch(`/api/competitions/${compId}/generate-code`, { method: 'POST' });
      return data.joinCode;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const removeJoinCode = useCallback(async (compId: string): Promise<boolean> => {
    setError(null);
    try {
      await apiFetch(`/api/competitions/${compId}/join-code`, { method: 'DELETE' });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const joinCompetition = useCallback(async (code: string): Promise<{ id: string; name: string; type: string; alreadyMember: boolean } | null> => {
    setError(null);
    try {
      return await apiFetch('/api/competitions/join', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const generateSchedule = useCallback(async (compId: string): Promise<{ matchesCreated: number; rounds: number } | null> => {
    setError(null);
    try {
      return await apiFetch(`/api/competitions/${compId}/schedule`, { method: 'POST' });
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const deleteSchedule = useCallback(async (compId: string): Promise<boolean> => {
    setError(null);
    try {
      await apiFetch(`/api/competitions/${compId}/schedule`, { method: 'DELETE' });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const fetchMyMatches = useCallback(async (compId: string): Promise<CompetitionMatchSummary[]> => {
    try {
      return await apiFetch(`/api/competitions/${compId}/my-matches`);
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  const reportMatch = useCallback(async (compId: string, matchId: string, data: CompetitionMatchData): Promise<boolean> => {
    setError(null);
    try {
      await apiFetch(`/api/competitions/${compId}/matches/${matchId}/report`, {
        method: 'POST',
        body: JSON.stringify({ data }),
      });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  return {
    competitions, loading, error,
    fetchCompetitions, fetchCompetition, createCompetition, updateCompetition, deleteCompetition,
    fetchRosters, fetchRoster, enrollRoster, removeRoster,
    fetchMatches, fetchMatch, createMatch, updateMatch, deleteMatch,
    fetchStandings,
    generateJoinCode, removeJoinCode, joinCompetition,
    generateSchedule, deleteSchedule,
    fetchMyMatches, reportMatch,
  };
}
