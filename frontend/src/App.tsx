import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import AddExpense from './pages/AddExpense'
import Expenses from './pages/Expenses'
import Login  from './pages/Login'
import Signup from './pages/Signup'
import Budgets from './pages/Budgets'
import RecurringExpenses from './pages/RecurringExpenses'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/add" element={<AddExpense />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/recurring-expenses" element={<RecurringExpenses />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

