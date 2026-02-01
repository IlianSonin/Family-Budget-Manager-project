import { useState, useEffect, useContext } from "react";
import api from "../services/api";
import { NotificationContext } from "../context/NotificationContext";

function EditBudgetItem({ itemId, onClose, onSaved }) {
  const [item, setItem] = useState(null);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [messageText, setMessageText] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(true);
  const [loading, setLoading] = useState(true);
  const [permissionId, setPermissionId] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);
  const { addNotification } = useContext(NotificationContext);

  const EXPENSE_CATEGORIES = [
    "Groceries",
    "Rent",
    "Bills",
    "Transportation",
    "Entertainment",
    "Health",
    "Other",
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get the budget item details from recent items
        const recentRes = await api.get("/budget/recent");
        const foundItem = recentRes.data.find((i) => i._id === itemId);

        if (!foundItem) {
          setError("Item not found");
          setLoading(false);
          return;
        }

        // Only load initial data if we haven't loaded yet
        if (!item) {
          setItem(foundItem);
          setCategory(foundItem.category);
          setAmount(foundItem.amount);
          setNote(foundItem.note || "");
        }

        // Check if user can edit
        const permRes = await api.get("/permission/can-edit", {
          params: { budgetItemId: itemId },
        });

        setCanEdit(permRes.data.canEdit);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load item");
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up polling for permission status updates only (not form data)
    const interval = setInterval(async () => {
      try {
        const permRes = await api.get("/permission/can-edit", {
          params: { budgetItemId: itemId },
        });
        setCanEdit(permRes.data.canEdit);
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [itemId, item]);

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!amount || Number(amount) <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    try {
      await api.put("/budget/edit", {
        budgetItemId: itemId,
        category,
        amount: Number(amount),
        note,
      });

      addNotification("✅ Item updated successfully!", "success", 3000);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update item";
      setError(errorMsg);
      addNotification(errorMsg, "error");
    }
  };

  const handleRequestPermission = async () => {
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/permission/request", {
        budgetItemId: itemId,
        reason: editReason,
      });

      setPermissionId(res.data.permission._id);
      setRequestStatus("pending");
      setSuccess("Permission request sent! Waiting for approval...");
      addNotification("📨 Permission request sent to owner!", "info", 4000);

      // Send initial message if provided
      if (messageText.trim()) {
        await api.post("/message/send", {
          recipientId: item.createdBy._id,
          permissionId: res.data.permission._id,
          content: messageText,
        });
        setMessageText("");
      }

      setEditReason("");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to request permission";
      setError(errorMsg);
      addNotification(errorMsg, "error");
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setError("");

    try {
      await api.post("/message/send", {
        recipientId: item.createdBy._id,
        permissionId: permissionId,
        content: messageText,
      });

      setMessageText("");
      addNotification("💬 Message sent!", "success", 2000);
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to send message";
      setError(errorMsg);
      addNotification(errorMsg, "error");
    }
  };

  if (loading)
    return (
      <div style={overlayStyle}>
        <div style={spinnerStyle}></div>Loading...
      </div>
    );
  if (!item)
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          Item not found
          <button onClick={onClose} style={closeButtonStyle}>
            ✕
          </button>
        </div>
      </div>
    );

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0 }}>Edit Budget Item</h3>
          <button onClick={onClose} style={closeButtonStyle}>
            ✕
          </button>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        {success && <div style={successStyle}>{success}</div>}

        {!canEdit ? (
          <div>
            <p
              style={{ color: "#ff9800", marginBottom: 12, fontWeight: "500" }}
            >
              This item was created by someone else. Request permission to edit
              it.
            </p>
            <div style={itemDetailsStyle}>
              <strong>Item Details:</strong>
              <p>
                <strong>Type:</strong> {item.type}
              </p>
              <p>
                <strong>Category:</strong> {item.category}
              </p>
              <p>
                <strong>Amount:</strong> ₪{item.amount}
              </p>
              <p>
                <strong>Note:</strong> {item.note || "No note"}
              </p>
            </div>

            {requestStatus === "pending" ? (
              <div style={pendingStyle}>
                <p style={{ margin: "0 0 12px 0", fontWeight: "500" }}>
                  ⏳ Request sent! Waiting for approval...
                </p>
                <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>
                  Send a message to help convince the owner
                </p>
              </div>
            ) : null}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 8 }}>
                <strong>Why do you want to edit?</strong>
                <textarea
                  placeholder="Explain your reason (optional)"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  style={textareaStyle}
                />
              </label>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 8 }}>
                <strong>Send a message</strong>
                <textarea
                  placeholder="Message to the owner (optional)"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  style={textareaStyle}
                />
              </label>
            </div>

            <div style={buttonGroupStyle}>
              <button
                onClick={handleRequestPermission}
                style={primaryButtonStyle}
              >
                🔒 Send Request
              </button>
              <button onClick={onClose} style={secondaryButtonStyle}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label style={labelStyle}>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Amount
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Note
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={textareaStyle}
              />
            </label>

            <div style={buttonGroupStyle}>
              <button onClick={handleSave} style={primaryButtonStyle}>
                ✓ Save Changes
              </button>
              <button onClick={onClose} style={secondaryButtonStyle}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: "white",
  padding: 24,
  borderRadius: 12,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  maxWidth: 500,
  width: "90%",
  maxHeight: "90vh",
  overflowY: "auto",
  position: "relative",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
  paddingBottom: 12,
  borderBottom: "1px solid #eee",
};

