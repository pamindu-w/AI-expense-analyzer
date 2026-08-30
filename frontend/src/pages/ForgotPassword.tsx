import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/api'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ message: string; dev_link?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await forgotPassword(email)
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

        .fp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(ellipse at 30% 60%, rgba(99,60,180,0.3) 0%, transparent 60%),
                      #0d0d0d;
          padding: 2rem;
        }
        .fp-card {
          width: 100%;
          max-width: 420px;
          animation: fpUp 0.5s ease both;
        }
        @keyframes fpUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fp-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          color: #fff;
          margin-bottom: 2.4rem;
          text-align: center;
        }
        .fp-logo span { color: #a78bfa; }
        .fp-heading {
          font-family: 'Playfair Display', serif;
          font-size: 1.8rem;
          color: #fff;
          margin-bottom: 0.4rem;
          text-align: center;
        }
        .fp-sub {
          color: rgba(255,255,255,0.4);
          font-size: 0.9rem;
          text-align: center;
          margin-bottom: 2rem;
        }
        .fp-field { margin-bottom: 1.2rem; }
        .fp-field label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.5rem;
        }
        .fp-field input {
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
        .fp-field input:focus { border-color: #7c3aed; }
        .fp-error {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: #f87171;
          border-radius: 8px;
          padding: 0.7rem 1rem;
          font-size: 0.875rem;
          margin-bottom: 1.2rem;
        }
        .fp-success {
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.3);
          color: #34d399;
          border-radius: 8px;
          padding: 0.8rem 1rem;
          font-size: 0.875rem;
          line-height: 1.6;
          margin-bottom: 1.2rem;
          word-break: break-all;
        }
        .fp-dev {
          display: block;
          margin-top: 0.6rem;
          color: #a78bfa;
          font-size: 0.8rem;
          text-decoration: none;
        }
        .fp-btn {
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
        .fp-btn:hover { opacity: 0.92; transform: translateY(-1px); }
        .fp-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .fp-back {
          display: block;
          text-align: center;
          color: rgba(255,255,255,0.4);
          font-size: 0.85rem;
          text-decoration: none;
          margin-top: 1.4rem;
        }
        .fp-back:hover { color: #a78bfa; }
      `}</style>

      <div className="fp-root">
        <div className="fp-card">
          <div className="fp-logo">spend<span>wise</span></div>

          {!done ? (
            <>
              <h1 className="fp-heading">Forgot password?</h1>
              <p className="fp-sub">
                Enter your account email and we'll send you a reset link.
              </p>

              {error && <div className="fp-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="fp-field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button className="fp-btn" type="submit" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="fp-heading">Check your email</h1>
              <div className="fp-success">{done.message}</div>
              {done.dev_link && (
                <div className="fp-success">
                  DEV MODE — no SMTP configured. Use this link directly:
                  <a className="fp-dev" href={done.dev_link}>{done.dev_link}</a>
                </div>
              )}
            </>
          )}

          <Link className="fp-back" to="/login">← Back to sign in</Link>
        </div>
      </div>
    </>
  )
}

export default ForgotPassword