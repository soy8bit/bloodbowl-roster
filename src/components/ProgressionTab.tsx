import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import type { Roster, RosterPlayer, PlayerData, PlayerUpgrade, PlayerInjury } from '../types';
import { calculateTotalSPP, calculateSpentSPP, calculateUnspentSPP, SPP_VALUES } from '../utils/progressionUtils';
import { categoryClass } from '../utils/skillUtils';
import { useLang } from '../i18n';
import UpgradeModal from './UpgradeModal';

interface Props {
  roster: Roster;
  playerMap: Map<number, PlayerData>;
  skills: Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;
  onAddUpgrade: (uid: string, upgrade: PlayerUpgrade) => void;
  onRemoveUpgrade: (uid: string, upgradeId: string) => void;
  onAddInjury: (uid: string, injury: PlayerInjury) => void;
  onRemoveInjury: (uid: string, injuryId: string) => void;
  onSetMNG: (uid: string, mng: boolean) => void;
  onSkillClick: (skillId: number) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

const INJURY_TYPES = ['niggle', 'MA', 'AV', 'AG', 'PA', 'ST'] as const;

export default function ProgressionTab({
  roster,
  playerMap,
  skills,
  onAddUpgrade,
  onRemoveUpgrade,
  onAddInjury,
  onRemoveInjury,
  onSetMNG,
  onSkillClick,
}: Props) {
  const { lang } = useLang();
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [upgradeTarget, setUpgradeTarget] = useState<RosterPlayer | null>(null);

  const injuryLabel = (type: string) => {
    if (type === 'niggle') return lang === 'es' ? 'Lesion persistente' : 'Niggling Injury';
    return `-1 ${type}`;
  };

  return (
    <div className="progression-tab">
      <div className="progression-list">
        {roster.players.map((player) => {
          const pd = playerMap.get(player.playerId);
          const totalSPP = calculateTotalSPP(player.spp);
          const spentSPP = calculateSpentSPP(player.upgrades);
          const unspentSPP = totalSPP - spentSPP;
          const isExpanded = expandedUid === player.uid;
          const upgrades = player.upgrades || [];
          const injuries = player.injuries || [];

          return (
            <div key={player.uid} className="progression-card">
              <div
                className="progression-card-header"
                onClick={() => setExpandedUid(isExpanded ? null : player.uid)}
              >
                <div className="progression-player-info">
                  <span className="progression-player-name">
                    {player.name || player.position}
                  </span>
                  <span className="progression-player-pos">{player.position}</span>
                </div>
                <div className="progression-badges">
                  <span className="badge-spp" title="SPP">
                    {totalSPP} SPP
                    {unspentSPP > 0 && <span className="badge-spp-unspent"> ({unspentSPP})</span>}
                  </span>
                  {upgrades.length > 0 && (
                    <span className="badge-upgrades" title={lang === 'es' ? 'Mejoras' : 'Upgrades'}>
                      {upgrades.length} {lang === 'es' ? 'mej.' : 'upg.'}
                    </span>
                  )}
                  {player.missNextGame && (
                    <span className="badge-mng">MNG</span>
                  )}
                  {injuries.length > 0 && (
                    <span className="badge-injury" title={lang === 'es' ? 'Lesiones' : 'Injuries'}>
                      {injuries.length} inj.
                    </span>
                  )}
                </div>
                <span className="progression-expand">{isExpanded ? '\u25B2' : '\u25BC'}</span>
              </div>

              {isExpanded && (
                <div className="progression-card-body">
                  {/* SPP Breakdown */}
                  {player.spp && (
                    <div className="progression-section">
                      <h4 className="progression-section-title">SPP Breakdown</h4>
                      <div className="spp-breakdown">
                        {(Object.keys(SPP_VALUES) as (keyof typeof SPP_VALUES)[]).map((key) => {
                          const val = player.spp?.[key] || 0;
                          if (val === 0) return null;
                          return (
                            <span key={key} className="spp-item">
                              {key.toUpperCase()}: {val} ({val * SPP_VALUES[key]} SPP)
                            </span>
                          );
                        })}
                        <span className="spp-item spp-total">
                          {lang === 'es' ? 'Total' : 'Total'}: {totalSPP} |{' '}
                          {lang === 'es' ? 'Gastados' : 'Spent'}: {spentSPP} |{' '}
                          {lang === 'es' ? 'Disponibles' : 'Available'}: {unspentSPP}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Upgrades */}
                  <div className="progression-section">
                    <div className="progression-section-header">
                      <h4 className="progression-section-title">
                        {lang === 'es' ? 'Mejoras' : 'Upgrades'} ({upgrades.length})
                      </h4>
                      <button
                        className="btn-add-small"
                        onClick={() => setUpgradeTarget(player)}
                        disabled={!pd}
                      >
                        + {lang === 'es' ? 'Añadir' : 'Add'}
                      </button>
                    </div>
                    {upgrades.length > 0 && (
                      <div className="upgrade-list">
                        {upgrades.map((upg) => (
                          <div key={upg.id} className="upgrade-item">
                            <span className="upgrade-item-info">
                              {upg.type === 'stat' ? (
                                <span className="upgrade-stat-label">+1 {upg.stat}</span>
                              ) : (
                                <>
                                  {upg.skillId && (
                                    <span
                                      className={`skill-badge upgrade-skill ${categoryClass[skills[String(upg.skillId)]?.category] || 'skill-t'}`}
                                      onClick={() => upg.skillId && onSkillClick(upg.skillId)}
                                      role="button"
                                      tabIndex={0}
                                    >
                                      {lang === 'es'
                                        ? skills[String(upg.skillId)]?.nameEs
                                        : skills[String(upg.skillId)]?.name}
                                    </span>
                                  )}
                                </>
                              )}
                              <span className="upgrade-meta">
                                {upg.sppCost} SPP | +{upg.tvIncrease}k TV
                              </span>
                            </span>
                            <button
                              className="btn-remove-small"
                              onClick={() => onRemoveUpgrade(player.uid, upg.id)}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Injuries */}
                  <div className="progression-section">
                    <div className="progression-section-header">
                      <h4 className="progression-section-title">
                        {lang === 'es' ? 'Lesiones' : 'Injuries'} ({injuries.length})
                      </h4>
                      <select
                        className="injury-select"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            onAddInjury(player.uid, {
                              id: generateId(),
                              type: e.target.value as PlayerInjury['type'],
                            });
                          }
                        }}
                      >
                        <option value="">+ {lang === 'es' ? 'Añadir' : 'Add'}</option>
                        {INJURY_TYPES.map((type) => (
                          <option key={type} value={type}>{injuryLabel(type)}</option>
                        ))}
                      </select>
                    </div>
                    {injuries.length > 0 && (
                      <div className="injury-list">
                        {injuries.map((inj) => (
                          <div key={inj.id} className="injury-item">
                            <span className="injury-label">{injuryLabel(inj.type)}</span>
                            <button
                              className="btn-remove-small"
                              onClick={() => onRemoveInjury(player.uid, inj.id)}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* MNG Toggle */}
                  <div className="progression-section progression-mng">
                    <label className="mng-toggle">
                      <input
                        type="checkbox"
                        checked={player.missNextGame || false}
                        onChange={(e) => onSetMNG(player.uid, e.target.checked)}
                      />
                      <span>{lang === 'es' ? 'Pierde siguiente partido (MNG)' : 'Miss Next Game (MNG)'}</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {roster.players.length === 0 && (
          <div className="progression-empty">
            {lang === 'es' ? 'No hay jugadores en la plantilla.' : 'No players in roster.'}
          </div>
        )}
      </div>

      <AnimatePresence>
        {upgradeTarget && playerMap.get(upgradeTarget.playerId) && (
          <UpgradeModal
            player={upgradeTarget}
            playerData={playerMap.get(upgradeTarget.playerId)!}
            skills={skills}
            onConfirm={(upgrade) => {
              onAddUpgrade(upgradeTarget.uid, upgrade);
              setUpgradeTarget(null);
            }}
            onClose={() => setUpgradeTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
