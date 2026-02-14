import { useState, useCallback } from 'react';
import type { MatchReport, MatchSummary } from '../types';

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

export function useMatches() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/matches');
      setMatches(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMatch = useCallback(async (id: string): Promise<MatchReport | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/matches/${id}`);
      return res.data as MatchReport;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createMatch = useCallback(async (match: MatchReport): Promise<boolean> => {
    setError(null);
    try {
      await apiFetch('/api/matches', {
        method: 'POST',
        body: JSON.stringify({ id: match.id, data: match }),
      });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const updateMatch = useCallback(async (id: string, match: MatchReport): Promise<boolean> => {
    setError(null);
    try {
      await apiFetch(`/api/matches/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ data: match }),
      });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const shareMatch = useCallback(async (id: string): Promise<string | null> => {
    setError(null);
    try {
      const res = await apiFetch(`/api/matches/${id}/share`, { method: 'POST' });
      return res.shareId;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const unshareMatch = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await apiFetch(`/api/matches/${id}/share`, { method: 'DELETE' });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const fetchSharedMatch = useCallback(async (shareId: string): Promise<MatchReport | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/matches/shared/${shareId}`);
      return res.data as MatchReport;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMatch = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await apiFetch(`/api/matches/${id}`, { method: 'DELETE' });
      setMatches((prev) => prev.filter((m) => m.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  return { matches, loading, error, fetchMatches, fetchMatch, createMatch, updateMatch, deleteMatch, shareMatch, unshareMatch, fetchSharedMatch };
}
