import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getExpenses } from '../services/api'
import Navbar from '../components/Navbar'
import ExpenseChart from '../components/ExpenseChart'
import ExpenseList from '../components/ExpenseList'

type Expense = {
  id: number
  title: string
  amount: number
  category: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Shopping: '#ec4899',
  Bills: '#ef4444',
  Entertainment: '#8b5cf6',
  Other: '#10b981',
}

function StatCard({
  title,
  value,
  sub,
  accent,
  delay,
}: {
  title: string
  value: string
  sub?: string
  accent: string
  delay: string
}) {
  return (
    <div className="stat-card" style={{ animationDelay: delay }}>
      <div className="stat-accent-bar" style={{ background: accent }} />
      <p className="stat-title">{title}</p>
      <p className="stat-value">{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getExpenses().then((data) => {
      setExpenses(data)
      setLoading(false)
    })
  }, [])

  const totalExpenses = expenses.reduce((t, e) => t + e.amount, 0)
  const transactionCount = expenses.length
  const largestExpense = expenses.length > 0 ? Math.max(...expenses.map((e) => e.amount)) : 0

  const categoryTotals: Record<string, number> = {}
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
  })

  const topCategory =
    Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  const chartData = Object.entries(categoryTotals).map(([category, amount]) => ({
    name: category,
    value: amount,
  }))

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

        .dash-root {
          min-height: 100vh;
          background: #080810;
          position: relative;
          overflow-x: hidden;
        }

        /* Background grid */
        .dash-root::before {
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
        .dash-root::after {
          content: '';
          position: fixed;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 600px;
          background: radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .dash-content {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2.5rem 2rem 4rem;
        }

        /* HEADER */
        .dash-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 3rem;
          animation: fadeDown 0.5s ease both;
          flex-wrap: wrap;
          gap: 1rem;
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dash-title-block {}
        .dash-eyebrow {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #f59e0b;
          margin-bottom: 0.3rem;
        }
        .dash-title {
          font-family: 'Syne', sans-serif;
          font-size: 2.8rem;
          font-weight: 800;
          color: #fff;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .dash-actions {
          display: flex;
          gap: 0.75rem;
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
        }
        .btn-primary:hover { background: #fbbf24; transform: translateY(-2px); }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.4rem;
          background: transparent;
          color: #e8e8f0;
          font-family: 'Inconsolata', monospace;
          font-size: 0.9rem;
          font-weight: 500;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 6px;
          cursor: pointer;
          text-decoration: none;
          transition: border-color 0.2s, transform 0.15s, background 0.2s;
          letter-spacing: 0.04em;
        }
        .btn-outline:hover {
          border-color: rgba(255,255,255,0.4);
          background: rgba(255,255,255,0.04);
          transform: translateY(-2px);
        }

        /* STATS GRID */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .stat-card {
          position: relative;
          background: #0e0e1a;
          padding: 1.8rem 1.6rem;
          animation: fadeUp 0.5s ease both;
          transition: background 0.2s;
          overflow: hidden;
        }
        .stat-card:hover { background: #121220; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .stat-accent-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
        }

        .stat-title {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(232,232,240,0.4);
          margin-bottom: 0.8rem;
        }
        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #fff;
          line-height: 1;
          margin-bottom: 0.3rem;
        }
        .stat-sub {
          font-size: 0.75rem;
          color: rgba(232,232,240,0.35);
        }

        /* MAIN GRID */
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .panel {
          background: #0e0e1a;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1.6rem;
          animation: fadeUp 0.5s ease both;
          animation-delay: 0.2s;
        }

        .panel-label {
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(232,232,240,0.35);
          margin-bottom: 1.2rem;
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

        /* CATEGORY BREAKDOWN */
        .category-list { display: flex; flex-direction: column; gap: 0.8rem; }
        .category-row {}
        .category-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
        }
        .category-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: rgba(232,232,240,0.75);
        }
        .cat-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .category-amount {
          font-family: 'Syne', sans-serif;
          font-size: 0.9rem;
          color: #fff;
          font-weight: 600;
        }
        .category-bar-track {
          height: 3px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          overflow: hidden;
        }
        .category-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.8s cubic-bezier(.4,0,.2,1);
        }

        /* LOADING */
        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: rgba(232,232,240,0.3);
          font-size: 0.85rem;
          letter-spacing: 0.1em;
        }

        /* BOTTOM LIST PANEL */
        .list-panel {
          background: #0e0e1a;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1.6rem;
          animation: fadeUp 0.5s ease both;
          animation-delay: 0.3s;
        }

        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .main-grid { grid-template-columns: 1fr; }
          .dash-title { font-size: 2rem; }
        }
        @media (max-width: 500px) {
          .stats-grid { grid-template-columns: 1fr; }
          .dash-content { padding: 1.5rem 1rem 3rem; }
        }
      `}</style>

      <div className="dash-root">
        <Navbar />

        <div className="dash-content">
          {/* Header */}
          <div className="dash-header">
            <div className="dash-title-block">
              <p className="dash-eyebrow">Financial Overview</p>
              <h1 className="dash-title">Dashboard</h1>
            </div>
            <div className="dash-actions">
              <Link to="/add" className="btn-primary">+ Add Expense</Link>
              <Link to="/expenses" className="btn-outline">All Expenses →</Link>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <StatCard
              title="Total Spent"
              value={`$${totalExpenses.toFixed(2)}`}
              sub="all time"
              accent="#f59e0b"
              delay="0.05s"
            />
            <StatCard
              title="Transactions"
              value={transactionCount.toString()}
              sub="recorded"
              accent="#3b82f6"
              delay="0.1s"
            />
            <StatCard
              title="Largest Expense"
              value={`$${largestExpense.toFixed(2)}`}
              sub="single item"
              accent="#ec4899"
              delay="0.15s"
            />
            <StatCard
              title="Top Category"
              value={topCategory}
              sub={`${Object.keys(categoryTotals).length} total`}
              accent="#10b981"
              delay="0.2s"
            />
          </div>

          {/* Chart + Breakdown */}
          <div className="main-grid">
            <div className="panel">
              <p className="panel-label">Spending by Category</p>
              {loading ? (
                <div className="loading-state">Loading chart…</div>
              ) : (
                <ExpenseChart data={chartData} />
              )}
            </div>

            <div className="panel">
              <p className="panel-label">Breakdown</p>
              {loading ? (
                <div className="loading-state">—</div>
              ) : chartData.length === 0 ? (
                <div className="loading-state">No data yet</div>
              ) : (
                <div className="category-list">
                  {chartData
                    .sort((a, b) => b.value - a.value)
                    .map((item) => {
                      const pct = (item.value / totalExpenses) * 100
                      const color = CATEGORY_COLORS[item.name] || '#a78bfa'
                      return (
                        <div className="category-row" key={item.name}>
                          <div className="category-meta">
                            <span className="category-name">
                              <span className="cat-dot" style={{ background: color }} />
                              {item.name}
                            </span>
                            <span className="category-amount">${item.value.toFixed(2)}</span>
                          </div>
                          <div className="category-bar-track">
                            <div
                              className="category-bar-fill"
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Recent expenses */}
          <div className="list-panel">
            <p className="panel-label">Recent Expenses</p>
            <ExpenseList />
          </div>
        </div>
      </div>
    </>
  )
}