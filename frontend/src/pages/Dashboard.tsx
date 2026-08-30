import { useEffect, useMemo, useRef, useState } from 'react'
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

import { getExpenses, getAiInsights, getWeeklyDigest, getCachedWeeklyDigest, API_URL } from '../services/api'
import type { AiInsights, Digest } from '../services/api'
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

function getCurrentMonthLabel(): string {
  const month = new Date().toLocaleString('default', {
    month: 'long',
  })
  return `MONTH - ${month.toUpperCase()}`
}

// Animates a number up from 0 to `target` with an eased ramp — used to give
// the stat cards a "ticking meter" feel on load instead of popping in static.
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  ).current

  useEffect(() => {
    if (prefersReducedMotion || !isFinite(target)) {
      setValue(target)
      return
    }
    let start: number | null = null
    let raf: number
    const step = (ts: number) => {
      if (start === null) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return value
}

// Small inline sparkline — no chart library needed for a 7-point trend line.
function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null
  const max = Math.max(...points, 1)
  const min = Math.min(...points, 0)
  const range = max - min || 1
  const step = 100 / (points.length - 1)
  const coords = points.map((p, i) => {
    const x = i * step
    const y = 24 - ((p - min) / range) * 22
    return `${x},${y}`
  })
  const path = coords.join(' ')
  const lastX = (points.length - 1) * step
  const lastY = 24 - ((points[points.length - 1] - min) / range) * 22

  return (
    <svg viewBox="0 0 100 24" className="sparkline" preserveAspectRatio="none">
      <polyline points={path} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="1.8" fill={color} />
    </svg>
  )
}

function StatCard({
  title,
  value,
  countTo,
  formatValue,
  sub,
  accent,
  delay,
  trend,
}: {
  title: string
  value: string
  countTo?: number
  formatValue?: (n: number) => string
  sub?: string
  accent: string
  delay: string
  trend?: number[]
}) {
  const animated = useCountUp(countTo ?? 0)
  const displayValue = countTo !== undefined && formatValue ? formatValue(animated) : value

  return (
    <div className="stat-card" style={{ animationDelay: delay }}>
      <div className="stat-accent-bar" style={{ background: accent }} />
      <p className="stat-title">{title}</p>
      <div className="stat-value-row">
        <p className="stat-value">{displayValue}</p>
        {trend && trend.length > 1 && <Sparkline points={trend} color={accent} />}
      </div>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  )
}

// Shimmering placeholder used while a panel's data is still loading — reads
// as "the terminal is fetching" rather than a dead, static string.
function ShimmerBlock({ height = 200 }: { height?: number }) {
  return <div className="shimmer-block" style={{ height }} />
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState<string>('')
  const [budgetAlerts, setBudgetAlerts] = useState<any[]>([])
  const [aiInsights, setAiInsights] = useState<AiInsights | null>(null)
  const [aiLoading, setAiLoading] = useState(true)
  const cachedDigest = getCachedWeeklyDigest()
  const [digest, setDigest] = useState<Digest | null>(cachedDigest?.digest ?? null)
  const [digestLoading, setDigestLoading] = useState(!cachedDigest)
  const [digestDate, setDigestDate] = useState<string>(
    cachedDigest?.created_at
      ? new Date(cachedDigest.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '',
  )

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      fetch(`${API_URL}/validate`, {
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

    getExpenses()
      .then((data) => setExpenses(data))
      .catch((err) => {
        console.warn('Failed to load expenses:', err)
        setExpenses([])
      })
      .finally(() => setLoading(false))

    getAiInsights()
      .then((data) => setAiInsights(data.insights ?? null))
      .catch((err) => {
        console.warn('Failed to load AI insights:', err)
        setAiInsights(null)
      })
      .finally(() => setAiLoading(false))

    getWeeklyDigest()
      .then((data) => {
        setDigest(data.digest ?? null)
        if (data.created_at) {
          setDigestDate(
            new Date(data.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          )
        }
      })
      .catch((err) => {
        console.warn('Failed to load weekly digest:', err)
        setDigest(null)
      })
      .finally(() => setDigestLoading(false))

    if (token) {
      fetch(`${API_URL}/budgets/progress`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          const alerts = data.filter((budget: any) => budget.percentage >= 70)

          setBudgetAlerts(alerts)
        })
        .catch(() => {})
    }
  }, [])

  const today = new Date()
  const currentMonthLabel = getCurrentMonthLabel()

  const currentMonthExpenses = expenses.filter((expense) => {
    const date = new Date(expense.created_at)
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth()
    )
  })

  let totalExpenses = currentMonthExpenses.reduce((t, e) => t + e.amount, 0)
  let transactionCount = currentMonthExpenses.length

  const categoryTotals: Record<string, number> = {}
  currentMonthExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
  })

  let largestExpense = expenses.length > 0 ? Math.max(...expenses.map((e) => e.amount)) : 0

  const topCategory =
    Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  const chartData = Object.entries(categoryTotals).map(([category, amount]) => ({
    name: category,
    value: amount,
  }))

  const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]

  const monthlyTotals: Record<string, number> = {}
  expenses.forEach((expense) => {
    const date = new Date(expense.created_at)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    monthlyTotals[key] = (monthlyTotals[key] || 0) + expense.amount
  })

  // Build chronological bars from January up to the current month, filling
  // any months that have no expenses with 0 so the chart stays in order.
  const monthlyChartData: { month: string; total: number }[] = []
  for (let m = 0; m <= today.getMonth(); m++) {
    const key = `${today.getFullYear()}-${m}`
    monthlyChartData.push({
      month: MONTH_NAMES[m],
      total: monthlyTotals[key] || 0,
    })
  }

  // Cumulative running total across the current month — feeds the sparkline
  // in the "Spent this month" card so the number doesn't sit there inert.
  const cumulativeTrend = useMemo(() => {
    const dayTotals: Record<number, number> = {}
    currentMonthExpenses.forEach((e) => {
      const day = new Date(e.created_at).getDate()
      dayTotals[day] = (dayTotals[day] || 0) + e.amount
    })
    let running = 0
    const points: number[] = []
    for (let d = 1; d <= today.getDate(); d++) {
      running += dayTotals[d] || 0
      points.push(running)
    }
    return points.length > 1 ? points : [0, running]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses])

  // Ticker tape content: category totals this month, looped for a seamless
  // marquee. Falls back to a status line when there's nothing to report yet.
  const tickerItems = chartData.length > 0
    ? chartData.map((c) => `${c.name.toUpperCase()} · Rs ${c.value.toFixed(2)}`)
    : ['NO TRANSACTIONS LOGGED THIS MONTH']

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

        /* Signature element: a slow amber scanline sweeping the page, giving
           the whole dashboard a "live terminal" pulse without being loud. */
        .scanline {
          position: fixed;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(245,158,11,0.035),
            transparent
          );
          pointer-events: none;
          z-index: 0;
          animation: sweep 7s linear infinite;
        }

        @keyframes sweep {
          0% { top: -120px; }
          100% { top: 100vh; }
        }

        @media (prefers-reduced-motion: reduce) {
          .scanline { animation: none; display: none; }
          .stat-card, .dash-header, .panel, .list-panel { animation: none !important; }
          .ticker-track { animation: none !important; }
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
          margin-bottom: 1.5rem;
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
          align-items: center;
        }

        .dash-month-label {
          display: inline-flex;
          align-items: center;
          padding: 0.65rem 1rem;
          border-radius: 999px;
          background: rgba(245,158,11,0.12);
          color: #f59e0b;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          white-space: nowrap;
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

        .btn-primary:focus-visible,
        .btn-outline:focus-visible {
          outline: 2px solid #f59e0b;
          outline-offset: 2px;
        }

        /* Ticker tape — a trading-terminal touch that fits a finance app:
           this month's categories scroll past like a live feed. */
        .ticker {
          position: relative;
          overflow: hidden;
          background: #0e0e1a;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 0.7rem 0;
          margin-bottom: 2rem;
          animation: fadeDown 0.5s ease both;
          animation-delay: 0.05s;
        }

        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-scroll 22s linear infinite;
        }

        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .ticker-item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0 1.8rem;
          font-size: 0.78rem;
          letter-spacing: 0.08em;
          color: rgba(232,232,240,0.6);
          white-space: nowrap;
          border-right: 1px solid rgba(255,255,255,0.06);
        }

        .ticker-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #f59e0b;
          box-shadow: 0 0 6px rgba(245,158,11,0.8);
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
          transition: background 0.2s, transform 0.2s;
        }

        .stat-card:hover {
          background: #121220;
          transform: translateY(-3px);
        }

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

        .stat-value-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.3rem;
          font-variant-numeric: tabular-nums;
        }

        .sparkline {
          width: 60px;
          height: 24px;
          flex-shrink: 0;
          opacity: 0.85;
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

        .shimmer-block {
          border-radius: 8px;
          background: linear-gradient(
            100deg,
            rgba(255,255,255,0.02) 30%,
            rgba(255,255,255,0.06) 50%,
            rgba(255,255,255,0.02) 70%
          );
          background-size: 200% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
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

        .category-bar-fill {
          height: 100%;
          border-radius: 2px;
          animation: growBar 0.8s ease both;
        }

        @keyframes growBar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
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
        <div className="scanline" aria-hidden="true" />
        <Navbar />

        <div className="dash-content">
          {/* HEADER */}
          <div className="dash-header">
            <div>
              <p className="dash-eyebrow">Financial Overview</p>
              <h1 className="dash-title">Dashboard</h1>
              {username && (
                <p className="dash-greeting">
                  {getGreeting()}, <span>{username}</span>
                </p>
              )}
            </div>

            <div className="dash-actions">
              <span className="dash-month-label">{currentMonthLabel}</span>
              <Link to="/add" className="btn-primary">
                + Add Expense
              </Link>
              <Link to="/expenses" className="btn-outline">
                All Expenses →
              </Link>
            </div>
          </div>

          {/* TICKER TAPE */}
          <div className="ticker" role="status" aria-label="This month's category totals">
            <div className="ticker-track">
              {[...tickerItems, ...tickerItems].map((item, i) => (
                <span className="ticker-item" key={i}>
                  <span className="ticker-dot" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* STATS */}
          <div className="stats-grid">
            <StatCard
              title="Spent this month"
              value={`Rs ${totalExpenses.toFixed(2)}`}
              countTo={totalExpenses}
              formatValue={(n) => `Rs ${n.toFixed(2)}`}
              sub={currentMonthLabel.replace('MONTH - ', '')}
              accent="#f59e0b"
              delay="0.05s"
              trend={cumulativeTrend}
            />
            <StatCard
              title="Transactions this month"
              value={transactionCount.toString()}
              countTo={transactionCount}
              formatValue={(n) => Math.round(n).toString()}
              sub={currentMonthLabel.replace('MONTH - ', '')}
              accent="#3b82f6"
              delay="0.1s"
            />
            <StatCard
              title="Largest Expense"
              value={`Rs ${largestExpense.toFixed(2)}`}
              countTo={largestExpense}
              formatValue={(n) => `Rs ${n.toFixed(2)}`}
              sub="current month"
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

          {/* BUDGET ALERTS */}
          {budgetAlerts.length > 0 && (
            <div
              className="panel"
              style={{
                marginBottom: '2rem',
                border: '1px solid rgba(245,158,11,0.2)',
              }}
            >
              <p className="panel-label">Budget Alerts</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {budgetAlerts.map((budget, index) => {
                  const isExceeded = budget.percentage >= 100

                  return (
                    <div
                      key={index}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '10px',
                        padding: '1rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.6rem',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: '#fff' }}>{budget.category}</span>

                        <span
                          style={{
                            color: isExceeded ? '#ef4444' : '#f59e0b',
                            fontWeight: 700,
                          }}
                        >
                          {budget.percentage}%
                        </span>
                      </div>

                      <div style={{ color: 'rgba(232,232,240,0.72)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                        {isExceeded ? (
                          <>
                            ⚠ You exceeded your {budget.category} budget by Rs
                            {Math.abs(budget.remaining).toFixed(2)}
                          </>
                        ) : (
                          <>
                            ⚠ You already used {budget.percentage}% of your {budget.category} budget
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* PIE + BREAKDOWN */}
          <div className="main-grid">
            <div className="panel">
              <p className="panel-label">Spending by Category</p>
              {loading ? <ShimmerBlock height={220} /> : <ExpenseChart data={chartData} />}
            </div>

            <div className="panel">
              <p className="panel-label">Breakdown</p>
              {loading ? (
                <ShimmerBlock height={180} />
              ) : (
                <div className="category-list">
                  {chartData.map((item, i) => {
                    const pct = (item.value / totalExpenses) * 100
                    const color = CATEGORY_COLORS[item.name] || '#a78bfa'
                    return (
                      <div className="category-row" key={item.name}>
                        <div className="category-meta">
                          <span className="category-name">
                            <span className="cat-dot" style={{ background: color }} />
                            {item.name}
                          </span>
                          <span>Rs {item.value.toFixed(2)}</span>
                        </div>
                        <div className="category-bar-track">
                          <div
                            className="category-bar-fill"
                            style={{
                              width: `${pct}%`,
                              background: color,
                              transformOrigin: 'left',
                              animationDelay: `${i * 0.08}s`,
                            }}
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
              <ShimmerBlock height={320} />
            ) : (
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={monthlyChartData}>
                    <defs>
                      <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.55} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="rgba(232,232,240,0.5)" />
                    <YAxis stroke="rgba(232,232,240,0.5)" />
                    <Tooltip
                      contentStyle={{
                        background: '#0e0e1a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        color: '#e8e8f0',
                      }}
                    />
                    <Bar dataKey="total" fill="url(#barFill)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* AI INSIGHTS */}
          <div className="panel" style={{ marginBottom: '2rem' }}>
            <p className="panel-label">AI Financial Insights</p>

            {aiLoading ? (
              <ShimmerBlock height={140} />
            ) : aiInsights && aiInsights.error && !aiInsights.advice ? (
              <div style={{ lineHeight: '1.7', fontSize: '0.9rem', color: 'rgba(248,113,113,0.9)' }}>
                {aiInsights.error}
              </div>
            ) : aiInsights ? (
              <div style={{ lineHeight: '1.9', fontSize: '0.95rem' }}>
                {aiInsights.trends && (
                  <div style={{ marginBottom: '1.1rem' }}>
                    <p
                      style={{
                        color: '#a78bfa',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Trends
                    </p>
                    <p style={{ color: 'rgba(232,232,240,0.82)' }}>{aiInsights.trends}</p>
                  </div>
                )}

                {aiInsights.topCategories && aiInsights.topCategories.length > 0 && (
                  <div style={{ marginBottom: '1.1rem' }}>
                    <p
                      style={{
                        color: '#a78bfa',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Top Categories
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {aiInsights.topCategories.map((cat) => (
                        <span
                          key={cat}
                          style={{
                            background: 'rgba(167,139,250,0.12)',
                            border: '1px solid rgba(167,139,250,0.25)',
                            color: '#c4b5fd',
                            padding: '0.25rem 0.7rem',
                            borderRadius: '999px',
                            fontSize: '0.8rem',
                          }}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {aiInsights.anomalies && (
                  <div style={{ marginBottom: '1.1rem' }}>
                    <p
                      style={{
                        color: '#a78bfa',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Notable Spending
                    </p>
                    <p style={{ color: 'rgba(232,232,240,0.82)' }}>{aiInsights.anomalies}</p>
                  </div>
                )}

                {aiInsights.advice && (
                  <div>
                    <p
                      style={{
                        color: '#34d399',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Saving Advice
                    </p>
                    <p style={{ color: 'rgba(232,232,240,0.82)' }}>{aiInsights.advice}</p>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: 'rgba(232,232,240,0.6)' }}>Unable to load AI insights.</p>
            )}
          </div>

          {/* AI WEEKLY DIGEST */}
          <div className="panel" style={{ marginBottom: '2rem' }}>
            <p className="panel-label">
              AI Weekly Digest{digestDate ? ` · Updated ${digestDate}` : ''}
            </p>

            {digestLoading ? (
              <ShimmerBlock height={140} />
            ) : digest && digest.error && !digest.advice ? (
              <div style={{ lineHeight: '1.7', fontSize: '0.9rem', color: 'rgba(248,113,113,0.9)' }}>
                {digest.error}
              </div>
            ) : digest ? (
              <div style={{ lineHeight: '1.9', fontSize: '0.95rem' }}>
                {digest.title && (
                  <p
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      marginBottom: '0.9rem',
                    }}
                  >
                    {digest.title}
                  </p>
                )}

                {digest.trends && (
                  <div style={{ marginBottom: '1.1rem' }}>
                    <p
                      style={{
                        color: '#a78bfa',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        marginBottom: '0.35rem',
                      }}
                    >
                      This Week
                    </p>
                    <p style={{ color: 'rgba(232,232,240,0.82)' }}>{digest.trends}</p>
                  </div>
                )}

                {digest.topCategories && digest.topCategories.length > 0 && (
                  <div style={{ marginBottom: '1.1rem' }}>
                    <p
                      style={{
                        color: '#a78bfa',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Top Categories
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {digest.topCategories.map((cat) => (
                        <span
                          key={cat}
                          style={{
                            background: 'rgba(167,139,250,0.12)',
                            border: '1px solid rgba(167,139,250,0.25)',
                            color: '#c4b5fd',
                            padding: '0.25rem 0.7rem',
                            borderRadius: '999px',
                            fontSize: '0.8rem',
                          }}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {digest.advice && (
                  <div>
                    <p
                      style={{
                        color: '#34d399',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Next Week
                    </p>
                    <p style={{ color: 'rgba(232,232,240,0.82)' }}>{digest.advice}</p>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: 'rgba(232,232,240,0.6)' }}>Unable to load the weekly digest.</p>
            )}
          </div>

          {/* RECENT EXPENSES */}
          <div className="list-panel">
            <p className="panel-label">Recent Expenses</p>
            <ExpenseList months={1} limit={5} />
          </div>
        </div>
      </div>
    </>
  )
}