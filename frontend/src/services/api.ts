export const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

// Helper function to get the authorization header
const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('access_token')
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export const getExpenses = async () => {
  const response = await fetch(`${API_URL}/expenses`, {
    headers: getAuthHeader(),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch expenses: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}

export const addExpense = async (expense: any) => {
  const response = await fetch(`${API_URL}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(expense),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to add expense: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}

export const deleteExpense = async (id: number) => {
  const response = await fetch(`${API_URL}/expenses/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to delete expense: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}

export const updateExpense = async (id: number, updatedExpense: any) => {
  const response = await fetch(`${API_URL}/expenses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(updatedExpense),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to update expense: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}

export const getBudgets = async () => {
  const response = await fetch(`${API_URL}/budgets`, {
    headers: getAuthHeader(),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch budgets: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}

export const getBudgetProgress = async () => {
  const response = await fetch(`${API_URL}/budgets/progress`, {
    headers: getAuthHeader(),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch budget progress: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}

export const createBudget = async (budget: any) => {
  const response = await fetch(`${API_URL}/budgets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(budget),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to create budget: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}

export const getRecurringExpenses = async () => {
  const response = await fetch(`${API_URL}/recurring-expenses`, {
    headers: getAuthHeader(),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch recurring expenses: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}

export const updateRecurringExpenseStatus = async (
  id: number,
  active: boolean,
) => {
  const response = await fetch(`${API_URL}/recurring-expenses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ active }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to update recurring expense: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}

export const deleteRecurringExpense = async (id: number) => {
  const response = await fetch(`${API_URL}/recurring-expenses/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to delete recurring expense: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}

export const getAllRecurringExpenses = async () => {
  const response = await fetch(`${API_URL}/recurring-expenses/all`, {
    headers: getAuthHeader(),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch all recurring expenses: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}

export const updateBudget = async (id: number, limit: number) => {
  const response = await fetch(`${API_URL}/budgets/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ limit }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to update budget: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}