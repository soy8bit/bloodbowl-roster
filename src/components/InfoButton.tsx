import { useState, useRef, useEffect } from 'react';

interface Props {
  text: string;
}

export default function InfoButton({ text }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="info-btn-wrapper" ref={ref}>
      <button
        className="info-btn"
        onClick={() => setOpen(!open)}
        aria-label="Info"
      >
        i
      </button>
      {open && (
        <div className="info-tooltip">
          <p>{text}</p>
        </div>
      )}
    </div>
  );
}
