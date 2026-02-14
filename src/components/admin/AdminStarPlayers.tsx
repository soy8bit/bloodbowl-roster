import { useState, useEffect } from 'react';
import type { StarPlayerData } from '../../types';
import SkillNameMultiSelect from './SkillNameMultiSelect';

const TOKEN_KEY = 'bb_token';

function emptyStar(): StarPlayerData {
  return { name: '', cost: 0, MA: 6, ST: 3, AG: 3, PA: 4, AV: 8, skills: [], teams: [], specialRule: '', specialRuleDescription: '', specialRuleEs: '', specialRuleDescriptionEs: '' };
}

export default function AdminStarPlayers() {
  const [stars, setStars] = useState<StarPlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/game-data/starPlayers')
      .then((r) => r.json())
      .then((d) => setStars(d.data || []))
      .catch(() => setMessage({ type: 'error', text: 'Failed to load star players' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const updateStar = (index: number, field: string, value: any) => {
    setStars((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateTeams = (index: number, value: string) => {
    updateStar(index, 'teams', value.split(',').map((s) => s.trim()).filter(Boolean));
  };

  const addRow = () => {
    setStars((prev) => [...prev, emptyStar()]);
    setExpandedIndex(stars.length);
  };

  const removeRow = (index: number) => {
    setStars((prev) => prev.filter((_, i) => i !== index));
    setExpandedIndex(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch('/api/game-data/starPlayers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data: stars }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMessage({ type: 'success', text: 'Star players saved successfully' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading star players...</div>;

  const filtered = search
    ? stars
        .map((s, i) => ({ star: s, originalIndex: i }))
        .filter(({ star }) => star.name.toLowerCase().includes(search.toLowerCase()))
    : stars.map((s, i) => ({ star: s, originalIndex: i }));

  const statLabels = ['MA', 'ST', 'AG', 'PA', 'AV'] as const;
  const statKeys: (keyof StarPlayerData)[] = ['MA', 'ST', 'AG', 'PA', 'AV'];

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Star Players ({stars.length})</h2>
        <div className="admin-actions">
          <input
            type="text"
            className="admin-input admin-search"
            placeholder="Search star player..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-admin-add" onClick={addRow}>+ Add Star</button>
          <button className="btn-admin-save" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      {message && (
        <div className={`admin-message admin-message-${message.type}`}>{message.text}</div>
      )}

      <div className="admin-star-list">
        {filtered.map(({ star, originalIndex }) => {
          const isExpanded = expandedIndex === originalIndex;
          return (
            <div key={originalIndex} className={`admin-star-card ${isExpanded ? 'expanded' : ''}`}>
              <div
                className="admin-star-summary"
                onClick={() => setExpandedIndex(isExpanded ? null : originalIndex)}
              >
                <span className="admin-star-name">{star.name || '(unnamed)'}</span>
                <span className="admin-star-cost">{star.cost}k</span>
                {star.specialRule && <span className="admin-star-rule">{star.specialRule}</span>}
                <span className="admin-star-stats">
                  {statLabels.map((label, i) => (
                    <span key={label} className="admin-star-stat">
                      {label}: {star[statKeys[i]] as number}
                    </span>
                  ))}
                </span>
                <span className="admin-star-expand">{isExpanded ? '▾' : '▸'}</span>
              </div>
              {isExpanded && (
                <div className="admin-star-details">
                  <div className="admin-star-row">
                    <label>Name</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={star.name}
                      onChange={(e) => updateStar(originalIndex, 'name', e.target.value)}
                    />
                  </div>
                  <div className="admin-star-row">
                    <label>Cost (k)</label>
                    <input
                      type="number"
                      className="admin-input admin-input-sm"
                      value={star.cost}
                      onChange={(e) => updateStar(originalIndex, 'cost', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="admin-star-row admin-star-stats-row">
                    {statLabels.map((label, i) => (
                      <div key={label} className="admin-star-stat-input">
                        <label>{label}</label>
                        <input
                          type="number"
                          className="admin-input admin-input-sm"
                          value={star[statKeys[i]] as number}
                          onChange={(e) => updateStar(originalIndex, statKeys[i] as string, parseInt(e.target.value) || 0)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="admin-star-row">
                    <label>Skills</label>
                    <SkillNameMultiSelect
                      selected={star.skills}
                      onChange={(skills) => updateStar(originalIndex, 'skills', skills)}
                    />
                  </div>
                  <div className="admin-star-row">
                    <label>Teams (comma separated, "any" for all)</label>
                    <input
                      type="text"
                      className="admin-input admin-input-wide"
                      value={star.teams.join(', ')}
                      onChange={(e) => updateTeams(originalIndex, e.target.value)}
                    />
                  </div>
                  <div className="admin-star-row">
                    <label>Special Rule (EN)</label>
                    <input
                      type="text"
                      className="admin-input admin-input-wide"
                      value={star.specialRule || ''}
                      onChange={(e) => updateStar(originalIndex, 'specialRule', e.target.value)}
                    />
                  </div>
                  <div className="admin-star-row">
                    <label>Special Rule Description (EN)</label>
                    <textarea
                      className="admin-input admin-input-wide admin-textarea"
                      rows={3}
                      value={star.specialRuleDescription || ''}
                      onChange={(e) => updateStar(originalIndex, 'specialRuleDescription', e.target.value)}
                    />
                  </div>
                  <div className="admin-star-row">
                    <label>Special Rule (ES)</label>
                    <input
                      type="text"
                      className="admin-input admin-input-wide"
                      value={star.specialRuleEs || ''}
                      onChange={(e) => updateStar(originalIndex, 'specialRuleEs', e.target.value)}
                    />
                  </div>
                  <div className="admin-star-row">
                    <label>Special Rule Description (ES)</label>
                    <textarea
                      className="admin-input admin-input-wide admin-textarea"
                      rows={3}
                      value={star.specialRuleDescriptionEs || ''}
                      onChange={(e) => updateStar(originalIndex, 'specialRuleDescriptionEs', e.target.value)}
                    />
                  </div>
                  <div className="admin-star-row admin-star-actions">
                    <button className="btn-remove" onClick={() => removeRow(originalIndex)}>
                      Remove Star Player
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="admin-empty">No star players found</div>
        )}
      </div>
    </div>
  );
}
