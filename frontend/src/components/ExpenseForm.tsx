import { useState } from "react";

type ExpenseFormProps = {
  onCreateExpense: (
    title: string,
    amount: string,
    category: string
  ) => Promise<void>;
};

function ExpenseForm({ onCreateExpense }: ExpenseFormProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await onCreateExpense(title, amount, category);

    setTitle("");
    setAmount("");
    setCategory("");
  }

  return (
    <section className="expense-form-section">
      <h2>Add Expense</h2>

      <form onSubmit={handleSubmit} className="expense-form">
        <input
          type="text"
          placeholder="Expense title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Select category</option>
          <option value="Food">Food</option>
          <option value="Transport">Transport</option>
          <option value="Shopping">Shopping</option>
          <option value="Bills">Bills</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Other">Other</option>
        </select>

        <button type="submit">Add Expense</button>
      </form>
    </section>
  );
}

export default ExpenseForm;