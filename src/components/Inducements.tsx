import { useLang } from '../i18n';
import type { InducementData, RosterInducement } from '../types';
import inducementsRaw from '../data/inducements.json';

const allInducements = inducementsRaw as InducementData[];

interface Props {
  inducements: RosterInducement[];
  onSet: (id: string, quantity: number) => void;
}

export default function Inducements({ inducements, onSet }: Props) {
  const { lang, t } = useLang();

  const getQty = (id: string) => {
    const ind = (inducements || []).find((i) => i.id === id);
    return ind ? ind.quantity : 0;
  };

  const totalCost = allInducements.reduce((sum, ind) => sum + ind.cost * getQty(ind.id), 0);

  return (
    <div className="inducements-section">
      <h3 className="section-subtitle">
        {t.inducements}
        {totalCost > 0 && <span className="inducements-total"> ({totalCost}k)</span>}
      </h3>
      <div className="inducements-list">
        {allInducements.map((ind) => {
          const qty = getQty(ind.id);
          return (
            <div key={ind.id} className="inducement-row">
              <span className="inducement-name">
                {lang === 'es' ? ind.nameEs : ind.name}
                <span className="inducement-cost"> ({ind.cost}k)</span>
              </span>
              <div className="counter">
                <button onClick={() => onSet(ind.id, qty - 1)} disabled={qty <= 0}>-</button>
                <span>{qty}/{ind.max}</span>
                <button onClick={() => onSet(ind.id, qty + 1)} disabled={qty >= ind.max}>+</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
