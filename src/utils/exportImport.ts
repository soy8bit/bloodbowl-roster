import type { Roster } from '../types';

export function exportRoster(roster: Roster): void {
  const json = JSON.stringify(roster, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${roster.name || roster.teamName}_roster.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importRoster(file: File): Promise<Roster> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const roster = JSON.parse(e.target?.result as string) as Roster;
        if (!roster.id || !roster.teamId || !Array.isArray(roster.players)) {
          reject(new Error('Invalid roster file format'));
          return;
        }
        roster.updatedAt = Date.now();
        resolve(roster);
      } catch {
        reject(new Error('Failed to parse roster file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
