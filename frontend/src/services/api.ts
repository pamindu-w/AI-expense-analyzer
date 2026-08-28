export const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export const isAuthenticated = (): boolean =>
  !!localStorage.getItem('access_token')

export const logout = (): void => {
  localStorage.removeItem('access_token')
}

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

export type AiInsights = {
  trends: string
  topCategories: string[]
  anomalies: string
  advice: string
  error?: string
}

export const getAiInsights = async (): Promise<{ insights: AiInsights }> => {
  const response = await fetch(`${API_URL}/expenses/ai-insights`, {
    headers: getAuthHeader(),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch AI insights: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}

export type PdfParseResult = { amount: number; title: string }

export const parseExpensePdf = async (file: File): Promise<PdfParseResult> => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(`${API_URL}/parse-pdf`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData,
  })
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`
    try {
      const data = await response.json()
      if (data?.detail) detail = data.detail
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(detail)
  }
  return response.json()
}

export type CsvExpense = {
  id: number
  title: string
  amount: number
  category: string
  created_at: string
}

// Build a styled PDF table of expenses and trigger a browser download.
export async function downloadExpensesPdf(
  expenses: CsvExpense[],
  filename = 'expenses.pdf',
) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(245, 158, 11)
  doc.setFontSize(20)
  doc.text('SpendWise — Expense Report', 40, 44)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 130)
  doc.text(
    `Generated ${new Date().toLocaleString()}  ·  ${expenses.length} records`,
    40,
    62,
  )

  const rows = expenses.map((e) => [
    new Date(e.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    e.title,
    e.category,
    `Rs ${Number(e.amount).toFixed(2)}`,
  ])

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)

  autoTable(doc, {
    startY: 78,
    head: [['Date', 'Title', 'Category', 'Amount']],
    body: rows,
    foot: [['', '', 'Total', `Rs ${total.toFixed(2)}`]],
    theme: 'striped',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 6 },
    headStyles: {
      fillColor: [245, 158, 11],
      textColor: [8, 8, 16],
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [14, 14, 26],
      textColor: [245, 197, 24],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [246, 247, 249] },
    columnStyles: {
      0: { cellWidth: 90 },
      2: { cellWidth: 110 },
      3: { cellWidth: 120, halign: 'right' },
    },
  })

  doc.save(filename)
}



// Build a CSV string from expenses and trigger a browser download.
export function downloadExpensesCsv(expenses: CsvExpense[], filename = 'expenses.csv') {
  const escape = (value: string | number): string => {
    const s = String(value)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  const header = ['Title', 'Amount', 'Category', 'Date']
  const rows = expenses.map((e) => [
    escape(e.title),
    escape(e.amount),
    escape(e.category),
    escape(new Date(e.created_at).toISOString().split('T')[0]),
  ])

  const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}