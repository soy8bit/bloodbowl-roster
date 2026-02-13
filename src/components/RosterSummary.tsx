import type { Roster, TeamData } from '../types';
import { calculateTeamValue, validateRoster, formatGold } from '../utils/rosterUtils';
import { exportRoster, importRoster } from '../utils/exportImport';
import { exportRosterPdf } from '../utils/pdfExport';
import { useToast } from '../hooks/useToast';
import { useLang } from '../i18n';

interface Props {
  roster: Roster;
  team: TeamData;
  skills: Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;
  onRerolls: (n: number) => void;
  onCoaches: (n: number) => void;
  onCheerleaders: (n: number) => void;
  onFans: (n: number) => void;
  onApothecary: (v: boolean) => void;
  onTreasury: (n: number) => void;
  onImport: (roster: Roster) => void;
}

export default function RosterSummary({
  roster,
  team,
  skills,
  onRerolls,
  onCoaches,
  onCheerleaders,
  onFans,
  onApothecary,
  onTreasury,
  onImport,
}: Props) {
  const tv = calculateTeamValue(roster, team);
  const { lang, t } = useLang();
  const { showToast } = useToast();
  const validation = validateRoster(roster, team, lang);

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const imported = await importRoster(file);
        onImport(imported);
        showToast(t.importSuccess, 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : t.importFailed, 'error');
      }
    };
    input.click();
  };

  const handleExportPdf = () => {
    exportRosterPdf(roster, team, skills, lang);
    showToast(t.exportSuccess, 'info');
  };

  const handleExportJson = () => {
    exportRoster(roster);
    showToast(t.exportSuccess, 'info');
  };

  return (
    <div className="roster-summary">
      <div className="tv-display">
        <span className="tv-label">{t.teamValue}</span>
        <span className="tv-value">{formatGold(tv)}</span>
      </div>

      <div className="summary-grid">
        <div className="summary-row">
          <span>{t.rerolls} ({team.reroll.cost}k {t.each})</span>
          <div className="counter">
            <button onClick={() => onRerolls(roster.rerolls - 1)} disabled={roster.rerolls <= 0}>-</button>
            <span>{roster.rerolls}</span>
            <button onClick={() => onRerolls(roster.rerolls + 1)} disabled={roster.rerolls >= team.reroll.max}>+</button>
          </div>
        </div>

        <div className="summary-row">
          <span>{t.assistantCoaches} (10k)</span>
          <div className="counter">
            <button onClick={() => onCoaches(roster.assistantCoaches - 1)} disabled={roster.assistantCoaches <= 0}>-</button>
            <span>{roster.assistantCoaches}</span>
            <button onClick={() => onCoaches(roster.assistantCoaches + 1)} disabled={roster.assistantCoaches >= 6}>+</button>
          </div>
        </div>

        <div className="summary-row">
          <span>{t.cheerleaders} (10k)</span>
          <div className="counter">
            <button onClick={() => onCheerleaders(roster.cheerleaders - 1)} disabled={roster.cheerleaders <= 0}>-</button>
            <span>{roster.cheerleaders}</span>
            <button onClick={() => onCheerleaders(roster.cheerleaders + 1)} disabled={roster.cheerleaders >= 6}>+</button>
          </div>
        </div>

        <div className="summary-row">
          <span>{t.dedicatedFans} (10k)</span>
          <div className="counter">
            <button onClick={() => onFans(roster.dedicatedFans - 1)} disabled={roster.dedicatedFans <= 1}>-</button>
            <span>{roster.dedicatedFans}</span>
            <button onClick={() => onFans(roster.dedicatedFans + 1)} disabled={roster.dedicatedFans >= 6}>+</button>
          </div>
        </div>

        {team.allowedApothecary && (
          <div className="summary-row">
            <span>{t.apothecary} (50k)</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={roster.apothecary}
                onChange={(e) => onApothecary(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        )}

        <div className="summary-row">
          <span>{t.treasury}</span>
          <div className="treasury-input">
            <input
              type="number"
              value={roster.treasury}
              onChange={(e) => onTreasury(Number(e.target.value))}
              min={0}
              step={10}
            />
            <span className="gold-suffix">,000 gp</span>
          </div>
        </div>
      </div>

      <div className="summary-info">
        <div className="player-count">
          {t.players}: {roster.players.length}/16
          {roster.players.length < 11 && (
            <span className="warning"> {t.min11}</span>
          )}
        </div>
      </div>

      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="validation">
          {validation.errors.map((e, i) => (
            <div key={i} className="validation-error">{e}</div>
          ))}
          {validation.warnings.map((w, i) => (
            <div key={i} className="validation-warning">{w}</div>
          ))}
        </div>
      )}

      <div className="summary-actions">
        <button
          className="btn-primary btn-pdf"
          onClick={handleExportPdf}
        >
          {t.exportPdf}
        </button>
        <button className="btn-secondary" onClick={handleExportJson}>
          {t.exportJson}
        </button>
        <button className="btn-secondary" onClick={handleImport}>
          {t.import_}
        </button>
      </div>
    </div>
  );
}
