import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export default api;

const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export const getExpenses = async () => {
  const response = await fetch(`${API_URL}/expenses`)
  return response.json()
}

export const addExpense = async (expense: any) => {
  const response = await fetch(`${API_URL}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(expense),
  })

  return response.json()
}

export const deleteExpense = async (id: number) => {
  const response = await fetch(`${API_URL}/expenses/${id}`, {
    method: 'DELETE',
  })

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
    },
    body: JSON.stringify(updatedExpense),
  })

  return response.json()
}