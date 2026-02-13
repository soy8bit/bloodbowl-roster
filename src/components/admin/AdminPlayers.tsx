import { useState, useEffect, useMemo } from 'react';
import type { PlayerData, TeamData } from '../../types';
import SkillMultiSelect from './SkillMultiSelect';

const TOKEN_KEY = 'bb_token';

function emptyPlayer(nextId: number): PlayerData {
  return { id: nextId, position: '', playerStats: [6, 3, 3, 4, 8], cost: 50, skills: [] };
}

export default function AdminPlayers() {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [collapsedTeams, setCollapsedTeams] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch('/api/game-data/players').then((r) => r.json()),
      fetch('/api/game-data/teams').then((r) => r.json()),
    ])
      .then(([pd, td]) => {
        setPlayers(pd.data || []);
        setTeams(td.data || []);
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load data' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  // Build a map of playerId -> player for quick lookup
  const playerMap = useMemo(() => {
    const map = new Map<number, PlayerData>();
    players.forEach((p) => map.set(p.id, p));
    return map;
  }, [players]);

  // Players grouped by team
  const groupedByTeam = useMemo(() => {
    const groups: { team: TeamData; players: PlayerData[] }[] = [];
    const assignedIds = new Set<number>();

    for (const team of teams) {
      const teamPlayers: PlayerData[] = [];
      for (const slot of team.players) {
        const player = playerMap.get(slot.id);
        if (player) {
          teamPlayers.push(player);
          assignedIds.add(player.id);
        }
      }
      groups.push({ team, players: teamPlayers });
    }

    // Unassigned players
    const unassigned = players.filter((p) => !assignedIds.has(p.id));
    if (unassigned.length > 0) {
      groups.push({
        team: { name: 'Unassigned', id: '__unassigned__', players: [], reroll: { cost: 0, max: 0 }, allowedApothecary: false, tier: 0, specialRules: [] },
        players: unassigned,
      });
    }

    return groups;
  }, [teams, playerMap, players]);

  const updatePlayer = (playerId: number, field: string, value: any) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, [field]: value } : p))
    );
  };

  const updateStat = (playerId: number, statIndex: number, value: number) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        const stats = [...p.playerStats] as [number, number, number, number, number];
        stats[statIndex] = value;
        return { ...p, playerStats: stats };
      })
    );
  };

  const updateSkills = (playerId: number, skills: number[]) => {
    updatePlayer(playerId, 'skills', skills);
  };

  const addPlayer = (teamId: string) => {
    const maxId = players.reduce((max, p) => Math.max(max, p.id), 0);
    const newPlayer = emptyPlayer(maxId + 1);
    setPlayers((prev) => [...prev, newPlayer]);
    // Also add the player slot to the team
    if (teamId !== '__unassigned__') {
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId
            ? { ...t, players: [...t.players, { id: newPlayer.id, max: 16 }] }
            : t
        )
      );
    }
  };

  const removePlayer = (playerId: number) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    // Also remove from any team slots
    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        players: t.players.filter((s) => s.id !== playerId),
      }))
    );
  };

  const toggleCollapse = (teamId: string) => {
    setCollapsedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      // Save both players and teams (since adding players modifies team slots)
      const [resP, resT] = await Promise.all([
        fetch('/api/game-data/players', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ data: players }),
        }),
        fetch('/api/game-data/teams', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ data: teams }),
        }),
      ]);
      if (!resP.ok) throw new Error((await resP.json()).error);
      if (!resT.ok) throw new Error((await resT.json()).error);
      setMessage({ type: 'success', text: 'Players saved successfully' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading players...</div>;

  const statLabels = ['MA', 'ST', 'AG', 'PA', 'AV'];

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Players ({players.length})</h2>
        <div className="admin-actions">
          <button className="btn-admin-save" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      {message && (
        <div className={`admin-message admin-message-${message.type}`}>{message.text}</div>
      )}

      {groupedByTeam.map(({ team, players: teamPlayers }) => {
        const isCollapsed = collapsedTeams.has(team.id);
        return (
          <div key={team.id} className="admin-team-group">
            <div className="admin-team-header" onClick={() => toggleCollapse(team.id)}>
              <span className="admin-team-collapse">{isCollapsed ? '▸' : '▾'}</span>
              <h3 className="admin-team-name">{team.name}</h3>
              <span className="admin-team-count">{teamPlayers.length} players</span>
              <button
                className="btn-admin-add btn-admin-add-sm"
                onClick={(e) => { e.stopPropagation(); addPlayer(team.id); }}
              >
                + Add
              </button>
            </div>
            {!isCollapsed && (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Position</th>
                      {statLabels.map((s) => <th key={s}>{s}</th>)}
                      <th>Cost</th>
                      <th>Skills</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPlayers.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <input
                            type="number"
                            className="admin-input admin-input-sm"
                            value={p.id}
                            onChange={(e) => updatePlayer(p.id, 'id', parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="admin-input"
                            value={p.position}
                            onChange={(e) => updatePlayer(p.id, 'position', e.target.value)}
                          />
                        </td>
                        {p.playerStats.map((stat, si) => (
                          <td key={si}>
                            <input
                              type="number"
                              className="admin-input admin-input-sm"
                              value={stat}
                              onChange={(e) => updateStat(p.id, si, parseInt(e.target.value) || 0)}
                            />
                          </td>
                        ))}
                        <td>
                          <input
                            type="number"
                            className="admin-input admin-input-sm"
                            value={p.cost}
                            onChange={(e) => updatePlayer(p.id, 'cost', parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className="admin-skills-cell">
                          <SkillMultiSelect
                            selected={p.skills}
                            onChange={(skills) => updateSkills(p.id, skills)}
                          />
                        </td>
                        <td>
                          <button className="btn-remove" onClick={() => removePlayer(p.id)} title="Remove">-</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
