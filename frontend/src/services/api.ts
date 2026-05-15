const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export const getExpenses = async () => {
  const res = await fetch(`${API_URL}/expenses/`)
  if (!res.ok) throw new Error('Failed to fetch expenses')
  return res.json()
}

export const addExpense = async (expense: {
  title: string
  amount: number
  category: string
}) => {
  const res = await fetch(`${API_URL}/expenses/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  })
  if (!res.ok) throw new Error('Failed to add expense')
  return res.json()
}

export const updateExpense = async (
  id: number,
  expense: { title: string; amount: number; category: string },
) => {
  const res = await fetch(`${API_URL}/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  })
  if (!res.ok) throw new Error('Failed to update expense')
  return res.json()
}

export const deleteExpense = async (id: number) => {
  const res = await fetch(`${API_URL}/expenses/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete expense')
  return res.json()
}