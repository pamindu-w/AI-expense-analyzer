import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import ExpenseList from '../components/ExpenseList'
import { Link } from 'react-router-dom'
import { getExpenses, downloadExpensesCsv, downloadExpensesPdf } from '../services/api'

type Expense = {
  id: number
  title: string
  amount: number
  category: string
  created_at: string
}

type MonthSummary = {
  key: string
  label: string
  total: number
  count: number
  categories: { name: string; total: number }[]
}

function buildMonthlySummaries(expenses: Expense[]): MonthSummary[] {
  const groups: Record<string, MonthSummary> = {}
  expenses.forEach((e) => {
    const date = new Date(e.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!groups[key]) {
      groups[key] = { key, label, total: 0, count: 0, categories: [] }
    }
    groups[key].total += e.amount
    groups[key].count += 1
    const cat = groups[key].categories.find((c) => c.name === e.category)
    if (cat) cat.total += e.amount
    else groups[key].categories.push({ name: e.category, total: e.amount })
  })
  return Object.values(groups).sort((a, b) =>
    new Date(b.label + ' 1').getTime() - new Date(a.label + ' 1').getTime(),
  )
}

function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [exportedKey, setExportedKey] = useState<string | null>(null)
  const [pdfExportingKey, setPdfExportingKey] = useState<string | null>(null)

  useEffect(() => {
    getExpenses()
      .then((data) => setExpenses(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.warn('Failed to load expenses:', err)
        setExpenses([])
      })
  }, [])

  const summaries = buildMonthlySummaries(expenses)

  // Expenses belonging to a given "YYYY-MM" key.
  function expensesForMonth(key: string): Expense[] {
    return expenses.filter((e) => {
      const d = new Date(e.created_at)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return k === key
    })
  }

  async function handleExportCsv(key: string) {
    downloadExpensesCsv(
      expensesForMonth(key).map((e) => ({ ...e, amount: Number(e.amount) })),
      `expenses-${key}.csv`,
    )
    setExportedKey(key)
    setTimeout(() => setExportedKey(null), 3000)
  }

  async function handleExportPdf(key: string) {
    setPdfExportingKey(key)
    try {
      await downloadExpensesPdf(
        expensesForMonth(key).map((e) => ({ ...e, amount: Number(e.amount) })),
        `expenses-${key}.pdf`,
      )
    } catch (err) {
      console.warn('Failed to export PDF:', err)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setPdfExportingKey(null)
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

        .exp-header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .btn-primary,
        .btn-export {
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

        .btn-export {
          background: transparent;
          color: #e8e8f0;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .btn-export:hover {
          border-color: rgba(245,158,11,0.5);
          color: #fbbf24;
          transform: translateY(-2px);
        }
        .btn-export:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .btn-export-pdf:hover {
          border-color: rgba(239,68,68,0.5);
          color: #f87171;
        }

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

        /* Monthly report */
        .report-section { margin-bottom: 2rem; }
        .report-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem;
        }
        .report-card {
          background: #0e0e1a;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1.3rem 1.4rem;
        }
        .report-month {
          font-family: 'Syne', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.4rem;
        }
        .report-total {
          font-family: 'Syne', sans-serif;
          font-size: 1.3rem;
          font-weight: 800;
          color: #fbbf24;
          margin-bottom: 0.2rem;
        }
        .report-count {
          font-size: 0.7rem;
          color: rgba(232,232,240,0.4);
          margin-bottom: 0.8rem;
        }
        .report-cats {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .report-cat {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: rgba(232,232,240,0.6);
        }
        .report-cat span:last-child { color: #e8e8f0; }

        .report-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .report-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.5rem 0.75rem;
          background: transparent;
          color: #e8e8f0;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 6px;
          font-family: 'Inconsolata', monospace;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          cursor: pointer;
          text-transform: uppercase;
          transition: color 0.2s, border-color 0.2s, transform 0.15s;
          white-space: nowrap;
        }
        .report-btn:hover:not(:disabled) {
          border-color: rgba(245,158,11,0.5);
          color: #fbbf24;
          transform: translateY(-1px);
        }
        .report-btn-pdf:hover:not(:disabled) {
          border-color: rgba(239,68,68,0.5);
          color: #f87171;
        }
        .report-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        @media (max-width: 500px) {
          .exp-content { padding: 1.5rem 1rem 3rem; }
          .exp-title { font-size: 1.8rem; }
        }
      `}</style>

      <div className="exp-root">
        <Navbar />

        <div className="exp-content">
          <Link to="/dashboard" className="back-link">← Dashboard</Link>

          <div className="exp-header">
            <div>
              <p className="exp-eyebrow">History</p>
              <h1 className="exp-title">All Expenses</h1>
            </div>
            <div className="exp-header-actions">
              <Link to="/add" className="btn-primary">+ Add Expense</Link>
            </div>
          </div>

          {expenses.length > 0 && summaries.length > 0 && (
            <div className="report-section">
              <p className="panel-label">Monthly Report</p>
              <div className="report-grid">
                {summaries.map((s) => (
                  <div className="report-card" key={s.key}>
                    <div className="report-month">{s.label}</div>
                    <div className="report-total">Rs {s.total.toFixed(2)}</div>
                    <div className="report-count">{s.count} transactions</div>
                    <div className="report-cats">
                      {s.categories
                        .sort((a, b) => b.total - a.total)
                        .slice(0, 4)
                        .map((c) => (
                          <div className="report-cat" key={c.name}>
                            <span>{c.name}</span>
                            <span>Rs {c.total.toFixed(2)}</span>
                          </div>
                        ))}
                    </div>
                    <div className="report-actions">
                      <button
                        className="report-btn"
                        onClick={() => handleExportCsv(s.key)}
                        disabled={exportedKey === s.key}
                      >
                        {exportedKey === s.key ? '✓ Exported' : 'CSV'}
                      </button>
                      <button
                        className="report-btn report-btn-pdf"
                        onClick={() => handleExportPdf(s.key)}
                        disabled={pdfExportingKey === s.key}
                      >
                        {pdfExportingKey === s.key ? '⏳…' : 'PDF'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="exp-panel">
            <div className="exp-panel-top" />
            <div className="exp-panel-body">
              <p className="panel-label">Records — This Month & Previous Month</p>
              <ExpenseList months={2} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Expenses