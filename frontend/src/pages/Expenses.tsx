import Navbar from '../components/Navbar'
import ExpenseList from '../components/ExpenseList'

function Expenses() {
  return (
    <div>
      <Navbar />

      <div className="dashboard">
        <h1>All Expenses</h1>

        <ExpenseList />
      </div>
    </div>
  )
}

export default Expenses