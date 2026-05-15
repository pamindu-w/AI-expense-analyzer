import { useState } from 'react'
import Navbar from '../components/Navbar'
import { addExpense } from '../services/api'
import { useNavigate } from 'react-router-dom'

function AddExpense() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    await addExpense({
      title,
      amount: Number(amount),
      category: category === 'Other' ? customCategory : category,
    })

    navigate('/expenses')
  }

  return (
    <div>
      <Navbar />

      <div className="form-container">
        <h1>Add Expense</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setCustomCategory('')
            }}
          >
            <option value="">Select category</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Shopping">Shopping</option>
            <option value="Bills">Bills</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Other">Other</option>
          </select>

          {category === 'Other' && (
            <input
              type="text"
              placeholder="Enter custom category"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
            />
          )}

          <button type="submit">Save Expense</button>
        </form>
      </div>
    </div>
  )
}

export default AddExpense