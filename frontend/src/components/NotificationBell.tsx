import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/api'
import type { NotificationItem } from '../services/api'

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function typeColor(type: string): string {
  switch (type) {
    case 'budget_warning':
      return '#f59e0b'
    case 'budget_critical':
      return '#f97316'
    case 'budget_over':
      return '#ef4444'
    case 'recurring_due':
      return '#38bdf8'
    default:
      return '#a3a3b2'
  }
}

function TypeIcon({ type }: { type: string }) {
  const color = typeColor(type)
  if (type === 'recurring_due') {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <line x1="8" y1="3" x2="8" y2="7" />
        <line x1="16" y1="3" x2="16" y2="7" />
        <line x1="3" y1="11" x2="21" y2="11" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  async function refreshCount() {
    try {
      const count = await getUnreadNotificationsCount()
      setUnread(count)
    } catch {
      // ignore auth/network errors — badge stays as-is
    }
  }

  async function openPanel() {
    if (!open) setLoading(true)
    setOpen(!open)
  }

  useEffect(() => {
    let cancelled = false
    getUnreadNotificationsCount()
      .then((count) => {
        if (!cancelled) setUnread(count)
      })
      .catch(() => {
        // ignore auth/network errors — badge stays as-is
      })
    const interval = setInterval(refreshCount, 60000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    getNotifications()
      .then((data) => {
        if (cancelled) return
        setNotifications(data.notifications)
        setUnread(data.unread_count)
      })
      .catch(() => {
        if (cancelled) return
        setNotifications([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleClick(item: NotificationItem) {
    if (!item.read) {
      try {
        await markNotificationRead(item.id)
      } catch {
        // non-fatal — still navigate
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
      )
      setUnread((prev) => Math.max(0, prev - 1))
    }
    setOpen(false)
    if (item.type.startsWith('budget_')) {
      navigate('/budgets')
    } else if (item.type === 'recurring_due') {
      navigate('/recurring-expenses')
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead()
    } catch {
      // ignore
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <style>{`
        .notif-wrap {
          position: relative;
          display: inline-flex;
        }

        .notif-button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: transparent;
          color: rgba(232,232,240,0.55);
          cursor: pointer;
          transition: color 0.2s, background 0.2s, border-color 0.2s;
        }
        .notif-button:hover {
          color: #f59e0b;
          background: rgba(245,158,11,0.08);
          border-color: rgba(245,158,11,0.25);
        }

        .notif-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #ef4444;
          color: #fff;
          font-family: 'Inconsolata', monospace;
          font-size: 0.65rem;
          font-weight: 600;
          line-height: 1;
        }

        .notif-panel {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 360px;
          max-height: 480px;
          display: flex;
          flex-direction: column;
          background: rgba(14,14,26,0.98);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.55);
          overflow: hidden;
          z-index: 200;
        }

        .notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .notif-header h3 {
          margin: 0;
          font-family: 'Syne', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #fff;
        }
        .notif-header span {
          font-family: 'Inconsolata', monospace;
          font-size: 0.7rem;
          color: rgba(232,232,240,0.4);
        }
        .notif-mark-all {
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Inconsolata', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #f59e0b;
        }
        .notif-mark-all:hover { text-decoration: underline; }

        .notif-list {
          overflow-y: auto;
          padding: 0.4rem 0;
        }
        .notif-list::-webkit-scrollbar { width: 6px; }
        .notif-list::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 3px;
        }

        .notif-item {
          display: flex;
          gap: 0.75rem;
          width: 100%;
          padding: 0.7rem 1rem;
          background: none;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          text-align: left;
          cursor: pointer;
          transition: background 0.15s;
        }
        .notif-item:hover { background: rgba(255,255,255,0.04); }
        .notif-item.unread { background: rgba(245,158,11,0.05); }

        .notif-icon {
          flex: none;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
        }

        .notif-body { min-width: 0; }
        .notif-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          margin-right: 6px;
          border-radius: 50%;
          background: #f59e0b;
          vertical-align: middle;
        }
        .notif-title {
          margin: 0 0 2px;
          font-family: 'Inconsolata', monospace;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: #fff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .notif-title.read-title { color: rgba(232,232,240,0.6); }
        .notif-message {
          margin: 0;
          font-family: 'Inconsolata', monospace;
          font-size: 0.72rem;
          line-height: 1.45;
          color: rgba(232,232,240,0.55);
        }
        .notif-time {
          display: block;
          margin-top: 4px;
          font-family: 'Inconsolata', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(232,232,240,0.3);
        }

        .notif-empty {
          padding: 2rem 1rem;
          text-align: center;
          font-family: 'Inconsolata', monospace;
          font-size: 0.78rem;
          color: rgba(232,232,240,0.4);
        }
        .notif-loading {
          padding: 2rem 1rem;
          text-align: center;
          font-family: 'Inconsolata', monospace;
          font-size: 0.75rem;
          color: rgba(232,232,240,0.3);
        }

        @media (max-width: 500px) {
          .notif-panel {
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            width: auto;
            max-height: 70vh;
            border-radius: 0;
          }
        }
      `}</style>

      <button
        className="notif-button"
        onClick={openPanel}
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-header">
            <h3>
              Notifications <span>{unread > 0 ? `${unread} unread` : 'all clear'}</span>
            </h3>
            {unread > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="notif-loading">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty">No notifications yet.</div>
          ) : (
            <div className="notif-list">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  className={`notif-item${item.read ? '' : ' unread'}`}
                  onClick={() => handleClick(item)}
                >
                  <div className="notif-icon">
                    <TypeIcon type={item.type} />
                  </div>
                  <div className="notif-body">
                    <p className={`notif-title${item.read ? ' read-title' : ''}`}>
                      {!item.read && <span className="notif-dot" />}
                      {item.title}
                    </p>
                    <p className="notif-message">{item.message}</p>
                    <span className="notif-time">{timeAgo(item.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell