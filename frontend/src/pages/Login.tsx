import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { API_URL } from '../services/api'

export async function loginUser(data: { email: string; password: string }) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return response.json()
}

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await loginUser(form)
      if (res.detail) {
        setError(res.detail)
      } else if (res.access_token) {
        localStorage.setItem('access_token', res.access_token)
        navigate('/dashboard')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'DM Sans', sans-serif;
          background: #0d0d0d;
        }

        /* LEFT PANEL */
        .auth-panel {
          position: relative;
          background: linear-gradient(145deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
          overflow: hidden;
        }
        .auth-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 60%, rgba(99,60,180,0.35) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(30,120,200,0.2) 0%, transparent 50%);
        }
        .panel-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.4;
        }
        .orb-1 { width: 300px; height: 300px; background: #7c3aed; top: -80px; left: -80px; }
        .orb-2 { width: 200px; height: 200px; background: #2563eb; bottom: 100px; right: -50px; }
        .orb-3 { width: 150px; height: 150px; background: #db2777; bottom: -40px; left: 40%; }

        .panel-logo {
          position: relative;
          font-family: 'Playfair Display', serif;
          font-size: 1.6rem;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .panel-logo span { color: #a78bfa; }

        .panel-body { position: relative; }
        .panel-tagline {
          font-family: 'Playfair Display', serif;
          font-size: 2.8rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.15;
          margin-bottom: 1.2rem;
        }
        .panel-tagline em { color: #a78bfa; font-style: normal; }
        .panel-sub {
          color: rgba(255,255,255,0.55);
          font-size: 1rem;
          line-height: 1.6;
          max-width: 320px;
        }

        .panel-quote {
          position: relative;
          border-left: 3px solid rgba(167,139,250,0.5);
          padding-left: 1.2rem;
        }
        .quote-text {
          font-family: 'Playfair Display', serif;
          color: rgba(255,255,255,0.7);
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 0.5rem;
          font-style: italic;
        }
        .quote-author {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* RIGHT PANEL - FORM */
        .auth-form-side {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0d0d0d;
          padding: 2rem;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          animation: slideUp 0.5s ease both;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .auth-heading {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          color: #fff;
          margin-bottom: 0.4rem;
        }
        .auth-sub {
          color: rgba(255,255,255,0.4);
          font-size: 0.9rem;
          margin-bottom: 2.4rem;
        }
        .auth-sub a {
          color: #a78bfa;
          text-decoration: none;
          font-weight: 500;
        }
        .auth-sub a:hover { text-decoration: underline; }

        .field { margin-bottom: 1.2rem; }
        .field label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.5rem;
        }
        .field input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 0.85rem 1rem;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .field input::placeholder { color: rgba(255,255,255,0.2); }
        .field input:focus {
          border-color: #7c3aed;
          background: rgba(124,58,237,0.08);
        }

        .auth-error {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: #f87171;
          border-radius: 8px;
          padding: 0.7rem 1rem;
          font-size: 0.875rem;
          margin-bottom: 1.2rem;
        }

        .auth-btn {
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
          margin-top: 0.4rem;
          position: relative;
          overflow: hidden;
        }
        .auth-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #9f67ff, #6366f1);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .auth-btn:hover::after { opacity: 1; }
        .auth-btn:hover { transform: translateY(-1px); }
        .auth-btn:active { transform: translateY(0); }
        .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .auth-btn span { position: relative; z-index: 1; }

        @media (max-width: 768px) {
          .auth-root { grid-template-columns: 1fr; }
          .auth-panel { display: none; }
        }
      `}</style>

      <div className="auth-root">
        {/* Left decorative panel */}
        <div className="auth-panel">
          <div className="panel-orb orb-1" />
          <div className="panel-orb orb-2" />
          <div className="panel-orb orb-3" />

          <div className="panel-logo">spend<span>wise</span></div>

          <div className="panel-body">
            <h2 className="panel-tagline">
              Welcome <em>back</em> to your financial overview
            </h2>
            <p className="panel-sub">
              Your expenses are waiting. Log in to pick up right where you left off.
            </p>
          </div>

          <div className="panel-quote">
            <p className="quote-text">
              "Beware of little expenses. A small leak will sink a great ship."
            </p>
            <p className="quote-author">— Benjamin Franklin</p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="auth-form-side">
          <div className="auth-card">
            <h1 className="auth-heading">Sign in</h1>
            <p className="auth-sub">
              Don't have an account?{' '}
              <Link to="/signup">Create one</Link>
            </p>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label>Password</label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button className="auth-btn" type="submit" disabled={loading}>
                <span>{loading ? 'Signing in…' : 'Sign in'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}