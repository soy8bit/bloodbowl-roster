import type { SavedRosterMeta, TeamData } from '../types';
import { exportRoster, importRoster } from '../utils/exportImport';
import { useLang } from '../i18n';

interface RosterStore {
  deleteRoster: (id: string) => void;
  importRoster: (roster: any) => void;
  savedRostersList: SavedRosterMeta[];
}

interface Props {
  rosters: SavedRosterMeta[];
  teamMap: Map<string, TeamData>;
  allRosters: RosterStore;
  onLoad: (id: string) => void;
  onNew: () => void;
}

export default function SavedRosters({ rosters, allRosters, onLoad, onNew }: Props) {
  const { lang, t } = useLang();

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const imported = await importRoster(file);
        allRosters.importRoster(imported);
      } catch (err) {
        alert(err instanceof Error ? err.message : t.importFailed);
      }
    };
    input.click();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(t.deleteConfirm(name))) {
      allRosters.deleteRoster(id);
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(lang === 'es' ? 'es-ES' : undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="saved-rosters">
      <h2 className="section-title">{t.savedRosters}</h2>

      <div className="saved-actions">
        <button className="btn-primary" onClick={onNew}>
          {t.newTeam}
        </button>
        <button className="btn-secondary" onClick={handleImport}>
          {t.importJson}
        </button>
      </div>

      {rosters.length === 0 ? (
        <div className="empty-saved">
          <p>{t.noSavedRosters}</p>
          <p>{t.createToStart}</p>
        </div>
      ) : (
        <div className="saved-list">
          {rosters.map((r) => (
            <div key={r.id} className="saved-card">
              <div className="saved-card-info" onClick={() => onLoad(r.id)}>
                <div className="saved-card-name">{r.name || t.unnamed}</div>
                <div className="saved-card-meta">
                  <span>{r.teamName}</span>
                  <span>{r.playerCount} {t.playersCount}</span>
                  <span>{formatDate(r.updatedAt)}</span>
                </div>
              </div>
              <div className="saved-card-actions">
                <button
                  className="btn-small btn-danger"
                  onClick={() => handleDelete(r.id, r.name)}
                >
                  {t.delete_}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
