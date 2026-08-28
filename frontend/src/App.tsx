import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import AddExpense from './pages/AddExpense'
import Expenses from './pages/Expenses'
import Login  from './pages/Login'
import Signup from './pages/Signup'
import Budgets from './pages/Budgets'
import RecurringExpenses from './pages/RecurringExpenses'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/add"
          element={<ProtectedRoute><AddExpense /></ProtectedRoute>}
        />
        <Route
          path="/expenses"
          element={<ProtectedRoute><Expenses /></ProtectedRoute>}
        />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route
          path="/budgets"
          element={<ProtectedRoute><Budgets /></ProtectedRoute>}
        />
        <Route
          path="/recurring-expenses"
          element={<ProtectedRoute><RecurringExpenses /></ProtectedRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

