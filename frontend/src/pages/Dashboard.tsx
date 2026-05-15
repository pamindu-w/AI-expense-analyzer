import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import SummaryCard from '../components/SummaryCard'
import ExpenseChart from '../components/ExpenseChart'
import ExpenseList from '../components/ExpenseList'
import { Link } from 'react-router-dom'
import { getExpenses } from '../services/api'

type Expense = {
  id: number
  title: string
  amount: number
  category: string
}

function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    const data = await getExpenses()
    setExpenses(data)
  }

  // TOTAL EXPENSES
  const totalExpenses = expenses.reduce(
    (total, expense) => total + expense.amount,
    0
  )

  // NUMBER OF TRANSACTIONS
  const transactionCount = expenses.length

  // LARGEST EXPENSE
  const largestExpense =
    expenses.length > 0
      ? Math.max(...expenses.map((e) => e.amount))
      : 0

  // CATEGORY TOTALS
  const categoryTotals: Record<string, number> = {}

  expenses.forEach((expense) => {
    if (categoryTotals[expense.category]) {
      categoryTotals[expense.category] += expense.amount
    } else {
      categoryTotals[expense.category] = expense.amount
    }
  })

  const chartData = Object.entries(categoryTotals).map(
    ([category, amount]) => ({
      name: category,
      value: amount,
    })
  )

  return (
    <div>
      <Navbar />

      <div className="dashboard">
        <h1>Dashboard</h1>

        <div className="summary-grid">
          <SummaryCard
            title="Total Expenses"
            value={`$${totalExpenses}`}
          />

          <SummaryCard
            title="Transactions"
            value={transactionCount.toString()}
          />

          <SummaryCard
            title="Largest Expense"
            value={`$${largestExpense}`}
          />

          <SummaryCard
            title="Categories"
            value={Object.keys(categoryTotals).length.toString()}
          />
        </div>

        <div className="button-group">
          <Link to="/add">
            <button>Add Expense</button>
          </Link>

          <Link to="/expenses">
            <button>See Expenses</button>
          </Link>
        </div>

        <ExpenseChart data={chartData} />

        <ExpenseList />
      </div>
    </div>
  )
}

export default Dashboard