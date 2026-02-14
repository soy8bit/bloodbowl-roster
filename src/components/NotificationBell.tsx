import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useLang } from '../i18n';
import { useNotifications, type Notification } from '../hooks/useNotifications';

function timeAgo(iso: string, t: any): string {
  const diff = Date.now() - new Date(iso + 'Z').getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t.notifJustNow;
  if (mins < 60) return t.notifMinutesAgo(mins);
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t.notifHoursAgo(hrs);
  return t.notifDaysAgo(Math.floor(hrs / 24));
}

function notifIcon(type: string): string {
  switch (type) {
    case 'match_result': return '\uD83C\uDFC8'; // football
    case 'roster_enrolled': return '\uD83D\uDCCB'; // clipboard
    default: return '\uD83D\uDD14'; // bell
  }
}

interface Props {
  enabled: boolean;
}

export default function NotificationBell({ enabled }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useLang();
  const { notifications, unreadCount, loading, fetchAll, markRead, markAllRead } = useNotifications(enabled);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggle = useCallback(() => {
    if (!open) fetchAll();
    setOpen(prev => !prev);
  }, [open, fetchAll]);

  const handleClick = useCallback((n: Notification) => {
    if (!n.isRead) markRead(n.id);
    setOpen(false);
    if (n.entityType && n.entityId) {
      const base = n.entityType === 'tournament' ? '/tournaments' : '/leagues';
      navigate(`${base}/${n.entityId}`);
    }
  }, [markRead, navigate]);

  const handleMarkAll = useCallback(() => {
    markAllRead();
  }, [markAllRead]);

  if (!enabled) return null;

  return (
    <div className="notif-wrapper" ref={panelRef}>
      <button className="notif-bell-btn" onClick={handleToggle} aria-label={t.notifTitle}>
        <svg className="notif-bell-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="notif-panel"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="notif-panel-header">
              <span className="notif-panel-title">{t.notifTitle}</span>
              {unreadCount > 0 && (
                <button className="notif-mark-all" onClick={handleMarkAll}>
                  {t.notifMarkAllRead}
                </button>
              )}
            </div>

            <div className="notif-panel-list">
              {loading && notifications.length === 0 && (
                <div className="notif-empty">...</div>
              )}
              {!loading && notifications.length === 0 && (
                <div className="notif-empty">{t.notifEmpty}</div>
              )}
              {notifications.map(n => (
                <button
                  key={n.id}
                  className={`notif-item ${n.isRead ? '' : 'notif-unread'}`}
                  onClick={() => handleClick(n)}
                >
                  <span className="notif-item-icon">{notifIcon(n.type)}</span>
                  <div className="notif-item-content">
                    <span className="notif-item-title">{n.title}</span>
                    {n.body && <span className="notif-item-body">{n.body}</span>}
                  </div>
                  <span className="notif-item-time">{timeAgo(n.createdAt, t)}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
