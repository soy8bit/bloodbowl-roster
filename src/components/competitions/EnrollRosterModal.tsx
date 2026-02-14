import { useState, useMemo } from 'react';
import { useLang } from '../../i18n';
import type { Roster, CompetitionRosterSummary } from '../../types';

const ROSTERS_KEY = 'bb_rosters';

interface Props {
  enrolledRosters: CompetitionRosterSummary[];
  onEnroll: (roster: Roster) => Promise<boolean>;
  onClose: () => void;
}

function loadLocalRosters(): Roster[] {
  try {
    const raw = localStorage.getItem(ROSTERS_KEY);
    if (!raw) return [];
    const map: Record<string, Roster> = JSON.parse(raw);
    return Object.values(map);
  } catch {
    return [];
  }
}

export default function EnrollRosterModal({ enrolledRosters, onEnroll, onClose }: Props) {
  const { t } = useLang();
  const [selected, setSelected] = useState<string>('');
  const [enrolling, setEnrolling] = useState(false);

  const localRosters = useMemo(() => loadLocalRosters(), []);
  const enrolledOriginalIds = new Set(enrolledRosters.map(r => r.id));

  const handleEnroll = async () => {
    const roster = localRosters.find(r => r.id === selected);
    if (!roster) return;
    setEnrolling(true);
    const ok = await onEnroll(roster);
    if (ok) onClose();
    setEnrolling(false);
  };

  return (
    <div className="comp-modal-overlay" onClick={onClose}>
      <div className="enroll-modal" onClick={e => e.stopPropagation()}>
        <h3>{t.compEnrollRoster}</h3>

        {localRosters.length === 0 ? (
          <p className="comp-empty-state">{t.matchNoRosters}</p>
        ) : (
          <div className="enroll-roster-list">
            {localRosters.map(r => {
              const alreadyEnrolled = enrolledOriginalIds.has(r.id);
              const playerCount = r.players.filter(p => !p.dead).length;
              return (
                <label
                  key={r.id}
                  className={`enroll-roster-item ${selected === r.id ? 'selected' : ''} ${alreadyEnrolled ? 'disabled' : ''}`}
                >
                  <input
                    type="radio"
                    name="enrollRoster"
                    value={r.id}
                    checked={selected === r.id}
                    onChange={() => setSelected(r.id)}
                    disabled={alreadyEnrolled}
                  />
                  <div className="enroll-roster-info">
                    <strong>{r.name || t.unnamed}</strong>
                    <span className="enroll-roster-meta">
                      {r.teamName} &middot; {playerCount} {t.playersCount} &middot; {r.coachName || '-'}
                    </span>
                    {alreadyEnrolled && <span className="enroll-already">{t.compAlreadyEnrolled}</span>}
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div className="enroll-modal-actions">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button
            className="btn-primary"
            onClick={handleEnroll}
            disabled={!selected || enrolling}
          >
            {enrolling ? t.compEnrolling : t.compEnrollBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
