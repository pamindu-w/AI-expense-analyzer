import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { API_URL, deleteAccount, logout } from '../services/api'

function Settings() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<{ username: string; email: string } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return
    fetch(`${API_URL}/validate`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.email && data.username) {
          setProfile({ email: data.email, username: data.username })
        }
      })
      .catch(() => {})
  }, [])

  async function handleDelete() {
    if (!password.trim()) return
    setLoading(true)
    setError(null)
    try {
      await deleteAccount(password)
      logout()
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account.')
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inconsolata:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #080810;
          color: #e8e8f0;
          font-family: 'Inconsolata', monospace;
        }

        .set-root {
          min-height: 100vh;
          background: #080810;
          position: relative;
          overflow-x: hidden;
        }
        .set-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .set-content {
          position: relative;
          max-width: 720px;
          margin: 0 auto;
          padding: 2rem 1.5rem 3rem;
        }

        .back-link {
          display: inline-block;
          color: rgba(232,232,240,0.45);
          font-size: 0.82rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-decoration: none;
          text-transform: uppercase;
          margin-bottom: 2rem;
          transition: color 0.2s;
        }
        .back-link:hover { color: #f59e0b; }

        .set-eyebrow {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #f59e0b;
          margin-bottom: 0.3rem;
        }
        .set-title {
          font-family: 'Syne', sans-serif;
          font-size: 2.4rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 2rem;
        }

        .set-panel {
          background: #0e0e1a;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }
        .set-panel-top {
          height: 3px;
          background: linear-gradient(90deg, #f59e0b, #ec4899, #3b82f6);
        }
        .set-panel-body { padding: 1.6rem 1.8rem; }

        .set-label {
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(232,232,240,0.35);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .set-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }

        .profile-row {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.7rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 0.92rem;
        }
        .profile-row:last-child { border-bottom: none; }
        .profile-key { color: rgba(232,232,240,0.45); }
        .profile-value { color: #fff; font-weight: 500; word-break: break-all; text-align: right; }

        .danger-zone {
          border-top: 1px solid rgba(239,68,68,0.2);
          padding-top: 1.2rem;
          margin-top: 1rem;
        }
        .danger-text {
          font-size: 0.9rem;
          color: rgba(232,232,240,0.7);
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        .btn-danger {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.4);
          color: #f87171;
          font-family: 'Inconsolata', monospace;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-danger:hover { background: rgba(239,68,68,0.22); }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 1rem;
        }
        .modal {
          background: #0e0e1a;
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 14px;
          padding: 1.8rem;
          width: 100%;
          max-width: 420px;
        }
        .modal-title {
          font-family: 'Syne', sans-serif;
          color: #f87171;
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 0.6rem;
        }
        .modal-text {
          color: rgba(232,232,240,0.7);
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 1.2rem;
        }
        .modal-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          color: #e8e8f0;
          font-family: 'Inconsolata', monospace;
          font-size: 0.92rem;
          padding: 0.7rem 0.9rem;
          outline: none;
          margin-bottom: 1rem;
          transition: border-color 0.2s;
        }
        .modal-input:focus { border-color: rgba(239,68,68,0.6); }
        .modal-actions {
          display: flex;
          gap: 0.6rem;
          justify-content: flex-end;
        }
        .modal-btn {
          font-family: 'Inconsolata', monospace;
          font-size: 0.82rem;
          font-weight: 600;
          padding: 0.55rem 1.1rem;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.15);
          background: transparent;
          color: rgba(232,232,240,0.7);
          cursor: pointer;
          transition: all 0.2s;
        }
        .modal-btn:hover { color: #fff; border-color: rgba(255,255,255,0.3); }
        .modal-btn.delete {
          background: #ef4444;
          border-color: #ef4444;
          color: #fff;
        }
        .modal-btn.delete:hover { background: #dc2626; }
        .modal-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-error {
          color: #f87171;
          font-size: 0.82rem;
          margin-bottom: 0.8rem;
        }

        @media (max-width: 500px) {
          .set-content { padding: 1.5rem 1rem 3rem; }
          .set-title { font-size: 1.8rem; }
        }
      `}</style>

      <div className="set-root">
        <Navbar />

        <div className="set-content">
          <Link to="/dashboard" className="back-link">← Dashboard</Link>
          <p className="set-eyebrow">Account</p>
          <h1 className="set-title">Settings</h1>

          <div className="set-panel">
            <div className="set-panel-top" />
            <div className="set-panel-body">
              <p className="set-label">Profile</p>
              <div className="profile-row">
                <span className="profile-key">Username</span>
                <span className="profile-value">{profile?.username ?? '—'}</span>
              </div>
              <div className="profile-row">
                <span className="profile-key">Email</span>
                <span className="profile-value">{profile?.email ?? '—'}</span>
              </div>
            </div>
          </div>

          <div className="set-panel">
            <div className="set-panel-top" />
            <div className="set-panel-body">
              <p className="set-label">Danger Zone</p>
              <div className="danger-zone">
                <p className="danger-text">
                  Deleting your account permanently removes all expenses, budgets,
                  recurring expenses, notifications, and chat history. This cannot be undone.
                </p>
                <button className="btn-danger" onClick={() => setConfirmOpen(true)}>
                  Delete account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className="modal-overlay" onClick={() => !loading && setConfirmOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete your account?</h2>
            <p className="modal-text">
              This permanently deletes the account{' '}
              <strong style={{ color: '#fff' }}>{profile?.email ?? ''}</strong> and all of its
              data. Type your password to confirm.
            </p>

            {error && <div className="modal-error">{error}</div>}

            <input
              className="modal-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && password.trim() && !loading) handleDelete()
              }}
              autoFocus
            />

            <div className="modal-actions">
              <button className="modal-btn" onClick={() => setConfirmOpen(false)} disabled={loading}>
                Cancel
              </button>
              <button
                className="modal-btn delete"
                onClick={handleDelete}
                disabled={loading || !password.trim()}
              >
                {loading ? 'Deleting…' : 'Delete forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Settings