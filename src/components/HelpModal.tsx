import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useLang } from '../i18n';

interface Props {
  open: boolean;
  text?: string;
  onClose: () => void;
}

export default function HelpModal({ open, text, onClose }: Props) {
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
              <h3>{t.helpTitle}</h3>
              <button className="skill-modal-close" onClick={onClose} aria-label={t.close}>
                &times;
              </button>
            </div>
            <div className="help-modal-body">
              {text && (
                <div className="help-section">
                  <p className="help-section-desc">{text}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
