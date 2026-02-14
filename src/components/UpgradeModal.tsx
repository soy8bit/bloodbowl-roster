import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import type { RosterPlayer, PlayerData, PlayerUpgrade } from '../types';
import { UPGRADE_COSTS, STAT_UPGRADE_TV, calculateUnspentSPP, getAvailableSkills } from '../utils/progressionUtils';
import { useLang } from '../i18n';

interface Props {
  player: RosterPlayer;
  playerData: PlayerData;
  skills: Record<string, { name: string; nameEs: string; category: string; description: string; descriptionEs: string }>;
  onConfirm: (upgrade: PlayerUpgrade) => void;
  onClose: () => void;
}

type UpgradeType = PlayerUpgrade['type'];
type StatKey = 'MA' | 'ST' | 'AG' | 'PA' | 'AV';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export default function UpgradeModal({ player, playerData, skills, onConfirm, onClose }: Props) {
  const { lang, t } = useLang();
  const [upgradeType, setUpgradeType] = useState<UpgradeType | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);
  const [selectedStat, setSelectedStat] = useState<StatKey | null>(null);

  const unspentSPP = calculateUnspentSPP(player);

  const hasPrimary = (playerData.primary || []).length > 0;
  const hasSecondary = (playerData.secondary || []).length > 0;

  const typeOptions: { type: UpgradeType; label: string; spp: number; available: boolean }[] = [
    { type: 'primary_random', label: lang === 'es' ? 'Primaria Aleatoria' : 'Random Primary', spp: UPGRADE_COSTS.primary_random.spp, available: hasPrimary },
    { type: 'primary_chosen', label: lang === 'es' ? 'Primaria Elegida' : 'Chosen Primary', spp: UPGRADE_COSTS.primary_chosen.spp, available: hasPrimary },
    { type: 'secondary_random', label: lang === 'es' ? 'Secundaria Aleatoria' : 'Random Secondary', spp: UPGRADE_COSTS.secondary_random.spp, available: hasSecondary },
    { type: 'secondary_chosen', label: lang === 'es' ? 'Secundaria Elegida' : 'Chosen Secondary', spp: UPGRADE_COSTS.secondary_chosen.spp, available: hasSecondary },
    { type: 'stat', label: lang === 'es' ? 'Mejora de Stat' : 'Stat Increase', spp: UPGRADE_COSTS.stat.spp, available: true },
  ];

  const availableSkills = useMemo(() => {
    if (!upgradeType || upgradeType === 'stat') return [];
    const type = upgradeType.startsWith('primary') ? 'primary' : 'secondary';
    return getAvailableSkills(playerData, player, type);
  }, [upgradeType, playerData, player]);

  const statOptions: { stat: StatKey; tv: number }[] = [
    { stat: 'MA', tv: STAT_UPGRADE_TV.MA },
    { stat: 'ST', tv: STAT_UPGRADE_TV.ST },
    { stat: 'AG', tv: STAT_UPGRADE_TV.AG },
    { stat: 'PA', tv: STAT_UPGRADE_TV.PA },
    { stat: 'AV', tv: STAT_UPGRADE_TV.AV },
  ];

  const canConfirm = (): boolean => {
    if (!upgradeType) return false;
    if (upgradeType === 'stat') {
      return selectedStat !== null && unspentSPP >= UPGRADE_COSTS.stat.spp;
    }
    return selectedSkillId !== null && unspentSPP >= UPGRADE_COSTS[upgradeType].spp;
  };

  const handleConfirm = () => {
    if (!upgradeType) return;

    if (upgradeType === 'stat' && selectedStat) {
      onConfirm({
        id: generateId(),
        type: 'stat',
        stat: selectedStat,
        statDelta: 1,
        sppCost: UPGRADE_COSTS.stat.spp,
        tvIncrease: STAT_UPGRADE_TV[selectedStat],
      });
    } else if (selectedSkillId !== null) {
      onConfirm({
        id: generateId(),
        type: upgradeType,
        skillId: selectedSkillId,
        sppCost: UPGRADE_COSTS[upgradeType].spp,
        tvIncrease: UPGRADE_COSTS[upgradeType].tv,
      });
    }
  };

  return (
    <motion.div
      className="modal-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="upgrade-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="upgrade-modal-header">
          <h3>{lang === 'es' ? 'Añadir Mejora' : 'Add Upgrade'}</h3>
          <span className="upgrade-spp-badge">
            SPP: {unspentSPP} {lang === 'es' ? 'disponibles' : 'available'}
          </span>
          <button className="btn-close-modal" onClick={onClose}>&times;</button>
        </div>

        <div className="upgrade-modal-body">
          {/* Step 1: Choose type */}
          <div className="upgrade-step">
            <label className="upgrade-step-label">{lang === 'es' ? '1. Tipo de mejora' : '1. Upgrade type'}</label>
            <div className="upgrade-type-grid">
              {typeOptions.filter(o => o.available).map((opt) => (
                <button
                  key={opt.type}
                  className={`upgrade-type-btn ${upgradeType === opt.type ? 'selected' : ''} ${unspentSPP < opt.spp ? 'disabled' : ''}`}
                  onClick={() => {
                    setUpgradeType(opt.type);
                    setSelectedSkillId(null);
                    setSelectedStat(null);
                  }}
                  disabled={unspentSPP < opt.spp}
                >
                  <span className="upgrade-type-name">{opt.label}</span>
                  <span className="upgrade-type-cost">{opt.spp} SPP</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Choose skill or stat */}
          {upgradeType && upgradeType !== 'stat' && (
            <div className="upgrade-step">
              <label className="upgrade-step-label">{lang === 'es' ? '2. Elegir habilidad' : '2. Choose skill'}</label>
              <div className="upgrade-skill-list">
                {availableSkills.map((skill) => (
                  <button
                    key={skill.id}
                    className={`upgrade-skill-btn ${selectedSkillId === skill.id ? 'selected' : ''}`}
                    onClick={() => setSelectedSkillId(skill.id)}
                  >
                    <span className={`skill-cat-dot cat-${skill.category.toLowerCase()}`} />
                    {lang === 'es' ? skill.nameEs : skill.name}
                  </button>
                ))}
                {availableSkills.length === 0 && (
                  <p className="upgrade-empty">{lang === 'es' ? 'No hay habilidades disponibles' : 'No skills available'}</p>
                )}
              </div>
            </div>
          )}

          {upgradeType === 'stat' && (
            <div className="upgrade-step">
              <label className="upgrade-step-label">{lang === 'es' ? '2. Elegir stat' : '2. Choose stat'}</label>
              <div className="upgrade-stat-grid">
                {statOptions.map((opt) => (
                  <button
                    key={opt.stat}
                    className={`upgrade-stat-btn ${selectedStat === opt.stat ? 'selected' : ''}`}
                    onClick={() => setSelectedStat(opt.stat)}
                  >
                    <span className="upgrade-stat-name">+1 {opt.stat}</span>
                    <span className="upgrade-stat-tv">+{opt.tv}k TV</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="upgrade-modal-footer">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button
            className="btn-primary"
            disabled={!canConfirm()}
            onClick={handleConfirm}
          >
            {lang === 'es' ? 'Confirmar' : 'Confirm'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
