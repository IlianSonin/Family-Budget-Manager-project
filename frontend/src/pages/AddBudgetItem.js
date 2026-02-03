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
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");

    if (!amount) {
      setError("Amount is required");
      return;
    }

    if (Number(amount) <= 0) {
      setError("Amount must be a positive number");
      return;
    }

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

    setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth: 500, margin: "40px auto", padding: 0 }}>
        <div
          className="card"
          style={{ boxShadow: "0 8px 32px rgba(30, 136, 229, 0.2)" }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{ marginBottom: 8 }}>Add Budget Item</h2>
            <p style={{ color: "#757575", marginBottom: 0 }}>
              Record a new income or expense
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Type</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setCategory("");
                setCustomCategory("");
              }}
              disabled={loading}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          {type === "expense" && (
            <>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select a category</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {category === "Other" && (
                <div className="form-group">
                  <label>Custom Category</label>
                  <input
                    type="text"
                    placeholder="Enter custom category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                  />
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Note (Optional)</label>
            <textarea
              placeholder="Add a note about this transaction..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading}
              style={{ minHeight: 80, resize: "vertical" }}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 24px",
              fontSize: "1rem",
              marginBottom: 12,
            }}
          >
            {loading ? "Adding..." : "Add Item"}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => navigate("/home")}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 24px",
              fontSize: "1rem",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddBudgetItem;
