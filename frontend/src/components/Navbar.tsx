import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="navbar">
      <h2>Expense Tracker</h2>

      <div className="nav-links">
        <Link to="/">Dashboard</Link>
        <Link to="/add">Add Expense</Link>
        <Link to="/expenses">Expenses</Link>
      </div>
    </nav>
  )
}

export default Navbar