import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Roster, TeamData } from '../types';
import { calculateTVBreakdown, formatGold, validateRoster } from '../utils/rosterUtils';
import { useLang } from '../i18n';
import InfoButton from './InfoButton';

interface Props {
  roster: Roster;
  team: TeamData;
}

export default function BudgetBar({ roster, team }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { lang, t } = useLang();
  const tv = calculateTVBreakdown(roster, team);
  const spent = tv.total;
  const budget = roster.treasury - spent;
  const validation = validateRoster(roster, team, lang);
  const playerCount = roster.players.length;
  const playerProgress = Math.min(playerCount / 16, 1);

  return (
    <div className="budget-bar">
      <div className="budget-bar-row">
        <div
          className="budget-block budget-tv"
          onClick={() => setExpanded(!expanded)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
        >
          <span className="budget-label">{t.teamValue}</span>
          <span className="budget-value budget-value-gold">{formatGold(tv.total)}</span>
          <span className="budget-expand-hint">{expanded ? '\u25B2' : '\u25BC'}</span>
        </div>

        <div className="budget-block budget-treasury">
          <span className="budget-label">{t.budgetLabel}</span>
          <span className={`budget-value ${budget < 0 ? 'budget-negative' : ''}`}>
            {formatGold(budget)}
          </span>
        </div>

        <div className="budget-block budget-players">
          <span className="budget-label">{t.players}</span>
          <span className="budget-value">{playerCount}/16</span>
          <div className="budget-progress">
            <div
              className="budget-progress-fill"
              style={{ width: `${playerProgress * 100}%` }}
            />
          </div>
        </div>
        <InfoButton text={t.helpBudgetDesc} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="budget-breakdown"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="breakdown-grid">
              <span>{t.tvPlayers}</span><span>{formatGold(tv.players)}</span>
              <span>{t.tvStars}</span><span>{formatGold(tv.stars)}</span>
              <span>{t.tvInducements}</span><span>{formatGold(tv.inducements)}</span>
              <span>{t.tvRerolls}</span><span>{formatGold(tv.rerolls)}</span>
              <span>{t.tvStaff}</span><span>{formatGold(tv.staff)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="budget-validation">
          {validation.errors.map((e, i) => (
            <div key={i} className="validation-error">{e}</div>
          ))}
          {validation.warnings.map((w, i) => (
            <div key={i} className="validation-warning">{w}</div>
          ))}
        </div>
      )}
    </div>
  );
}
