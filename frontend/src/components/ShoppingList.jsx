import { useState, useEffect, useContext, useCallback } from "react";
import api from "../services/api";
import { NotificationContext } from "../context/NotificationContext";

function ShoppingList({ onPurchase, month }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newNote, setNewNote] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const { addNotification } = useContext(NotificationContext);

  const loadShoppingList = useCallback(async () => {
    try {
      const params = month ? { month } : {};
      const response = await api.get("/shopping/list", { params });
      setItems(response.data);
    } catch (error) {
      console.error("Failed to load shopping list:", error);
      addNotification("Failed to load shopping list", "error");
    } finally {
      setLoading(false);
    }
  }, [addNotification, month]);

  useEffect(() => {
    loadShoppingList();
  }, [loadShoppingList]);

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    try {
      await api.post("/shopping/add", {
        name: newItem.trim(),
        quantity: newQuantity,
        note: newNote.trim(),
        price: newPrice ? parseFloat(newPrice) : 0,
      });
      setNewItem("");
      setNewQuantity("1");
      setNewNote("");
      setNewPrice("");
      loadShoppingList();
      addNotification("Item added to shopping list", "success");
    } catch (error) {
      console.error("Failed to add item:", error);
      addNotification("Failed to add item", "error");
    }
  };

  const markAsPurchased = async (itemId) => {
    try {
      await api.put("/shopping/mark-purchased", { itemId });
      loadShoppingList();
      if (onPurchase) onPurchase();
      addNotification("Item marked as purchased", "success");
    } catch (error) {
      console.error("Failed to mark item as purchased:", error);
      addNotification("Failed to mark item as purchased", "error");
    }
  };

  const deleteItem = async (itemId) => {
    try {
      await api.delete("/shopping/delete", { data: { itemId } });
      loadShoppingList();
      addNotification("Item deleted", "success");
    } catch (error) {
      console.error("Failed to delete item:", error);
      addNotification("Failed to delete item", "error");
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h3>Shopping List</h3>
        <div style={{ textAlign: "center", padding: "20px" }}>
          Loading shopping list...
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Shopping List</h3>

      {/* Add new item form */}
      <form onSubmit={addItem} style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Item name"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
            required
          />
          <input
            type="text"
            placeholder="Qty"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            style={{
              width: "60px",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
          <input
            type="number"
            placeholder="Price"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            step="0.01"
            min="0"
            style={{
              width: "80px",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Note (optional)"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>
      </form>

      {/* Shopping list items */}
      {items.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666", padding: "20px" }}>
          No items in shopping list
        </p>
      ) : (
        <div>
          {items.map((item) => (
            <div
              key={item._id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px",
                borderBottom: "1px solid #eee",
                opacity: item.isPurchased ? 0.6 : 1,
                textDecoration: item.isPurchased ? "line-through" : "none",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold" }}>
                  {item.name} {item.quantity && `(${item.quantity})`}
                  {item.price > 0 && (
                    <span
                      style={{
                        fontWeight: "normal",
                        color: "#2196F3",
                        marginLeft: "8px",
                      }}
                    >
                      ${item.price.toFixed(2)}
                    </span>
                  )}
                </div>
                {item.note && (
                  <div style={{ fontSize: "0.9em", color: "#666" }}>
                    {item.note}
                  </div>
                )}
                <div style={{ fontSize: "0.8em", color: "#999" }}>
                  Requested by {item.createdBy?.name || "Unknown"}
                  {item.isPurchased && item.boughtBy && (
                    <span> • Bought by {item.boughtBy.name}</span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "5px" }}>
                {!item.isPurchased && (
                  <button
                    onClick={() => markAsPurchased(item._id)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#2196F3",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.8em",
                    }}
                  >
                    Buy
                  </button>
                )}
                <button
                  onClick={() => deleteItem(item._id)}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.8em",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ShoppingList;
