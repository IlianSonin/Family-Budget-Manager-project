import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const EXPENSE_CATEGORIES = [
  "Groceries",
  "Rent",
  "Bills",
  "Transportation",
  "Entertainment",
  "Health",
  "Other",
];

function AddBudgetItem() {
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");

    let finalCategory = category;

    if (type === "income") {
      finalCategory = "Income";
    }

    if (type === "expense") {
      if (!category) {
        setError("Please choose a category");
        return;
      }

      if (category === "Other") {
        if (!customCategory.trim()) {
          setError("Please enter a custom category");
          return;
        }
        finalCategory = customCategory.trim();
      }
    }

    if (!amount) {
      setError("Amount is required");
      return;
    }

    try {
      await api.post("/budget/add", {
        type,
        category: finalCategory,
        amount: Number(amount),
        note,
      });

      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add item");
    }
  };

  return (
    <div>
      <h2>Add Budget Item</h2>

      {/* TYPE */}
      <select value={type} onChange={(e) => {
        setType(e.target.value);
        setCategory("");
        setCustomCategory("");
      }}>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>

      {/* CATEGORY – only for expenses */}
      {type === "expense" && (
        <>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select category</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {category === "Other" && (
            <input
              placeholder="Custom category"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
            />
          )}
        </>
      )}

      {/* AMOUNT */}
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {/* NOTE */}
      <input
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <button onClick={handleSubmit}>Add</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default AddBudgetItem;
