type Expense = {
  id: number;
  title: string;
  amount: number;
  category: string;
  created_at: string;
};

type ExpenseItemProps = {
  expense: Expense;
  onDeleteExpense: (id: number) => Promise<void>;
};

function ExpenseItem({
  expense,
  onDeleteExpense,
}: ExpenseItemProps) {
  return (
    <li className="expense-item">
      <div>
        <strong>{expense.title}</strong>

        <p>Rs {expense.amount.toFixed(2)}</p>

        <span>{expense.category}</span>

        <small>
          {new Date(expense.created_at).toLocaleString()}
        </small>
      </div>

      <button
        type="button"
        onClick={() => onDeleteExpense(expense.id)}
      >
        Delete
      </button>
    </li>
  );
}

export default ExpenseItem;
