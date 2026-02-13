import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = 'danger',
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="skill-modal-overlay"
          ref={overlayRef}
          onClick={(e) => {
            if (e.target === overlayRef.current) onCancel();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <motion.div
            className="confirm-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.15 } }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }}
          >
            <div className="confirm-modal-header">
              <h3 id="confirm-modal-title">{title}</h3>
            </div>
            <div className="confirm-modal-body">
              <p>{message}</p>
            </div>
            <div className="confirm-modal-actions">
              <button className="btn-secondary" onClick={onCancel}>
                {cancelText}
              </button>
              <button
                className={`btn-primary ${variant === 'danger' ? 'btn-confirm-danger' : 'btn-confirm-warning'}`}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
