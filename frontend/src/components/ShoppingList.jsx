import { useState, useEffect, useContext, useCallback } from "react";
import api from "../services/api";
import { NotificationContext } from "../context/NotificationContext";

function ShoppingList() {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemNote, setNewItemNote] = useState("");
  const [loading, setLoading] = useState(true);
  const { addNotification } = useContext(NotificationContext);

  const loadShoppingList = useCallback(async () => {
    try {
      const res = await api.get("/shopping/list");
      setItems(res.data);
    } catch (err) {
      console.error(err);
      addNotification("Failed to load shopping list", "error");
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadShoppingList();
    // Poll for updates every 3 seconds
    const interval = setInterval(loadShoppingList, 3000);
    return () => clearInterval(interval);
  }, [loadShoppingList]);

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      addNotification("Please enter an item name", "warning");
      return;
    }

    try {
      await api.post("/shopping/add", {
        name: newItemName,
        quantity: newItemQuantity,
        note: newItemNote,
      });

      addNotification("✅ Item added to shopping list!", "success", 2000);
      setNewItemName("");
      setNewItemQuantity("1");
      setNewItemNote("");
      loadShoppingList();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to add item";
      addNotification(errorMsg, "error");
    }
  };

  const handleTogglePurchased = async (itemId, currentStatus) => {
    try {
      await api.put("/shopping/mark-purchased", {
        itemId,
        isPurchased: !currentStatus,
      });

      addNotification(
        !currentStatus ? "✓ Marked as purchased!" : "Marked as unpurchased",
        "success",
        2000,
      );
      loadShoppingList();
    } catch (err) {
      addNotification("Failed to update item", "error");
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await api.delete("/shopping/delete", {
        data: { itemId },
      });

      addNotification("Item deleted", "info", 2000);
      loadShoppingList();
    } catch (err) {
      addNotification("Failed to delete item", "error");
    }
  };

  const handleClearPurchased = async () => {
    if (!window.confirm("Clear all purchased items?")) return;

    try {
      await api.post("/shopping/clear-purchased");
      addNotification("Cleared purchased items!", "success", 2000);
      loadShoppingList();
    } catch (err) {
      addNotification("Failed to clear purchased items", "error");
    }
  };

  const purchasedCount = items.filter((item) => item.isPurchased).length;
  const unpurchasedCount = items.filter((item) => !item.isPurchased).length;

  if (loading) return <div style={loadingStyle}>Loading shopping list...</div>;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={{ margin: 0 }}>Shopping List</h3>
        <div style={statsStyle}>
          <span>{unpurchasedCount}</span>
          <span>✓ {purchasedCount}</span>
        </div>
      </div>

      {/* Add Item Form */}
      <div style={formStyle}>
        <input
          type="text"
          placeholder="Item name..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Qty (e.g., 2, 1kg)"
          value={newItemQuantity}
          onChange={(e) => setNewItemQuantity(e.target.value)}
          style={{ ...inputStyle, flex: 0.6 }}
        />

        <button onClick={handleAddItem} style={addButtonStyle}>
          Add
        </button>
      </div>

      <input
        type="text"
        placeholder="Note (optional)..."
        value={newItemNote}
        onChange={(e) => setNewItemNote(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
        style={{ ...inputStyle, marginBottom: 12 }}
      />

      {/* Shopping List */}
      <div style={listContainerStyle}>
        {items.length === 0 ? (
          <p style={{ textAlign: "center", opacity: 0.6, marginTop: 20 }}>
            Shopping list is empty
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item._id}
              style={{
                ...itemStyle,
                opacity: item.isPurchased ? 0.5 : 1,
                backgroundColor: item.isPurchased ? "#f5f5f5" : "white",
              }}
            >
              <input
                type="checkbox"
                checked={item.isPurchased}
                onChange={() =>
                  handleTogglePurchased(item._id, item.isPurchased)
                }
                style={checkboxStyle}
              />

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: 14,
                      textDecoration: item.isPurchased
                        ? "line-through"
                        : "none",
                      color: item.isPurchased ? "#999" : "#333",
                    }}
                  >
                    {item.name}
                  </span>
                  <span
                    style={{
                      backgroundColor: "#e8f5e9",
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "#2e7d32",
                    }}
                  >
                    {item.quantity}
                  </span>
                </div>

                {item.note && (
                  <p style={{ margin: "4px 0", fontSize: 12, opacity: 0.7 }}>
                    {item.note}
                  </p>
                )}

                <p
                  style={{
                    margin: "4px 0",
                    fontSize: 11,
                    opacity: 0.5,
                  }}
                >
                  by {item.createdBy?.name || "Unknown"} •{" "}
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => handleDeleteItem(item._id)}
                style={deleteButtonStyle}
                title="Delete item"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {purchasedCount > 0 && (
        <button onClick={handleClearPurchased} style={clearButtonStyle}>
          Clear Purchased ({purchasedCount})
        </button>
      )}
    </div>
  );
}

const containerStyle = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 16,
  marginBottom: 20,
  backgroundColor: "#fff",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
  paddingBottom: 12,
  borderBottom: "2px solid #f0f0f0",
};

const statsStyle = {
  display: "flex",
  gap: 12,
  fontSize: 13,
};

const formStyle = {
  display: "flex",
  gap: 8,
  marginBottom: 12,
};

const inputStyle = {
  flex: 1,
  padding: 10,
  borderRadius: 6,
  border: "1px solid #ddd",
  fontSize: 14,
  fontFamily: "inherit",
};

const addButtonStyle = {
  padding: "10px 20px",
  backgroundColor: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 500,
};

const listContainerStyle = {
  maxHeight: 400,
  overflowY: "auto",
};

const itemStyle = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  padding: 12,
  marginBottom: 8,
  border: "1px solid #eee",
  borderRadius: 8,
  transition: "all 0.2s",
};

const checkboxStyle = {
  marginTop: 4,
  width: 18,
  height: 18,
  cursor: "pointer",
  flexShrink: 0,
};

const deleteButtonStyle = {
  backgroundColor: "#ffebee",
  border: "1px solid #ffcdd2",
  color: "#c62828",
  padding: "4px 8px",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: "bold",
};

const clearButtonStyle = {
  width: "100%",
  padding: 12,
  marginTop: 12,
  backgroundColor: "#fff3e0",
  border: "1px solid #ffe0b2",
  color: "#e65100",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 500,
  fontSize: 13,
};

const loadingStyle = {
  textAlign: "center",
  padding: 20,
  color: "#999",
};

export default ShoppingList;
