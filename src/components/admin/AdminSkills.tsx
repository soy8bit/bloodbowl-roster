import { useState, useEffect } from 'react';

const TOKEN_KEY = 'bb_token';

interface SkillEntry {
  name: string;
  nameEs: string;
  category: string;
  description: string;
  descriptionEs: string;
}

type SkillsMap = Record<string, SkillEntry>;

export default function AdminSkills() {
  const [skills, setSkills] = useState<[string, SkillEntry][]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/game-data/skills')
      .then((r) => r.json())
      .then((d) => {
        const data = d.data as SkillsMap || {};
        setSkills(Object.entries(data).sort(([a], [b]) => Number(a) - Number(b)));
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load skills' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const updateSkill = (index: number, field: keyof SkillEntry, value: string) => {
    setSkills((prev) => {
      const next = [...prev];
      next[index] = [next[index][0], { ...next[index][1], [field]: value }];
      return next;
    });
  };

  const updateKey = (index: number, newKey: string) => {
    setSkills((prev) => {
      const next = [...prev];
      next[index] = [newKey, next[index][1]];
      return next;
    });
  };

  const addRow = () => {
    const newId = String(Date.now());
    setSkills((prev) => [...prev, [newId, { name: '', nameEs: '', category: 'G', description: '', descriptionEs: '' }]]);
  };

  const removeRow = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const data: SkillsMap = {};
      skills.forEach(([key, val]) => { data[key] = val; });
      const res = await fetch('/api/game-data/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMessage({ type: 'success', text: 'Skills saved successfully' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading skills...</div>;

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Skills ({skills.length})</h2>
        <div className="admin-actions">
          <button className="btn-admin-add" onClick={addRow}>+ Add Skill</button>
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
              <th>Name (EN)</th>
              <th>Name (ES)</th>
              <th>Cat</th>
              <th>Description (EN)</th>
              <th>Description (ES)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {skills.map(([key, s], i) => (
              <tr key={i}>
                <td>
                  <input
                    type="text"
                    className="admin-input admin-input-sm"
                    value={key}
                    onChange={(e) => updateKey(i, e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="admin-input"
                    value={s.name}
                    onChange={(e) => updateSkill(i, 'name', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="admin-input"
                    value={s.nameEs}
                    onChange={(e) => updateSkill(i, 'nameEs', e.target.value)}
                  />
                </td>
                <td>
                  <select
                    className="admin-input admin-input-sm"
                    value={s.category}
                    onChange={(e) => updateSkill(i, 'category', e.target.value)}
                  >
                    <option value="A">A</option>
                    <option value="G">G</option>
                    <option value="M">M</option>
                    <option value="P">P</option>
                    <option value="D">D</option>
                    <option value="S">S</option>
                    <option value="T">T</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    className="admin-input admin-input-wide"
                    value={s.description}
                    onChange={(e) => updateSkill(i, 'description', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="admin-input admin-input-wide"
                    value={s.descriptionEs}
                    onChange={(e) => updateSkill(i, 'descriptionEs', e.target.value)}
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
