import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useLang } from '../i18n';

interface SkillData {
  name: string;
  nameEs: string;
  category: string;
  description: string;
  descriptionEs: string;
}

interface Props {
  skill: SkillData | null;
  onClose: () => void;
}

const categoryClass: Record<string, string> = {
  A: 'skill-a',
  G: 'skill-g',
  M: 'skill-m',
  P: 'skill-p',
  S: 'skill-s',
  T: 'skill-t',
  NA: 'skill-t',
};

function useIsMobile(breakpoint = 600) {
  const [mobile, setMobile] = useState(
    () => window.matchMedia(`(max-width: ${breakpoint}px)`).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return mobile;
}

export default function SkillModal({ skill, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { lang, t } = useLang();
  const isMobile = useIsMobile();

  const categoryNames: Record<string, string> = {
    A: t.catAgility,
    G: t.catGeneral,
    M: t.catMutation,
    P: t.catPassing,
    S: t.catStrength,
    T: t.catTrait,
    NA: t.catExtraordinary,
  };

  useEffect(() => {
    if (!skill) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [skill, onClose]);

  const cat = skill ? (categoryClass[skill.category] || 'skill-t') : '';
  const catName = skill ? (categoryNames[skill.category] || skill.category) : '';
  const displayName = skill ? (lang === 'es' ? skill.nameEs : skill.name) : '';
  const displayDesc = skill ? (lang === 'es' ? skill.descriptionEs : skill.description) : '';

  const panelVariants = isMobile
    ? {
        initial: { y: '100%' },
        animate: { y: 0, transition: { type: 'spring' as const, damping: 28, stiffness: 300 } },
        exit: { y: '100%', transition: { duration: 0.2 } },
      }
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.12 } },
      };

  return (
    <AnimatePresence>
      {skill && (
        <motion.div
          className="skill-modal-overlay"
          ref={overlayRef}
          onClick={(e) => {
            if (e.target === overlayRef.current) onClose();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="skill-modal"
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="skill-modal-header">
              <div className="skill-modal-title">
                <span className={`skill-badge ${cat}`}>{catName}</span>
                <h3>{displayName}</h3>
              </div>
              <button className="skill-modal-close" onClick={onClose}>
                &times;
              </button>
            </div>
            <div className="skill-modal-body">
              <p>{displayDesc}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
