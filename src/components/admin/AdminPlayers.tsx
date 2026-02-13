import { useState, useEffect } from 'react';
import type { PlayerData } from '../../types';

const TOKEN_KEY = 'bb_token';

function emptyPlayer(): PlayerData {
  return { id: Date.now(), position: '', playerStats: [6, 3, 3, 4, 8], cost: 50, skills: [] };
}

export default function AdminPlayers() {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/game-data/players')
      .then((r) => r.json())
      .then((d) => setPlayers(d.data || []))
      .catch(() => setMessage({ type: 'error', text: 'Failed to load players' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const updatePlayer = (index: number, field: string, value: any) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateStat = (index: number, statIndex: number, value: number) => {
    setPlayers((prev) => {
      const next = [...prev];
      const stats = [...next[index].playerStats] as [number, number, number, number, number];
      stats[statIndex] = value;
      next[index] = { ...next[index], playerStats: stats };
      return next;
    });
  };

  const updateSkills = (index: number, value: string) => {
    const skills = value.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));
    updatePlayer(index, 'skills', skills);
  };

  const addRow = () => setPlayers((prev) => [...prev, emptyPlayer()]);
  const removeRow = (index: number) => setPlayers((prev) => prev.filter((_, i) => i !== index));

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch('/api/game-data/players', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data: players }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
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
          <button className="btn-admin-add" onClick={addRow}>+ Add Player</button>
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
              <th>Position</th>
              {statLabels.map((s) => <th key={s}>{s}</th>)}
              <th>Cost</th>
              <th>Skills (IDs)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={i}>
                <td>
                  <input
                    type="number"
                    className="admin-input admin-input-sm"
                    value={p.id}
                    onChange={(e) => updatePlayer(i, 'id', parseInt(e.target.value) || 0)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="admin-input"
                    value={p.position}
                    onChange={(e) => updatePlayer(i, 'position', e.target.value)}
                  />
                </td>
                {p.playerStats.map((stat, si) => (
                  <td key={si}>
                    <input
                      type="number"
                      className="admin-input admin-input-sm"
                      value={stat}
                      onChange={(e) => updateStat(i, si, parseInt(e.target.value) || 0)}
                    />
                  </td>
                ))}
                <td>
                  <input
                    type="number"
                    className="admin-input admin-input-sm"
                    value={p.cost}
                    onChange={(e) => updatePlayer(i, 'cost', parseInt(e.target.value) || 0)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="admin-input"
                    value={p.skills.join(', ')}
                    onChange={(e) => updateSkills(i, e.target.value)}
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
