import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { getBudgetProgress, createBudget, updateBudget } from '../services/api'

type BudgetProgress = {
  id?: number
  category: string
  month: string
  limit: number
  spent: number
  remaining: number
  percentage: number
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Shopping: '#ec4899',
  Bills: '#ef4444',
  Entertainment: '#8b5cf6',
  Other: '#10b981',
}

export default function Budgets() {
  const [budgets, setBudgets] = useState<BudgetProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [category, setCategory] = useState('')
  const [limit, setLimit] = useState('')

  const today = new Date()
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  // Handles "2026-06", "2026-06-01", "2026-06-01T00:00:00.000Z", etc.
  function isSameMonth(budgetMonth: string) {
    return budgetMonth.startsWith(currentMonth)
  }

  async function loadBudgets() {
    setLoading(true)
    try {
      const data = await getBudgetProgress()
      setBudgets(data)
    } catch (err) {
      console.warn('Failed to load budgets:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBudgets()
    const handleFocus = () => {
      loadBudgets()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  async function handleCreateBudget(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createBudget({ category, limit: Number(limit), month: currentMonth })
      setCategory('')
      setLimit('')
      setFormOpen(false)
      loadBudgets()
    } catch (err) {
      console.warn('Failed to create budget:', err)
      alert('Failed to create budget')
    } finally {
      setSubmitting(false)
    }
  }

  function getStatusColor(pct: number) {
    if (pct >= 90) return '#ef4444'
    if (pct >= 70) return '#f59e0b'
    return '#10b981'
  }

  function getStatusLabel(pct: number) {
    if (pct >= 100) return { text: 'OVER BUDGET', color: '#ef4444' }
    if (pct >= 90) return { text: 'CRITICAL', color: '#ef4444' }
    if (pct >= 70) return { text: 'WARNING', color: '#f59e0b' }
    return { text: 'ON TRACK', color: '#10b981' }
  }

  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const overBudget = budgets.filter((b) => b.percentage >= 100).length

  async function handleChangeLimit(budget: BudgetProgress) {
    const input = prompt(`Enter new limit for ${budget.category} (${budget.month})`, String(budget.limit))
    if (!input) return
    const newLimit = Number(input)
    if (isNaN(newLimit) || newLimit <= 0) {
      alert('Please enter a valid number greater than 0')
      return
    }
    try {
      await updateBudget((budget as any).id, newLimit)
      await loadBudgets()
    } catch (err) {
      console.warn('Failed to update budget:', err)
      alert('Failed to update budget')
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #07070f;
          color: #e4e4f0;
          font-family: 'DM Mono', monospace;
        }

        .b-root {
          min-height: 100vh;
          background: #07070f;
          position: relative;
          overflow-x: hidden;
        }

        .b-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        .b-root::after {
          content: '';
          position: fixed;
          top: -150px;
          right: -150px;
          width: 500px;
          height: 500px;
          background: radial-gradient(ellipse, rgba(16,185,129,0.05) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .b-content {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2.5rem 2rem 5rem;
        }

        .b-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 1.5rem;
          animation: fadeDown 0.5s ease both;
        }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px) scaleY(0.96); }
          to { opacity: 1; transform: translateY(0) scaleY(1); }
        }

        @keyframes fillBar {
          from { width: 0%; }
        }

        .b-eyebrow {
          font-size: 0.62rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #10b981;
          margin-bottom: 0.4rem;
        }

        .b-title {
          font-family: 'Syne', sans-serif;
          font-size: 2.8rem;
          font-weight: 800;
          color: #fff;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .b-subtitle {
          font-size: 0.72rem;
          color: rgba(228,228,240,0.3);
          margin-top: 0.5rem;
          letter-spacing: 0.05em;
        }

        .b-hint {
          grid-column: 1 / -1;
          font-size: 0.75rem;
          color: rgba(228,228,240,0.4);
          border: 1px dashed rgba(16,185,129,0.4);
          border-radius: 8px;
          padding: 0.7rem 0.9rem;
          background: rgba(16,185,129,0.05);
        }

        .add-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #10b981;
          color: #07070f;
          border: none;
          border-radius: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          letter-spacing: 0.04em;
          transition: 0.2s;
          white-space: nowrap;
        }

        .add-btn:hover {
          background: #059669;
          transform: translateY(-2px);
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.12);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 2rem;
          animation: fadeUp 0.5s 0.1s ease both;
        }

        .stat-cell {
          background: #0b0b18;
          padding: 1.5rem 1.8rem;
          position: relative;
        }

        .stat-cell::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
        }

        .stat-cell:nth-child(1)::before { background: #10b981; }
        .stat-cell:nth-child(2)::before { background: #3b82f6; }
        .stat-cell:nth-child(3)::before { background: #ef4444; }

        .stat-lbl {
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(228,228,240,0.35);
          margin-bottom: 0.6rem;
        }

        .stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 1.9rem;
          font-weight: 700;
          color: #fff;
        }

        .form-panel {
          background: #0b0b18;
          border: 1px solid rgba(16,185,129,0.15);
          border-radius: 14px;
          padding: 2rem;
          margin-bottom: 2rem;
          animation: slideIn 0.3s ease both;
        }

        .form-panel h3 {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .field label {
          font-size: 0.58rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(228,228,240,0.4);
        }

        .field input,
        .field select {
          background: #111126;
          border: 1px solid rgba(16,185,129,0.15);
          border-radius: 8px;
          color: #e4e4f0;
          padding: 0.75rem 1rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.82rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .field input:focus,
        .field select:focus { border-color: #10b981; }

        .field select option { background: #111126; }

        .form-actions { display: flex; gap: 0.75rem; }

        .btn-submit {
          padding: 0.75rem 1.8rem;
          background: #10b981;
          color: #07070f;
          border: none;
          border-radius: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 0.78rem;
          cursor: pointer;
          transition: 0.2s;
        }

        .btn-submit:hover:not(:disabled) { background: #059669; }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-cancel {
          padding: 0.75rem 1.4rem;
          background: transparent;
          color: rgba(228,228,240,0.4);
          border: 1px solid rgba(228,228,240,0.1);
          border-radius: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 0.78rem;
          cursor: pointer;
          transition: 0.2s;
        }

        .btn-cancel:hover {
          border-color: rgba(228,228,240,0.3);
          color: #e4e4f0;
        }

        .section-label {
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(228,228,240,0.28);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(228,228,240,0.05);
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.2rem;
        }

        .b-card {
          background: #0b0b18;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          padding: 1.6rem;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s, transform 0.2s;
          animation: fadeUp 0.4s ease both;
        }

        .b-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255,255,255,0.1);
        }

        .b-card-accent {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
        }

        .b-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.4rem;
        }

        .b-card-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .b-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .b-card-name {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .b-card-month {
          font-size: 0.65rem;
          color: rgba(228,228,240,0.35);
          letter-spacing: 0.08em;
          margin-top: 0.1rem;
        }

        .status-pill {
          font-size: 0.58rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 500;
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
        }

        .amounts-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.4rem;
        }

        .amount-box {
          background: #111126;
          border-radius: 8px;
          padding: 0.65rem 0.75rem;
        }

        .amount-key {
          font-size: 0.52rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(228,228,240,0.3);
          margin-bottom: 0.25rem;
        }

        .amount-val {
          font-family: 'Syne', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #fff;
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .progress-pct {
          font-size: 0.72rem;
          font-weight: 500;
          color: rgba(228,228,240,0.5);
        }

        .progress-track {
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 999px;
          animation: fillBar 0.8s ease both;
        }

        .empty-state {
          text-align: center;
          padding: 4rem;
          color: rgba(228,228,240,0.2);
          font-size: 0.8rem;
          letter-spacing: 0.08em;
        }

        .loading {
          text-align: center;
          padding: 4rem;
          color: rgba(228,228,240,0.2);
          font-size: 0.78rem;
          letter-spacing: 0.1em;
        }

        @media (max-width: 768px) {
          .b-title { font-size: 2rem; }
          .stats-row { grid-template-columns: 1fr; }
          .cards-grid { grid-template-columns: 1fr; }
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="b-root">
        <Navbar />

        <div className="b-content">
          {/* HEADER */}
          <div className="b-header">
            <div>
              <p className="b-eyebrow">Spending Control</p>
              <h1 className="b-title">Budgets</h1>
              <p className="b-subtitle">// track limits by category — renews each month</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn-cancel" onClick={loadBudgets}>
                Refresh
              </button>
              <button className="add-btn" onClick={() => setFormOpen(!formOpen)}>
                {formOpen ? '✕ Cancel' : '+ New Budget'}
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="stats-row">
            <div className="stat-cell">
              <p className="stat-lbl">Total Budgeted</p>
              <p className="stat-num">Rs {totalBudgeted.toFixed(0)}</p>
            </div>
            <div className="stat-cell">
              <p className="stat-lbl">Total Spent</p>
              <p className="stat-num">Rs {totalSpent.toFixed(0)}</p>
            </div>
            <div className="stat-cell">
              <p className="stat-lbl">Over Budget</p>
              <p className="stat-num">{overBudget}</p>
            </div>
          </div>

          {/* FORM */}
          {formOpen && (
            <div className="form-panel">
              <h3>// Set New Budget</h3>
              <form onSubmit={handleCreateBudget}>
                <div className="form-grid">
                  <div className="field">
                    <label>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                      <option value="">Select...</option>
                      <option value="Food">Food</option>
                      <option value="Transport">Transport</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Bills">Bills</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Limit (Rs)</label>
                    <input
                      type="number"
                      placeholder="500"
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      required
                    />
                  </div>
                  <p className="b-hint">This budget applies every month — it refreshes automatically when the month changes.</p>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-submit" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Budget'}
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setFormOpen(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="loading">// loading budgets...</div>
          ) : budgets.length === 0 ? (
            <div className="empty-state">// no budgets yet — create one above</div>
          ) : (
            <>
              <p className="section-label">Budget Overview — {budgets.length} active</p>
              <div className="cards-grid">
                {budgets.map((budget, i) => {
                  const color = CATEGORY_COLORS[budget.category] || '#10b981'
                  const isCurrentMonth = isSameMonth(budget.month)
                  const displaySpent = isCurrentMonth ? budget.spent : 0
                  const displayRemaining = isCurrentMonth ? budget.remaining : budget.limit
                  const displayPercentage = isCurrentMonth ? budget.percentage : 0
                  const barColor = getStatusColor(isCurrentMonth ? budget.percentage : 0)
                  const status = getStatusLabel(isCurrentMonth ? budget.percentage : 0)
                  const pct = Math.min(displayPercentage, 100)

                  return (
                    <div
                      className="b-card"
                      key={budget.category + budget.month}
                      style={{ animationDelay: `${i * 0.06}s` }}
                    >
                      <div className="b-card-accent" style={{ background: barColor }} />

                      <div className="b-card-top">
                        <div className="b-card-left">
                          <div
                            className="b-card-icon"
                            style={{ background: `${color}18`, fontSize: '0.7rem', letterSpacing: '0.1em', color: color }}
                          >
                            {budget.category.slice(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <div className="b-card-name">{budget.category}</div>
                            <div className="b-card-month">{budget.month}</div>
                          </div>
                        </div>
                        <span
                          className="status-pill"
                          style={{
                            background: `${status.color}15`,
                            color: status.color,
                            border: `1px solid ${status.color}30`,
                          }}
                        >
                          {status.text}
                        </span>
                      </div>

                      <div className="amounts-row">
                        <div className="amount-box">
                          <p className="amount-key">Limit</p>
                          <p className="amount-val">Rs {budget.limit}</p>
                        </div>
                        <div className="amount-box">
                          <p className="amount-key">Spent</p>
                          <p className="amount-val" style={{ color: barColor }}>
                            Rs {displaySpent}
                          </p>
                        </div>
                        <div className="amount-box">
                          <p className="amount-key">Left</p>
                          <p className="amount-val" style={{ color: displayRemaining < 0 ? '#ef4444' : '#10b981' }}>
                            Rs {Math.abs(displayRemaining)}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' }}>
                        <div style={{ flex: 1 }}>
                          <div className="progress-label">
                            <span className="progress-pct">{displayPercentage}% used</span>
                            <span className="progress-pct">Rs {Math.max(budget.limit - displaySpent, 0)} left</span>
                          </div>
                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{ width: `${pct}%`, background: barColor }}
                            />
                          </div>
                        </div>
                        <div style={{ marginLeft: '0.9rem' }}>
                          <button className="btn-cancel" onClick={() => handleChangeLimit(budget)}>
                            Change Limit
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}