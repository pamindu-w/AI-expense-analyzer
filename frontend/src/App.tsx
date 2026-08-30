import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import AddExpense from './pages/AddExpense'
import Expenses from './pages/Expenses'
import Login  from './pages/Login'
import Signup from './pages/Signup'
import Budgets from './pages/Budgets'
import RecurringExpenses from './pages/RecurringExpenses'
import Chat from './pages/Chat'
import Settings from './pages/Settings'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
        <Route
          path="/chat"
          element={<ProtectedRoute><Chat /></ProtectedRoute>}
        />
        <Route
          path="/settings"
          element={<ProtectedRoute><Settings /></ProtectedRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

