import { useState, useCallback } from 'react';

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

export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  isAdmin: boolean;
  plan: string;
  planUntil: string | null;
  isPremium: boolean;
  hasStripe: boolean;
  createdAt: string;
}

export interface CloudRoster {
  id: string;
  name: string;
  team_id: string;
  team_name: string;
  share_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchSummaryAccount {
  id: string;
  date: string;
  competition?: string;
  round?: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  createdAt: string;
}

export interface CompetitionSummary {
  id: string;
  name: string;
  type: string;
  status: string;
  isOwner: boolean;
  role: string;
  joinedAt: string;
  createdAt: string;
}

export function useAccount() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rosters, setRosters] = useState<CloudRoster[]>([]);
  const [matches, setMatches] = useState<MatchSummaryAccount[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/me');
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDisplayName = useCallback(async (displayName: string) => {
    setError(null);
    try {
      await apiFetch('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ displayName }),
      });
      setProfile((prev) => prev ? { ...prev, displayName } : prev);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const fetchRosters = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch('/api/me/rosters');
      setRosters(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const fetchMatches = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch('/api/me/matches');
      setMatches(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const fetchCompetitions = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch('/api/me/competitions');
      setCompetitions(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, r, m, c] = await Promise.all([
        apiFetch('/api/me'),
        apiFetch('/api/me/rosters'),
        apiFetch('/api/me/matches'),
        apiFetch('/api/me/competitions'),
      ]);
      setProfile(p);
      setRosters(r);
      setMatches(m);
      setCompetitions(c);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profile, rosters, matches, competitions,
    loading, error,
    fetchProfile, fetchRosters, fetchMatches, fetchCompetitions, fetchAll,
    updateDisplayName,
  };
}
