import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

import { getExpenses } from '../services/api'
import Navbar from '../components/Navbar'
import ExpenseChart from '../components/ExpenseChart'
import ExpenseList from '../components/ExpenseList'

type Expense = {
  id: number
  title: string
  amount: number
  category: string
  created_at: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Shopping: '#ec4899',
  Bills: '#ef4444',
  Entertainment: '#8b5cf6',
  Other: '#10b981',
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 16) return 'Good Afternoon'
  return 'Good Evening'
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
  const [username, setUsername] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      fetch('http://localhost:8000/validate', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.username) {
            setUsername(data.username.toUpperCase())
          }
        })
        .catch(() => {})
    }

    getExpenses().then((data) => {
      setExpenses(data)
      setLoading(false)
    })
  }, [])

  const totalExpenses = expenses.reduce((t, e) => t + e.amount, 0)
  const transactionCount = expenses.length
  const largestExpense =
    expenses.length > 0 ? Math.max(...expenses.map((e) => e.amount)) : 0

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

  const monthlyTotals: Record<string, number> = {}
  expenses.forEach((expense) => {
    const date = new Date(expense.created_at)
    const month = date.toLocaleString('default', { month: 'short' })
    monthlyTotals[month] = (monthlyTotals[month] || 0) + expense.amount
  })

  const monthlyChartData = Object.entries(monthlyTotals).map(([month, total]) => ({
    month,
    total,
  }))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inconsolata:wght@300;400;500&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

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

        .dash-root::after {
          content: '';
          position: fixed;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 600px;
          background: radial-gradient(
            ellipse,
            rgba(245,158,11,0.06) 0%,
            transparent 70%
          );
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

        .dash-greeting {
          font-family: 'Inconsolata', monospace;
          font-size: 0.95rem;
          color: rgba(232,232,240,0.45);
          margin-top: 0.5rem;
          letter-spacing: 0.04em;
        }

        .dash-greeting span {
          color: #f59e0b;
          font-weight: 600;
        }

        .dash-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-primary,
        .btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.4rem;
          border-radius: 6px;
          cursor: pointer;
          text-decoration: none;
          transition: 0.2s;
          letter-spacing: 0.04em;
        }

        .btn-primary {
          background: #f59e0b;
          color: #080810;
          font-weight: 700;
        }

        .btn-primary:hover {
          background: #fbbf24;
          transform: translateY(-2px);
        }

        .btn-outline {
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
        }

        .btn-outline:hover {
          border-color: rgba(255,255,255,0.4);
          background: rgba(255,255,255,0.04);
          transform: translateY(-2px);
        }

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
        }

        .stat-card:hover { background: #121220; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .stat-accent-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
        }

        .stat-title {
          font-size: 0.7rem;
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
          margin-bottom: 0.3rem;
        }

        .stat-sub {
          font-size: 0.75rem;
          color: rgba(232,232,240,0.35);
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .panel,
        .list-panel {
          background: #0e0e1a;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1.6rem;
          animation: fadeUp 0.5s ease both;
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

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: rgba(232,232,240,0.3);
        }

        .category-list { display: flex; flex-direction: column; gap: 0.8rem; }

        .category-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.35rem;
        }

        .category-name { display: flex; align-items: center; gap: 0.5rem; }

        .cat-dot { width: 7px; height: 7px; border-radius: 50%; }

        .category-bar-track {
          height: 3px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          overflow: hidden;
        }

        .category-bar-fill { height: 100%; border-radius: 2px; }

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
          {/* HEADER */}
          <div className="dash-header">
            <div>
              <p className="dash-eyebrow">Financial Overview</p>
              <h1 className="dash-title">Dashboard</h1>
              {username && (
                <p className="dash-greeting">
                  {getGreeting()},{' '}
                  <span>{username}</span> 
                </p>
              )}
            </div>

            <div className="dash-actions">
              <Link to="/add" className="btn-primary">
                + Add Expense
              </Link>
              <Link to="/expenses" className="btn-outline">
                All Expenses →
              </Link>
            </div>
          </div>

          {/* STATS */}
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

          {/* PIE + BREAKDOWN */}
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
              ) : (
                <div className="category-list">
                  {chartData.map((item) => {
                    const pct = (item.value / totalExpenses) * 100
                    const color = CATEGORY_COLORS[item.name] || '#a78bfa'
                    return (
                      <div className="category-row" key={item.name}>
                        <div className="category-meta">
                          <span className="category-name">
                            <span className="cat-dot" style={{ background: color }} />
                            {item.name}
                          </span>
                          <span>${item.value.toFixed(2)}</span>
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

          {/* MONTHLY BAR CHART */}
          <div className="panel" style={{ marginBottom: '2rem' }}>
            <p className="panel-label">Monthly Spending</p>
            {loading ? (
              <div className="loading-state">Loading chart…</div>
            ) : (
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis dataKey="month" stroke="rgba(232,232,240,0.5)" />
                    <YAxis stroke="rgba(232,232,240,0.5)" />
                    <Tooltip />
                    <Bar dataKey="total" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* RECENT EXPENSES */}
          <div className="list-panel">
            <p className="panel-label">Recent Expenses</p>
            <ExpenseList />
          </div>
        </div>
      </div>
    </>
  )
}