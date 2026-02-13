import { useState, useEffect, useMemo } from 'react';
import type { TeamData, PlayerData } from '../../types';

const TOKEN_KEY = 'bb_token';

function emptyTeam(): TeamData {
  return {
    name: '',
    id: '',
    players: [],
    reroll: { cost: 60, max: 8 },
    allowedApothecary: true,
    tier: 1,
    specialRules: [],
  };
}

export default function AdminTeams() {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/game-data/teams').then((r) => r.json()),
      fetch('/api/game-data/players').then((r) => r.json()),
    ])
      .then(([td, pd]) => {
        setTeams(td.data || []);
        setAllPlayers(pd.data || []);
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

  const playerMap = useMemo(() => {
    const map = new Map<number, PlayerData>();
    allPlayers.forEach((p) => map.set(p.id, p));
    return map;
  }, [allPlayers]);

  const updateTeam = (index: number, field: string, value: any) => {
    setTeams((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateReroll = (index: number, field: 'cost' | 'max', value: number) => {
    setTeams((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], reroll: { ...next[index].reroll, [field]: value } };
      return next;
    });
  };

  const updatePlayerSlot = (teamIndex: number, slotIndex: number, field: 'id' | 'max', value: number) => {
    setTeams((prev) => {
      const next = [...prev];
      const players = [...next[teamIndex].players];
      players[slotIndex] = { ...players[slotIndex], [field]: value };
      next[teamIndex] = { ...next[teamIndex], players };
      return next;
    });
  };

  const addPlayerSlot = (teamIndex: number) => {
    setTeams((prev) => {
      const next = [...prev];
      next[teamIndex] = {
        ...next[teamIndex],
        players: [...next[teamIndex].players, { id: 0, max: 16 }],
      };
      return next;
    });
  };

  const removePlayerSlot = (teamIndex: number, slotIndex: number) => {
    setTeams((prev) => {
      const next = [...prev];
      next[teamIndex] = {
        ...next[teamIndex],
        players: next[teamIndex].players.filter((_, i) => i !== slotIndex),
      };
      return next;
    });
  };

  const updateSpecialRules = (index: number, value: string) => {
    updateTeam(index, 'specialRules', value.split(',').map((s) => s.trim()).filter(Boolean));
  };

  const addRow = () => {
    setTeams((prev) => [...prev, emptyTeam()]);
    setExpandedTeam(teams.length);
  };
  const removeRow = (index: number) => {
    setTeams((prev) => prev.filter((_, i) => i !== index));
    setExpandedTeam(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch('/api/game-data/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data: teams }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMessage({ type: 'success', text: 'Teams saved successfully' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading teams...</div>;

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Teams ({teams.length})</h2>
        <div className="admin-actions">
          <button className="btn-admin-add" onClick={addRow}>+ Add Team</button>
          <button className="btn-admin-save" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      {message && (
        <div className={`admin-message admin-message-${message.type}`}>{message.text}</div>
      )}

      <div className="admin-star-list">
        {teams.map((t, i) => {
          const isExpanded = expandedTeam === i;
          return (
            <div key={i} className={`admin-star-card ${isExpanded ? 'expanded' : ''}`}>
              <div
                className="admin-star-summary"
                onClick={() => setExpandedTeam(isExpanded ? null : i)}
              >
                <span className="admin-star-name">{t.name || '(unnamed)'}</span>
                <span className="admin-star-cost">Tier {t.tier}</span>
                <span className="admin-star-stats">
                  <span className="admin-star-stat">Players: {t.players.length}</span>
                  <span className="admin-star-stat">Reroll: {t.reroll.cost}k</span>
                  <span className="admin-star-stat">{t.allowedApothecary ? 'Apo' : 'No Apo'}</span>
                </span>
                <span className="admin-star-expand">{isExpanded ? '▾' : '▸'}</span>
              </div>
              {isExpanded && (
                <div className="admin-star-details">
                  <div className="admin-star-row">
                    <label>ID</label>
                    <input
                      type="text"
                      className="admin-input admin-input-sm"
                      value={t.id}
                      onChange={(e) => updateTeam(i, 'id', e.target.value)}
                    />
                  </div>
                  <div className="admin-star-row">
                    <label>Name</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={t.name}
                      onChange={(e) => updateTeam(i, 'name', e.target.value)}
                    />
                  </div>
                  <div className="admin-star-row admin-star-stats-row">
                    <div className="admin-star-stat-input">
                      <label>Reroll Cost</label>
                      <input
                        type="number"
                        className="admin-input admin-input-sm"
                        value={t.reroll.cost}
                        onChange={(e) => updateReroll(i, 'cost', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="admin-star-stat-input">
                      <label>Reroll Max</label>
                      <input
                        type="number"
                        className="admin-input admin-input-sm"
                        value={t.reroll.max}
                        onChange={(e) => updateReroll(i, 'max', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="admin-star-stat-input">
                      <label>Tier</label>
                      <input
                        type="number"
                        className="admin-input admin-input-sm"
                        value={t.tier}
                        onChange={(e) => updateTeam(i, 'tier', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="admin-star-stat-input">
                      <label>Apothecary</label>
                      <input
                        type="checkbox"
                        checked={t.allowedApothecary}
                        onChange={(e) => updateTeam(i, 'allowedApothecary', e.target.checked)}
                      />
                    </div>
                  </div>
                  <div className="admin-star-row">
                    <label>Special Rules</label>
                    <input
                      type="text"
                      className="admin-input admin-input-wide"
                      value={t.specialRules.join(', ')}
                      onChange={(e) => updateSpecialRules(i, e.target.value)}
                    />
                  </div>

                  {/* Player slots section */}
                  <div className="admin-slots-section">
                    <div className="admin-slots-header">
                      <label>Player Slots</label>
                      <button className="btn-admin-add btn-admin-add-sm" onClick={() => addPlayerSlot(i)}>+ Add Slot</button>
                    </div>
                    {t.players.map((slot, si) => {
                      const player = playerMap.get(slot.id);
                      return (
                        <div key={si} className="admin-slot-row">
                          <select
                            className="admin-input admin-slot-select"
                            value={slot.id}
                            onChange={(e) => updatePlayerSlot(i, si, 'id', parseInt(e.target.value) || 0)}
                          >
                            <option value={0}>-- Select Player --</option>
                            {allPlayers.map((p) => (
                              <option key={p.id} value={p.id}>
                                #{p.id} — {p.position} ({p.cost}k)
                              </option>
                            ))}
                          </select>
                          <div className="admin-slot-max">
                            <label>Max</label>
                            <input
                              type="number"
                              className="admin-input admin-input-sm"
                              value={slot.max}
                              min={1}
                              onChange={(e) => updatePlayerSlot(i, si, 'max', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          {player && (
                            <span className="admin-slot-info">
                              MA:{player.playerStats[0]} ST:{player.playerStats[1]} AG:{player.playerStats[2]} PA:{player.playerStats[3]} AV:{player.playerStats[4]}
                            </span>
                          )}
                          <button className="btn-remove" onClick={() => removePlayerSlot(i, si)} title="Remove">-</button>
                        </div>
                      );
                    })}
                    {t.players.length === 0 && (
                      <div className="admin-empty" style={{ padding: '0.5rem' }}>No player slots</div>
                    )}
                  </div>

                  <div className="admin-star-row admin-star-actions">
                    <button className="btn-remove" onClick={() => removeRow(i)}>
                      Remove Team
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
