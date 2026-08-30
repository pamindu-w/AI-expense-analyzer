import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/api'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await resetPassword(token, password)
      setDone(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0d0d0d;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
        }

        .rp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(ellipse at 30% 60%, rgba(99,60,180,0.3) 0%, transparent 60%),
                      #0d0d0d;
          padding: 2rem;
        }
        .rp-card {
          width: 100%;
          max-width: 420px;
          animation: rpUp 0.5s ease both;
        }
        @keyframes rpUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rp-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          color: #fff;
          margin-bottom: 2.4rem;
          text-align: center;
        }
        .rp-logo span { color: #a78bfa; }
        .rp-heading {
          font-family: 'Playfair Display', serif;
          font-size: 1.8rem;
          color: #fff;
          margin-bottom: 0.4rem;
          text-align: center;
        }
        .rp-sub {
          color: rgba(255,255,255,0.4);
          font-size: 0.9rem;
          text-align: center;
          margin-bottom: 2rem;
        }
        .rp-field { margin-bottom: 1.2rem; }
        .rp-field label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.5rem;
        }
        .rp-field input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 0.85rem 1rem;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .rp-field input:focus { border-color: #7c3aed; }
        .rp-error {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: #f87171;
          border-radius: 8px;
          padding: 0.7rem 1rem;
          font-size: 0.875rem;
          margin-bottom: 1.2rem;
        }
        .rp-success {
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.3);
          color: #34d399;
          border-radius: 8px;
          padding: 0.8rem 1rem;
          font-size: 0.875rem;
          margin-bottom: 1.2rem;
          text-align: center;
        }
        .rp-btn {
          width: 100%;
          padding: 0.9rem;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
        }
        .rp-btn:hover { opacity: 0.92; transform: translateY(-1px); }
        .rp-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .rp-back {
          display: block;
          text-align: center;
          color: rgba(255,255,255,0.4);
          font-size: 0.85rem;
          text-decoration: none;
          margin-top: 1.4rem;
        }
        .rp-back:hover { color: #a78bfa; }
      `}</style>

      <div className="rp-root">
        <div className="rp-card">
          <div className="rp-logo">spend<span>wise</span></div>

          {!done ? (
            <>
              <h1 className="rp-heading">Set a new password</h1>
              <p className="rp-sub">Choose a strong password you haven't used before.</p>

              {!token && <div className="rp-error">This reset link is missing its token.</div>}
              {error && <div className="rp-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="rp-field">
                  <label>New password</label>
                  <input
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="rp-field">
                  <label>Confirm password</label>
                  <input
                    type="password"
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
                <button className="rp-btn" type="submit" disabled={loading || !token}>
                  {loading ? 'Resetting…' : 'Reset password'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="rp-heading">Password updated</h1>
              <div className="rp-success">{done.message}</div>
              <Link className="rp-btn" to="/login" style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}>
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default ResetPassword