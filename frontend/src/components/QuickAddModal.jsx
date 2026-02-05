import { useState } from "react";
import ReactDOM from "react-dom";
import api from "../services/api";

const EXPENSE_CATEGORIES = [
  "Groceries",
  "Rent",
  "Bills",
  "Transportation",
  "Entertainment",
  "Health",
  "Other",
];

function QuickAddModal({ onClose, onAdded, initialType = "expense" }) {
  const [type, setType] = useState(initialType);
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!amount || Number(amount) <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    let finalCategory = "Income";

    if (type === "expense") {
      if (!category) {
        setError("Please choose a category");
        return;
      }

      finalCategory = category === "Other" ? customCategory.trim() : category;

      if (!finalCategory) {
        setError("Please enter a category");
        return;
      }
    }

    try {
      await api.post("/budget/add", {
        type,
        category: finalCategory,
        amount: Number(amount),
        note,
      });

      onAdded(); // מרענן דשבורד
      onClose(); // סוגר מודאל
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add item");
    }
  };

  return ReactDOM.createPortal(
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>Add Budget Item</h3>

        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setCategory("");
            setCustomCategory("");
          }}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        {type === "expense" && (
          <>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select category</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
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

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={handleSubmit}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10000,
};

const modalStyle = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  width: 320,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  zIndex: 10001,
};

export default QuickAddModal;