const closeButtonStyle = {
  backgroundColor: "transparent",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
  color: "#999",
  padding: "0 4px",
  lineHeight: 1,
  "&:hover": { color: "#333" },
};

const errorStyle = {
  color: "#c33",
  marginBottom: 12,
  padding: 12,
  backgroundColor: "#ffe0e0",
  borderRadius: 4,
  fontSize: 14,
};

const successStyle = {
  color: "#27ae60",
  marginBottom: 12,
  padding: 12,
  backgroundColor: "#d5f4e6",
  borderRadius: 4,
  fontSize: 14,
};

const itemDetailsStyle = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
  backgroundColor: "#f9f9f9",
  fontSize: 13,
};

const pendingStyle = {
  backgroundColor: "#e3f2fd",
  border: "1px solid #90caf9",
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
};

const labelStyle = {
  display: "block",
  marginBottom: 16,
};

const selectStyle = {
  display: "block",
  marginTop: 6,
  width: "100%",
  padding: 10,
  borderRadius: 4,
  border: "1px solid #ddd",
  fontSize: 14,
  fontFamily: "inherit",
};

const inputStyle = {
  display: "block",
  marginTop: 6,
  width: "100%",
  padding: 10,
  borderRadius: 4,
  border: "1px solid #ddd",
  fontSize: 14,
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const textareaStyle = {
  display: "block",
  marginTop: 6,
  width: "100%",
  padding: 10,
  borderRadius: 4,
  border: "1px solid #ddd",
  fontSize: 14,
  fontFamily: "inherit",
  height: 70,
  boxSizing: "border-box",
};

const buttonGroupStyle = {
  display: "flex",
  gap: 10,
  marginTop: 16,
};

const primaryButtonStyle = {
  flex: 1,
  padding: 12,
  backgroundColor: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: "500",
};

const secondaryButtonStyle = {
  flex: 1,
  padding: 12,
  backgroundColor: "#999",
  color: "white",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 14,
};

const spinnerStyle = {
  border: "3px solid #f3f3f3",
  borderTop: "3px solid #4CAF50",
  borderRadius: "50%",
  width: 30,
  height: 30,
  animation: "spin 1s linear infinite",
  marginBottom: 12,
};

export default EditBudgetItem;
