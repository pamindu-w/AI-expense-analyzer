export const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export const isAuthenticated = (): boolean =>
  !!localStorage.getItem('access_token')

export const logout = (): void => {
  localStorage.removeItem('access_token')
  cachedWeeklyDigest = null
  pendingWeeklyDigest = null
}

let cachedWeeklyDigest: {
  digest: Digest
  period_key: string
  created_at: string | null
} | null = null
let pendingWeeklyDigest: Promise<{
  digest: Digest
  period_key: string
  created_at: string | null
}> | null = null

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

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export const getChatHistory = async (): Promise<ChatMessage[]> => {
  const response = await fetch(`${API_URL}/chat/history`, {
    headers: getAuthHeader(),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch chat history: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}

export const clearChatHistory = async (): Promise<void> => {
  const response = await fetch(`${API_URL}/chat/history`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to clear chat history: ${response.status} ${response.statusText} - ${text}`)
  }
}

export type StreamChatHandlers = {
  onChunk: (text: string) => void
  onDone: (followUps: string[]) => void
  onError: (message: string) => void
}

export const streamChat = async (
  message: string,
  handlers: StreamChatHandlers,
): Promise<void> => {
  const response = await fetch(`${API_URL}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ message }),
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

  if (!response.body) {
    throw new Error('Streaming not supported in this browser')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''

    for (const frame of frames) {
      const dataLine = frame
        .split('\n')
        .find((line) => line.startsWith('data:'))
      if (!dataLine) continue

      const payload = dataLine.slice(5).trim()
      if (!payload) continue

      let event: { type: string; text?: string; follow_ups?: string[]; message?: string }
      try {
        event = JSON.parse(payload)
      } catch {
        continue
      }

      if (event.type === 'chunk' && event.text) {
        handlers.onChunk(event.text)
      } else if (event.type === 'done') {
        handlers.onDone(event.follow_ups ?? [])
      } else if (event.type === 'error') {
        handlers.onError(event.message ?? 'Something went wrong.')
      }
    }
  }
}

export const deleteAccount = async (password: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_URL}/account/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ password }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to delete account: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}

export const forgotPassword = async (
  email: string,
): Promise<{ message: string; dev_link?: string }> => {
  const response = await fetch(`${API_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to request reset: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}

export const resetPassword = async (
  token: string,
  newPassword: string,
): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
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

export type Digest = {
  title: string
  trends: string
  topCategories: string[]
  advice: string
  error?: string
}

export type WeeklyDigestData = {
  digest: Digest
  period_key: string
  created_at: string | null
}

export const getCachedWeeklyDigest = (): WeeklyDigestData | null =>
  cachedWeeklyDigest

export const getWeeklyDigest = async (): Promise<WeeklyDigestData> => {
  if (cachedWeeklyDigest) return cachedWeeklyDigest
  if (pendingWeeklyDigest) return pendingWeeklyDigest

  pendingWeeklyDigest = fetch(`${API_URL}/digest`, {
    headers: getAuthHeader(),
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text()
        throw new Error(
          `Failed to fetch weekly digest: ${response.status} ${response.statusText} - ${text}`,
        )
      }
      const data = (await response.json()) as WeeklyDigestData
      cachedWeeklyDigest = data
      return data
    })
    .finally(() => {
      pendingWeeklyDigest = null
    })

  return pendingWeeklyDigest
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

export type NotificationItem = {
  id: number
  type: string
  title: string
  message: string
  category: string | null
  month: string | null
  amount: number | null
  signature: string
  read: boolean
  created_at: string
}

export const getNotifications = async (): Promise<{
  notifications: NotificationItem[]
  unread_count: number
}> => {
  const response = await fetch(`${API_URL}/notifications`, {
    headers: getAuthHeader(),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText} - ${text}`)
  }
  return response.json()
}

export const getUnreadNotificationsCount = async (): Promise<number> => {
  const response = await fetch(`${API_URL}/notifications/unread-count`, {
    headers: getAuthHeader(),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch unread count: ${response.status} ${response.statusText} - ${text}`)
  }
  const data = await response.json()
  return data.count ?? 0
}

export const markNotificationRead = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: 'PUT',
    headers: getAuthHeader(),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to mark notification read: ${response.status} ${response.statusText} - ${text}`)
  }
}

export const markAllNotificationsRead = async (): Promise<void> => {
  const response = await fetch(`${API_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: getAuthHeader(),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to mark all notifications read: ${response.status} ${response.statusText} - ${text}`)
  }
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