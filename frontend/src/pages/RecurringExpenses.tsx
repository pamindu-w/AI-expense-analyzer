import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'

type RecurringExpense = {
  id: number
  title: string
  amount: number
  category: string
  frequency: string
  next_run: string
  active: boolean
  deactivated_at?: string
}



const CATEGORY_COLORS: Record<string, string> = {
  Bills: '#ef4444',
  Entertainment: '#8b5cf6',
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Shopping: '#ec4899',
  Other: '#10b981',
}

const FREQ_LABEL: Record<string, string> = {
  monthly: 'Monthly',
  weekly: 'Weekly',
}

export default function RecurringExpenses() {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [nextRun, setNextRun] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function loadRecurringExpenses() {
    const token = localStorage.getItem('access_token')
    const response = await fetch('http://localhost:8000/recurring-expenses', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    setExpenses(data)
    setLoading(false)
  }

  useEffect(() => {
    loadRecurringExpenses()
  }, [])

  async function createRecurringExpense(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const token = localStorage.getItem('access_token')
    const response = await fetch('http://localhost:8000/recurring-expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        amount: Number(amount),
        category,
        frequency,
        next_run: nextRun,
      }),
    })
    setSubmitting(false)
    if (response.ok) {
      setTitle('')
      setAmount('')
      setCategory('')
      setFrequency('monthly')
      setNextRun('')
      setFormOpen(false)
      loadRecurringExpenses()
    } else {
      alert('Failed to create recurring expense')
    }
  }

  async function toggleStatus(expense: RecurringExpense) {
    const token = localStorage.getItem('access_token')
    const response = await fetch(
      `http://localhost:8000/recurring-expenses/${expense.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !expense.active }),
      }
    )
    if (!response.ok) {
      const text = await response.text()
      alert(`Failed to update: ${text}`)
      return
    }
    const updated = await response.json()
    setExpenses((curr) => curr.map((i) => (i.id === updated.id ? updated : i)))
    if (updated.active) {
      setStatusMessage(`✓ ${updated.title} reactivated`)
    } else {
      const period = updated.frequency === 'weekly' ? 'next week' : 'next month'
      setStatusMessage(`✗ ${updated.title} paused from ${period}`)
    }
    setTimeout(() => setStatusMessage(''), 4000)
  }

  const active = expenses.filter((e) => e.active)
  const inactive = expenses.filter((e) => !e.active)
  const totalMonthly = active.reduce((sum, e) => {
    return sum + (e.frequency === 'weekly' ? e.amount * 4.33 : e.amount)
  }, 0)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #060610;
          color: #e2e2f0;
          font-family: 'Space Mono', monospace;
        }

        .re-root {
          min-height: 100vh;
          background: #060610;
          position: relative;
          overflow-x: hidden;
        }

        /* animated grid bg */
        .re-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 0;
        }

        .re-root::after {
          content: '';
          position: fixed;
          bottom: -100px;
          right: -100px;
          width: 600px;
          height: 600px;
          background: radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .re-content {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2.5rem 2rem 5rem;
        }

        /* header */
        .re-header {
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
          from { opacity: 0; transform: translateY(-12px) scaleY(0.95); }
          to { opacity: 1; transform: translateY(0) scaleY(1); }
        }

        .re-eyebrow {
          font-size: 0.65rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #8b5cf6;
          margin-bottom: 0.4rem;
        }

        .re-title {
          font-family: 'Syne', sans-serif;
          font-size: 2.8rem;
          font-weight: 800;
          color: #fff;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .re-subtitle {
          font-size: 0.75rem;
          color: rgba(226,226,240,0.35);
          margin-top: 0.5rem;
          letter-spacing: 0.05em;
        }

        /* stats strip */
        .stats-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(139,92,246,0.15);
          border: 1px solid rgba(139,92,246,0.15);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 2rem;
          animation: fadeUp 0.5s 0.1s ease both;
        }

        .stat-block {
          background: #0c0c1e;
          padding: 1.5rem 1.8rem;
          position: relative;
        }

        .stat-block::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
        }

        .stat-block:nth-child(1)::before { background: #8b5cf6; }
        .stat-block:nth-child(2)::before { background: #10b981; }
        .stat-block:nth-child(3)::before { background: #ef4444; }

        .stat-label {
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(226,226,240,0.35);
          margin-bottom: 0.6rem;
        }

        .stat-val {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #fff;
        }

        /* add button */
        .add-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #8b5cf6;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: 'Space Mono', monospace;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.05em;
          transition: 0.2s;
          white-space: nowrap;
        }

        .add-btn:hover {
          background: #7c3aed;
          transform: translateY(-2px);
        }

        /* form panel */
        .form-panel {
          background: #0c0c1e;
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 14px;
          padding: 2rem;
          margin-bottom: 2rem;
          animation: slideIn 0.3s ease both;
        }

        .form-panel h3 {
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
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

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .field-group label {
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(226,226,240,0.4);
        }

        .field-group input,
        .field-group select {
          background: #13132a;
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 8px;
          color: #e2e2f0;
          padding: 0.75rem 1rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.82rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .field-group input:focus,
        .field-group select:focus {
          border-color: #8b5cf6;
        }

        .field-group select option {
          background: #13132a;
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-submit {
          padding: 0.75rem 1.8rem;
          background: #8b5cf6;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          transition: 0.2s;
        }

        .btn-submit:hover:not(:disabled) { background: #7c3aed; }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-cancel {
          padding: 0.75rem 1.4rem;
          background: transparent;
          color: rgba(226,226,240,0.5);
          border: 1px solid rgba(226,226,240,0.1);
          border-radius: 8px;
          font-family: 'Space Mono', monospace;
          font-size: 0.8rem;
          cursor: pointer;
          transition: 0.2s;
        }

        .btn-cancel:hover {
          border-color: rgba(226,226,240,0.3);
          color: #e2e2f0;
        }

        /* status toast */
        .toast {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.4rem;
          border-radius: 10px;
          background: rgba(139,92,246,0.1);
          border: 1px solid rgba(139,92,246,0.25);
          color: #a78bfa;
          font-size: 0.8rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          animation: slideIn 0.3s ease both;
        }

        /* section label */
        .section-label {
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(226,226,240,0.3);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(226,226,240,0.06);
        }

        /* cards grid */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
          margin-bottom: 2.5rem;
        }

        .card {
          background: #0c0c1e;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 1.6rem;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s, transform 0.2s;
          animation: fadeUp 0.4s ease both;
        }

        .card:hover {
          border-color: rgba(139,92,246,0.25);
          transform: translateY(-3px);
        }

        .card.inactive-card {
          opacity: 0.55;
        }

        .card-accent {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
        }

        .card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.2rem;
        }

        .card-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }

        .card-badge {
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
          padding: 0.3rem 0.7rem;
          border-radius: 999px;
        }

        .badge-active {
          background: rgba(16,185,129,0.12);
          color: #10b981;
          border: 1px solid rgba(16,185,129,0.2);
        }

        .badge-inactive {
          background: rgba(239,68,68,0.1);
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.15);
        }

        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.25rem;
          letter-spacing: -0.02em;
        }

        .card-category {
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 1.2rem;
        }

        .card-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1.4rem;
        }

        .meta-item {
          background: #13132a;
          border-radius: 8px;
          padding: 0.6rem 0.8rem;
        }

        .meta-key {
          font-size: 0.55rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(226,226,240,0.35);
          margin-bottom: 0.2rem;
        }

        .meta-val {
          font-size: 0.85rem;
          color: #e2e2f0;
          font-weight: 700;
        }

        .card-amount {
          font-family: 'Syne', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 1.2rem;
          letter-spacing: -0.02em;
        }

        .toggle-btn {
          width: 100%;
          padding: 0.7rem;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: rgba(226,226,240,0.6);
          font-family: 'Space Mono', monospace;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: 0.2s;
          text-transform: uppercase;
        }

        .toggle-btn:hover {
          background: rgba(139,92,246,0.1);
          border-color: rgba(139,92,246,0.3);
          color: #a78bfa;
        }

        .toggle-btn.deactivate:hover {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.2);
          color: #ef4444;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: rgba(226,226,240,0.25);
          font-size: 0.85rem;
          letter-spacing: 0.05em;
        }

        .loading {
          text-align: center;
          padding: 4rem;
          color: rgba(226,226,240,0.25);
          font-size: 0.8rem;
          letter-spacing: 0.1em;
        }

        @media (max-width: 768px) {
          .re-title { font-size: 2rem; }
          .stats-strip { grid-template-columns: 1fr; }
          .cards-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="re-root">
        <Navbar />

        <div className="re-content">
          {/* HEADER */}
          <div className="re-header">
            <div>
              <p className="re-eyebrow">Subscription Tracker</p>
              <h1 className="re-title">Recurring</h1>
              <p className="re-subtitle">manage your scheduled payments</p>
            </div>
            <button className="add-btn" onClick={() => setFormOpen(!formOpen)}>
              {formOpen ? '✕ Cancel' : '+ New Recurring'}
            </button>
          </div>

          {/* STATS */}
          <div className="stats-strip">
            <div className="stat-block">
              <p className="stat-label">Monthly Burn</p>
              <p className="stat-val">${totalMonthly.toFixed(0)}</p>
            </div>
            <div className="stat-block">
              <p className="stat-label">Active</p>
              <p className="stat-val">{active.length}</p>
            </div>
            <div className="stat-block">
              <p className="stat-label">Paused</p>
              <p className="stat-val">{inactive.length}</p>
            </div>
          </div>

          {/* FORM */}
          {formOpen && (
            <div className="form-panel">
              <h3>New Recurring Expense</h3>
              <form onSubmit={createRecurringExpense}>
                <div className="form-grid">
                  <div className="field-group">
                    <label>Title</label>
                    <input
                      type="text"
                      placeholder="Netflix, Rent..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label>Amount ($)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                      <option value="">Select...</option>
                      <option value="Bills">Bills</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Food">Food</option>
                      <option value="Transport">Transport</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label>Frequency</label>
                    <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label>Next Payment</label>
                    <input
                      type="date"
                      value={nextRun}
                      onChange={(e) => setNextRun(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-submit" disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add Recurring'}
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setFormOpen(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TOAST */}
          {statusMessage && (
            <div className="toast">
              <span>◆</span> {statusMessage}
            </div>
          )}

          {loading ? (
            <div className="loading">// loading subscriptions...</div>
          ) : (
            <>
              {/* ACTIVE */}
              {active.length > 0 && (
                <>
                  <p className="section-label">Active — {active.length}</p>
                  <div className="cards-grid">
                    {active.map((expense, i) => {
                      const color = CATEGORY_COLORS[expense.category] || '#8b5cf6'
                      return (
                        <div className="card" key={expense.id} style={{ animationDelay: `${i * 0.05}s` }}>
                          <div className="card-accent" style={{ background: color }} />
                          <div className="card-top">
                            <div className="card-icon" style={{ background: `${color}18`, fontSize: '0.65rem', letterSpacing: '0.08em', color: color }}>
                              {expense.category.slice(0, 3).toUpperCase()}
                            </div>
                            <span className="card-badge badge-active">Active</span>
                          </div>
                          <div className="card-title">{expense.title}</div>
                          <div className="card-category" style={{ color }}>{expense.category}</div>
                          <div className="card-amount">${expense.amount.toFixed(2)}</div>
                          <div className="card-meta">
                            <div className="meta-item">
                              <p className="meta-key">Frequency</p>
                              <p className="meta-val">{FREQ_LABEL[expense.frequency] || expense.frequency}</p>
                            </div>
                            <div className="meta-item">
                              <p className="meta-key">Next Payment</p>
                              <p className="meta-val">
                                {new Date(expense.next_run).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <button className="toggle-btn deactivate" onClick={() => toggleStatus(expense)}>
                            Pause Subscription
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* INACTIVE */}
              {inactive.length > 0 && (
                <>
                  <p className="section-label">Paused — {inactive.length}</p>
                  <div className="cards-grid">
                    {inactive.map((expense, i) => {
                      const color = CATEGORY_COLORS[expense.category] || '#8b5cf6'
                      return (
                        <div className="card inactive-card" key={expense.id} style={{ animationDelay: `${i * 0.05}s` }}>
                          <div className="card-accent" style={{ background: 'rgba(239,68,68,0.4)' }} />
                          <div className="card-top">
                            <div className="card-icon" style={{ background: `${color}10`, fontSize: '0.65rem', letterSpacing: '0.08em', color: 'rgba(226,226,240,0.4)' }}>
                              {expense.category.slice(0, 3).toUpperCase()}
                            </div>
                            <span className="card-badge badge-inactive">Paused</span>
                          </div>
                          <div className="card-title">{expense.title}</div>
                          <div className="card-category" style={{ color: 'rgba(226,226,240,0.4)' }}>{expense.category}</div>
                          <div className="card-amount" style={{ color: 'rgba(226,226,240,0.4)' }}>${expense.amount.toFixed(2)}</div>
                          <div className="card-meta">
                            <div className="meta-item">
                              <p className="meta-key">Frequency</p>
                              <p className="meta-val" style={{ color: 'rgba(226,226,240,0.5)' }}>{FREQ_LABEL[expense.frequency] || expense.frequency}</p>
                            </div>
                            <div className="meta-item">
                              <p className="meta-key">Paused On</p>
                              <p className="meta-val" style={{ color: 'rgba(226,226,240,0.5)' }}>
                                {expense.deactivated_at
                                  ? new Date(expense.deactivated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                  : '—'}
                              </p>
                            </div>
                          </div>
                          <button className="toggle-btn" onClick={() => toggleStatus(expense)}>
                            Reactivate
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {expenses.length === 0 && (
                <div className="empty-state">
                  no recurring expenses yet — add one above
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}