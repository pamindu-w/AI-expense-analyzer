// import type { Expense } from "../App";
// import ExpenseItem from "./ExpenseItem";

// type ExpenseListProps = {
//   expenses: Expense[];
//   loading: boolean;
//   onRefresh: () => Promise<void>;
//   onDeleteExpense: (id: number) => Promise<void>;
// };

// function ExpenseList({
//   expenses,
//   loading,
//   onRefresh,
//   onDeleteExpense,
// }: ExpenseListProps) {
//   return (
//     <section className="expense-list">
//       <div className="expense-header">
//         <h2>Expenses</h2>

//         <button type="button" onClick={onRefresh}>
//           Refresh
//         </button>
//       </div>

//       {loading ? (
//         <p>Loading expenses...</p>
//       ) : expenses.length === 0 ? (
//         <p>No expenses found yet.</p>
//       ) : (
//         <ul>
//           {expenses.map((expense) => (
//             <ExpenseItem
//               key={expense.id}
//               expense={expense}
//               onDeleteExpense={onDeleteExpense}
//             />
//           ))}
//         </ul>
//       )}
//     </section>
//   );
// }

// export default ExpenseList;

import { useEffect, useState } from 'react'
import {
  getExpenses,
  deleteExpense,
  updateExpense,
} from '../services/api'

type Expense = {
  id: number
  title: string
  amount: number
  category: string
}

function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])

  const [editingId, setEditingId] = useState<number | null>(null)

  const [editForm, setEditForm] = useState({
    title: '',
    amount: '',
    category: '',
  })

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    const data = await getExpenses()
    setExpenses(data)
  }

  // DELETE
  const handleDelete = async (id: number) => {
    await deleteExpense(id)

    setExpenses(expenses.filter((expense) => expense.id !== id))
  }

  // START EDIT
  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id)

    setEditForm({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
    })
  }

  // SAVE UPDATE
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
    <div className="expense-table-container">
      <h2>Recent Expenses</h2>

      <table className="expense-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Amount</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              {editingId === expense.id ? (
                <>
                  <td>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          title: e.target.value,
                        })
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      value={editForm.amount}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          amount: e.target.value,
                        })
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          category: e.target.value,
                        })
                      }
                    />
                  </td>

                  <td className="action-buttons">
                    <button
                      className="save-btn"
                      onClick={() => handleUpdate(expense.id)}
                    >
                      Save
                    </button>

                    <button
                      className="cancel-btn"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td>{expense.title}</td>
                  <td>${expense.amount}</td>
                  <td>{expense.category}</td>

                  <td className="action-buttons">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(expense)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(expense.id)}
                    >
                      Delete
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ExpenseList