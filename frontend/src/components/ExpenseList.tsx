import { useEffect, useState } from 'react'
import { getExpenses, deleteExpense, updateExpense } from '../services/api'

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

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other']

function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ title: '', amount: '', category: '' })
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => { loadExpenses() }, [])

  const loadExpenses = async () => {
    const data = await getExpenses()
    setExpenses(data)
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    await deleteExpense(id)
    setExpenses(expenses.filter((e) => e.id !== id))
    setDeletingId(null)
  }

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id)
    setEditForm({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
    })
  }

  const handleUpdate = async (id: number) => {
    await updateExpense(id, {
      title: editForm.title,
      amount: Number(editForm.amount),
      category: editForm.category,
    })
    setEditingId(null)
    loadExpenses()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=Inconsolata:wght@400;500&display=swap');

        .el-wrap { width: 100%; font-family: 'Inconsolata', monospace; }

        /* Empty state */
        .el-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          color: rgba(232,232,240,0.2);
          gap: 0.6rem;
          font-size: 0.85rem;
          letter-spacing: 0.08em;
        }
        .el-empty-icon { font-size: 2rem; }

        /* Table */
        .el-table { width: 100%; border-collapse: collapse; }

        .el-table thead tr {
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .el-table th {
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(232,232,240,0.3);
          padding: 0 0.8rem 0.9rem;
          text-align: left;
        }
        .el-table th:last-child { text-align: right; }

        .el-table tbody tr {
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .el-table tbody tr:last-child { border-bottom: none; }
        .el-table tbody tr:hover { background: rgba(255,255,255,0.02); }

        .el-table td {
          padding: 0.9rem 0.8rem;
          font-size: 0.9rem;
          color: rgba(232,232,240,0.75);
          vertical-align: middle;
        }

        /* Title cell */
        .el-title {
          color: #e8e8f0;
          font-weight: 500;
        }

        /* Amount cell */
        .el-amount {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          color: #fff;
        }

        /* Category badge */
        .el-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem 0.6rem;
          border-radius: 4px;
          font-size: 0.78rem;
          font-weight: 500;
        }
        .el-badge-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Actions */
        .el-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .el-btn {
          padding: 0.3rem 0.75rem;
          font-family: 'Inconsolata', monospace;
          font-size: 0.78rem;
          font-weight: 500;
          border-radius: 5px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.04em;
        }
        .el-btn-edit {
          background: rgba(59,130,246,0.1);
          border-color: rgba(59,130,246,0.25);
          color: #93c5fd;
        }
        .el-btn-edit:hover {
          background: rgba(59,130,246,0.18);
          border-color: rgba(59,130,246,0.5);
        }
        .el-btn-delete {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.2);
          color: #fca5a5;
        }
        .el-btn-delete:hover {
          background: rgba(239,68,68,0.16);
          border-color: rgba(239,68,68,0.45);
        }
        .el-btn-delete:disabled { opacity: 0.4; cursor: not-allowed; }
        .el-btn-save {
          background: rgba(245,158,11,0.1);
          border-color: rgba(245,158,11,0.3);
          color: #fcd34d;
        }
        .el-btn-save:hover {
          background: rgba(245,158,11,0.2);
          border-color: rgba(245,158,11,0.5);
        }
        .el-btn-cancel {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.1);
          color: rgba(232,232,240,0.5);
        }
        .el-btn-cancel:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(232,232,240,0.8);
        }

        /* Inline edit inputs */
        .el-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          padding: 0.4rem 0.6rem;
          color: #e8e8f0;
          font-family: 'Inconsolata', monospace;
          font-size: 0.88rem;
          outline: none;
          transition: border-color 0.2s;
          min-width: 80px;
        }
        .el-input:focus { border-color: #f59e0b; }

        .el-select {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          padding: 0.4rem 0.6rem;
          color: #e8e8f0;
          font-family: 'Inconsolata', monospace;
          font-size: 0.88rem;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .el-select:focus { border-color: #f59e0b; }
        .el-select option { background: #0e0e1a; }

        @media (max-width: 600px) {
          .el-table th:nth-child(3),
          .el-table td:nth-child(3) { display: none; }
        }
      `}</style>

      <div className="el-wrap">
        {expenses.length === 0 ? (
          <div className="el-empty">
            <span className="el-empty-icon">◎</span>
            <span>No expenses recorded yet</span>
          </div>
        ) : (
          <table className="el-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => {
                const color = CATEGORY_COLORS[expense.category] || '#a78bfa'
                const isEditing = editingId === expense.id

                return (
                  <tr key={expense.id}>
                    {isEditing ? (
                      <>
                        <td>
                          <input
                            className="el-input"
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="el-input"
                            type="number"
                            value={editForm.amount}
                            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                          />
                        </td>
                        <td>
                          <select
                            className="el-select"
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="el-actions">
                            <button className="el-btn el-btn-save" onClick={() => handleUpdate(expense.id)}>Save</button>
                            <button className="el-btn el-btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="el-title">{expense.title}</td>
                        <td className="el-amount">${expense.amount.toFixed(2)}</td>
                        <td>
                          <span
                            className="el-badge"
                            style={{
                              background: `${color}15`,
                              border: `1px solid ${color}30`,
                              color,
                            }}
                          >
                            <span className="el-badge-dot" style={{ background: color }} />
                            {expense.category}
                          </span>
                        </td>
                        <td>
                          <div className="el-actions">
                            <button className="el-btn el-btn-edit" onClick={() => handleEdit(expense)}>Edit</button>
                            <button
                              className="el-btn el-btn-delete"
                              onClick={() => handleDelete(expense.id)}
                              disabled={deletingId === expense.id}
                            >
                              {deletingId === expense.id ? '…' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

export default ExpenseList