import Navbar from '../components/Navbar'
import ExpenseList from '../components/ExpenseList'
import { Link } from 'react-router-dom'

function Expenses() {
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

        .exp-root {
          min-height: 100vh;
          background: #080810;
          position: relative;
          overflow-x: hidden;
        }

        /* Grid background */
        .exp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        /* Ambient glow */
        .exp-root::after {
          content: '';
          position: fixed;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 500px;
          background: radial-gradient(ellipse, rgba(245,158,11,0.05) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .exp-content {
          position: relative;
          z-index: 1;
          max-width: 900px;
          margin: 0 auto;
          padding: 2.5rem 2rem 4rem;
          animation: fadeUp 0.45s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: rgba(232,232,240,0.35);
          text-decoration: none;
          font-size: 0.8rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 2rem;
          transition: color 0.2s;
        }
        .back-link:hover { color: #f59e0b; }

        /* Header row */
        .exp-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .exp-eyebrow {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #f59e0b;
          margin-bottom: 0.3rem;
        }
        .exp-title {
          font-family: 'Syne', sans-serif;
          font-size: 2.4rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.4rem;
          background: #f59e0b;
          color: #080810;
          font-family: 'Inconsolata', monospace;
          font-size: 0.9rem;
          font-weight: 600;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .btn-primary:hover { background: #fbbf24; transform: translateY(-2px); }

        /* List panel */
        .exp-panel {
          background: #0e0e1a;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          overflow: hidden;
        }

        .exp-panel-top {
          height: 3px;
          background: linear-gradient(90deg, #f59e0b, #ec4899, #3b82f6);
        }

        .exp-panel-body {
          padding: 1.8rem;
        }

        .panel-label {
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(232,232,240,0.35);
          margin-bottom: 1.4rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .panel-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }

        @media (max-width: 500px) {
          .exp-content { padding: 1.5rem 1rem 3rem; }
          .exp-title { font-size: 1.8rem; }
        }
      `}</style>

      <div className="exp-root">
        <Navbar />

        <div className="exp-content">
          <Link to="/" className="back-link">← Dashboard</Link>

          <div className="exp-header">
            <div>
              <p className="exp-eyebrow">History</p>
              <h1 className="exp-title">All Expenses</h1>
            </div>
            <Link to="/add" className="btn-primary">+ Add Expense</Link>
          </div>

          <div className="exp-panel">
            <div className="exp-panel-top" />
            <div className="exp-panel-body">
              <p className="panel-label">Records</p>
              <ExpenseList />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Expenses