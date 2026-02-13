import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useLang } from '../i18n';

interface Props {
  open: boolean;
  section?: string | null;
  onClose: () => void;
}

export default function HelpModal({ open, section, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { t } = useLang();

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const allSections = [
    { id: 'roster', title: t.helpRosterTitle, desc: t.helpRosterDesc },
    { id: 'budget', title: t.helpBudgetTitle, desc: t.helpBudgetDesc },
    { id: 'gameMode', title: t.helpGameModeTitle, desc: t.helpGameModeDesc },
    { id: 'stars', title: t.helpStarsTitle, desc: t.helpStarsDesc },
    { id: 'skills', title: t.helpSkillsTitle, desc: t.helpSkillsDesc },
    { id: 'export', title: t.helpExportTitle, desc: t.helpExportDesc },
  ];

  const filtered = section
    ? allSections.filter(s => s.id === section)
    : allSections;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="help-modal-overlay"
          ref={overlayRef}
          onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            className="help-modal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0.12 } }}
          >
            <div className="help-modal-header">
              <h3>{section ? filtered[0]?.title : t.helpTitle}</h3>
              <button className="skill-modal-close" onClick={onClose} aria-label={t.close}>
                &times;
              </button>
            </div>
            <div className="help-modal-body">
              {filtered.map(s => (
                <div key={s.id} className="help-section">
                  {!section && <h4 className="help-section-title">{s.title}</h4>}
                  <p className="help-section-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
