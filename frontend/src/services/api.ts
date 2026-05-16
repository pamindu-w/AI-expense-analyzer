import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export default api;

const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

// Helper function to get the authorization header
const getAuthHeader = () => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('No authentication token found')
  }
  return {
    'Authorization': `Bearer ${token}`,
  }
}

export const getExpenses = async () => {
  const response = await fetch(`${API_URL}/expenses`, {
    headers: {
      ...getAuthHeader(),
    }
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch expenses: ${response.statusText}`)
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
    throw new Error(`Failed to add expense: ${response.statusText}`)
  }
  return response.json()
}

export const deleteExpense = async (id: number) => {
  const response = await fetch(`${API_URL}/expenses/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to delete expense: ${response.statusText}`)
  }
  return response.json()
}

export const updateExpense = async (
  id: number,
  updatedExpense: any
) => {
  const response = await fetch(`${API_URL}/expenses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(updatedExpense),
  })

  if (!response.ok) {
    throw new Error(`Failed to update expense: ${response.statusText}`)
  }
  return response.json()
}