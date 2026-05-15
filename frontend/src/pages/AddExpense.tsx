import { useState } from 'react'
import Navbar from '../components/Navbar'
import { addExpense } from '../services/api'
import { useNavigate, Link } from 'react-router-dom'

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other']

const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍜',
  Transport: '🚌',
  Shopping: '🛍️',
  Bills: '🧾',
  Entertainment: '🎬',
  Other: '✦',
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Shopping: '#ec4899',
  Bills: '#ef4444',
  Entertainment: '#8b5cf6',
  Other: '#10b981',
}

function AddExpense() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    await addExpense({
      title,
      amount: Number(amount),
      category: category === 'Other' ? customCategory : category,
    })
    navigate('/expenses')
  }

  const selectedColor = CATEGORY_COLORS[category] || 'rgba(255,255,255,0.15)'

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

        .add-root {
          min-height: 100vh;
          background: #080810;
          position: relative;
          overflow-x: hidden;
        }

        .add-root::before {
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

        .add-root::after {
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

        .add-content {
          position: relative;
          z-index: 1;
          max-width: 680px;
          margin: 0 auto;
          padding: 2.5rem 2rem 4rem;
          animation: fadeUp 0.45s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Back link */
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

        /* Header */
        .add-eyebrow {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #f59e0b;
          margin-bottom: 0.3rem;
        }
        .add-title {
          font-family: 'Syne', sans-serif;
          font-size: 2.4rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          margin-bottom: 2.5rem;
        }

        /* Form card */
        .form-card {
          background: #0e0e1a;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          overflow: hidden;
        }

        .form-card-top {
          height: 3px;
          background: var(--accent, rgba(255,255,255,0.1));
          transition: background 0.4s ease;
        }

        .form-body {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
        }

        /* Field */
        .field {}
        .field-label {
          display: block;
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(232,232,240,0.4);
          margin-bottom: 0.6rem;
        }

        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 0.85rem 1rem;
          color: #e8e8f0;
          font-family: 'Inconsolata', monospace;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .field-input::placeholder { color: rgba(232,232,240,0.2); }
        .field-input:focus {
          border-color: var(--accent-color, #f59e0b);
          background: rgba(245,158,11,0.04);
          box-shadow: 0 0 0 3px rgba(245,158,11,0.08);
        }

        /* Amount field with prefix */
        .amount-wrapper {
          position: relative;
        }
        .amount-prefix {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(232,232,240,0.3);
          font-size: 1rem;
          pointer-events: none;
        }
        .amount-wrapper .field-input {
          padding-left: 1.8rem;
        }

        /* Category pills */
        .category-pills {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.6rem;
        }
        .pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          padding: 0.8rem 0.5rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Inconsolata', monospace;
          font-size: 0.8rem;
          color: rgba(232,232,240,0.5);
          transition: all 0.18s ease;
          user-select: none;
        }
        .pill:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(232,232,240,0.85);
          transform: translateY(-1px);
        }
        .pill.selected {
          color: #fff;
          transform: translateY(-1px);
        }
        .pill-icon { font-size: 1.1rem; line-height: 1; }
        .pill-label { font-size: 0.75rem; letter-spacing: 0.04em; }

        /* Custom category input */
        .custom-field {
          animation: slideDown 0.25s ease both;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Divider */
        .form-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 0.2rem 0;
        }

        /* Submit button */
        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: #f59e0b;
          color: #080810;
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          letter-spacing: 0.04em;
          transition: background 0.2s, transform 0.15s, opacity 0.2s;
          margin-top: 0.4rem;
        }
        .submit-btn:hover:not(:disabled) {
          background: #fbbf24;
          transform: translateY(-2px);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 500px) {
          .add-content { padding: 1.5rem 1rem 3rem; }
          .category-pills { grid-template-columns: repeat(2, 1fr); }
          .add-title { font-size: 1.8rem; }
        }
      `}</style>

      <div className="add-root">
        <Navbar />

        <div className="add-content">
          <Link to="/expenses" className="back-link">← Back</Link>

          <p className="add-eyebrow">New Entry</p>
          <h1 className="add-title">Add Expense</h1>

          <div className="form-card">
            <div
              className="form-card-top"
              style={{ background: selectedColor }}
            />

            <div className="form-body">
              {/* Title */}
              <div className="field">
                <label className="field-label">Title</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="e.g. Lunch at café"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{ '--accent-color': selectedColor } as any}
                />
              </div>

              {/* Amount */}
              <div className="field">
                <label className="field-label">Amount</label>
                <div className="amount-wrapper">
                  <span className="amount-prefix">$</span>
                  <input
                    className="field-input"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    min="0"
                    step="0.01"
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    style={{ '--accent-color': selectedColor } as any}
                  />
                </div>
              </div>

              <div className="form-divider" />

              {/* Category pills */}
              <div className="field">
                <label className="field-label">Category</label>
                <div className="category-pills">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat
                    const color = CATEGORY_COLORS[cat]
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={`pill${isSelected ? ' selected' : ''}`}
                        onClick={() => {
                          setCategory(cat)
                          setCustomCategory('')
                        }}
                        style={
                          isSelected
                            ? {
                                borderColor: color,
                                background: `${color}18`,
                                boxShadow: `0 0 0 1px ${color}40`,
                              }
                            : {}
                        }
                      >
                        <span className="pill-icon">{CATEGORY_ICONS[cat]}</span>
                        <span className="pill-label">{cat}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom category */}
              {category === 'Other' && (
                <div className="field custom-field">
                  <label className="field-label">Custom Category Name</label>
                  <input
                    className="field-input"
                    type="text"
                    placeholder="e.g. Medical, Gym…"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                    style={{ '--accent-color': CATEGORY_COLORS.Other } as any}
                  />
                </div>
              )}

              <div className="form-divider" />

              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !title ||
                  !amount ||
                  !category ||
                  (category === 'Other' && !customCategory)
                }
              >
                {loading ? 'Saving…' : 'Save Expense'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddExpense