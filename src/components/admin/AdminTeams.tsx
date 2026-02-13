import { useState, useEffect } from 'react';
import type { TeamData } from '../../types';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/game-data/teams')
      .then((r) => r.json())
      .then((d) => setTeams(d.data || []))
      .catch(() => setMessage({ type: 'error', text: 'Failed to load teams' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

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

  const updatePlayers = (index: number, value: string) => {
    try {
      const slots = value.split(';').map((s) => {
        const [id, max] = s.trim().split(':').map(Number);
        return { id, max };
      }).filter((s) => !isNaN(s.id) && !isNaN(s.max));
      updateTeam(index, 'players', slots);
    } catch {}
  };

  const updateSpecialRules = (index: number, value: string) => {
    updateTeam(index, 'specialRules', value.split(',').map((s) => s.trim()).filter(Boolean));
  };

  const addRow = () => setTeams((prev) => [...prev, emptyTeam()]);
  const removeRow = (index: number) => setTeams((prev) => prev.filter((_, i) => i !== index));

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
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Players (id:max;...)</th>
              <th>Reroll $</th>
              <th>Reroll Max</th>
              <th>Tier</th>
              <th>Apo</th>
              <th>Special Rules</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => (
              <tr key={i}>
                <td>
                  <input
                    type="text"
                    className="admin-input admin-input-sm"
                    value={t.id}
                    onChange={(e) => updateTeam(i, 'id', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="admin-input"
                    value={t.name}
                    onChange={(e) => updateTeam(i, 'name', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="admin-input admin-input-wide"
                    value={t.players.map((p) => `${p.id}:${p.max}`).join('; ')}
                    onChange={(e) => updatePlayers(i, e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="admin-input admin-input-sm"
                    value={t.reroll.cost}
                    onChange={(e) => updateReroll(i, 'cost', parseInt(e.target.value) || 0)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="admin-input admin-input-sm"
                    value={t.reroll.max}
                    onChange={(e) => updateReroll(i, 'max', parseInt(e.target.value) || 0)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="admin-input admin-input-sm"
                    value={t.tier}
                    onChange={(e) => updateTeam(i, 'tier', parseInt(e.target.value) || 1)}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={t.allowedApothecary}
                    onChange={(e) => updateTeam(i, 'allowedApothecary', e.target.checked)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="admin-input"
                    value={t.specialRules.join(', ')}
                    onChange={(e) => updateSpecialRules(i, e.target.value)}
                  />
                </td>
                <td>
                  <button className="btn-remove" onClick={() => removeRow(i)} title="Remove">-</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
