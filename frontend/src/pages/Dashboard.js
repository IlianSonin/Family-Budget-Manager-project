import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useContext,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import QuickAddModal from "../components/QuickAddModal";
import EditBudgetItem from "../components/EditBudgetItem";
import ShoppingList from "../components/ShoppingList";
import { NotificationContext } from "../context/NotificationContext";

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [family, setFamily] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const { addNotification } = useContext(NotificationContext);
  const navigate = useNavigate();
  const lastPermissionCountRef = useRef(0);

  const month = useMemo(() => getCurrentMonth(), []);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [summaryRes, categoriesRes, familyRes, recentRes, meRes] =
        await Promise.all([
          api.get("/budget/summary", { params: { month } }),
          api.get("/budget/categories", { params: { month } }),
          api.get("/family/me"),
          api.get("/budget/recent"),
          api.get("/auth/me"),
        ]);

      setSummary(summaryRes.data);
      setCategories(categoriesRes.data);
      setFamily(familyRes.data);
      setRecent(recentRes.data);
      setCurrentUser(meRes.data);
    } catch (err) {
      console.log("Dashboard error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [month]);

  // Check for new permission requests
  const checkPermissions = useCallback(async () => {
    try {
      const res = await api.get("/permission/pending");
      const currentCount = res.data.length;

      if (currentCount > lastPermissionCountRef.current) {
        const newCount = currentCount - lastPermissionCountRef.current;
        addNotification(
          `You have ${newCount} new edit request${newCount > 1 ? "s" : ""}!`,
          "info",
          5000,
        );
      }

      lastPermissionCountRef.current = currentCount;
    } catch (err) {
      console.error("Failed to check permissions:", err);
    }
  }, [addNotification]);

  useEffect(() => {
    loadData();

    // Set up polling: load data every 5 seconds, check permissions every 3 seconds
    const dataInterval = setInterval(loadData, 5000);
    const permInterval = setInterval(checkPermissions, 3000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(permInterval);
    };
  }, [loadData, checkPermissions]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    addNotification("Logged out successfully", "success", 2000);
    setTimeout(() => {
      navigate("/login");
    }, 500);
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await api.delete("/budget/delete", { data: { budgetItemId: itemId } });
        addNotification("Item deleted successfully", "success", 2000);
        loadData(); // Refresh the data
      } catch (err) {
        addNotification("Failed to delete item", "error", 2000);
      }
    }
  };

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!summary) return <p>Failed to load budget data</p>;

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div className="flex-between" style={{ marginBottom: 32 }}>
          <div>
            <h1 style={{ marginBottom: 8, color: "#1e88e5" }}>Dashboard</h1>
            <p style={{ color: "#757575" }}>
              Welcome back! Here's your family budget overview
            </p>
          </div>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Family Card */}
        {family && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div>
                <div className="card-title">{family.name}</div>
                <div className="card-subtitle">Family</div>
              </div>
            </div>
            <div className="card-body">
              {Array.isArray(family.members) && family.members.length > 0 ? (
                <div>
                  <p
                    style={{
                      marginBottom: 12,
                      fontWeight: 600,
                      color: "#212121",
                    }}
                  >
                    Members ({family.members.length})
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    {family.members.map((m) => (
                      <div
                        key={m._id}
                        style={{
                          padding: 12,
                          background:
                            "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                          borderRadius: 8,
                          borderLeft: "4px solid #1e88e5",
                        }}
                      >
                        <div style={{ fontWeight: 600, color: "#212121" }}>
                          {m.name}
                        </div>
                        {m.email && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#757575",
                              marginTop: 4,
                            }}
                          >
                            {m.email}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p>No members yet</p>
              )}
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <Card label="Month" value={month} color="#64b5f6" />
          <Card label="Income" value={`₪${summary.income}`} color="#4caf50" />
          <Card
            label="Expenses"
            value={`₪${summary.expenses}`}
            color="#ff9800"
          />
          <Card
            label="Balance"
            value={`₪${summary.balance}`}
            color={summary.balance >= 0 ? "#4caf50" : "#f44336"}
          />
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            Add Income/Expense
          </button>
          <button className="btn btn-secondary" onClick={loadData}>
            Refresh
          </button>
          <a
            href="/permissions"
            className="btn btn-primary"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            Edit Permissions
          </a>
        </div>

        {/* Shopping List */}
        <ShoppingList />

        {/* Categories Section */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Top Expense Categories</h3>
          </div>
          <div className="card-body">
            {categories.length === 0 ? (
              <p style={{ textAlign: "center", color: "#757575" }}>
                No expenses yet for this month
              </p>
            ) : (
              <div>
                {categories.slice(0, 5).map((c, idx) => (
                  <div
                    key={c.category}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom:
                        idx < categories.slice(0, 5).length - 1
                          ? "1px solid #eeeeee"
                          : "none",
                    }}
                  >
                    <span style={{ color: "#212121", fontWeight: 500 }}>
                      {c.category}
                    </span>
                    <span className="badge badge-primary">₪{c.total}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Recent Activity</h3>
          </div>
          <div className="card-body">
            {recent.length === 0 ? (
              <p style={{ textAlign: "center", color: "#757575" }}>
                No activity yet
              </p>
            ) : (
              <div>
                {recent.map((a, idx) => {
                  const isOwner =
                    currentUser &&
                    a.createdBy &&
                    typeof a.createdBy === "object" &&
                    a.createdBy._id === currentUser._id;
                  const canEdit = a.canEdit || isOwner;
                  const isIncome = a.type === "income";

                  return (
                    <div
                      key={a._id}
                      style={{
                        padding: 12,
                        marginBottom: idx < recent.length - 1 ? 12 : 0,
                        background:
                          "linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)",
                        borderRadius: 8,
                        borderLeft: `4px solid ${isIncome ? "#4caf50" : "#ff9800"}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#212121",
                              marginBottom: 8,
                            }}
                          >
                            {a.createdBy?.name || "Someone"}{" "}
                            {isIncome ? "added income" : "added expense"}
                            <span
                              className="badge"
                              style={{
                                marginLeft: 8,
                                background: isIncome ? "#c8e6c9" : "#ffe0b2",
                                color: isIncome ? "#2e7d32" : "#e65100",
                              }}
                            >
                              ₪{a.amount}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#757575",
                              marginBottom: 8,
                            }}
                          >
                            {a.category} {a.note ? `• ${a.note}` : ""}
                          </p>
                          {a.editedBy &&
                            typeof a.editedBy === "object" &&
                            a.editedBy._id !== a.createdBy._id && (
                              <p style={{ fontSize: 11, color: "#ff9800" }}>
                                Edited by {a.editedBy?.name || "someone"}
                              </p>
                            )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            alignItems: "flex-end",
                            marginLeft: 16,
                          }}
                        >
                          <button
                            className="btn btn-small"
                            onClick={() => setEditingItemId(a._id)}
                            style={{
                              background: canEdit
                                ? "linear-gradient(135deg, #4caf50 0%, #45a049 100%)"
                                : "linear-gradient(135deg, #64b5f6 0%, #1e88e5 100%)",
                            }}
                          >
                            {canEdit ? "Edit" : "Request"}
                          </button>
                          {canEdit && (
                            <button
                              className="btn btn-small"
                              onClick={() => handleDeleteItem(a._id)}
                              style={{
                                background:
                                  "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                              }}
                            >
                              Delete
                            </button>
                          )}
                          <div
                            style={{
                              fontSize: 11,
                              color: "#999",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {a.createdAt
                              ? new Date(a.createdAt).toLocaleDateString()
                              : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAdd && (
        <QuickAddModal
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            loadData();
          }}
        />
      )}

      {editingItemId && (
        <EditBudgetItem
          itemId={editingItemId}
          onClose={() => setEditingItemId(null)}
          onSaved={() => {
            setEditingItemId(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function Card({ label, value, color }) {
  return (
    <div className="card" style={{ position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          background: color,
          opacity: 0.1,
          borderRadius: "50%",
          transform: "translate(20%, -20%)",
        }}
      ></div>
      <div className="card-subtitle" style={{ color: "#757575" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "1.8rem",
          fontWeight: 700,
          color: color,
          marginTop: 8,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default Dashboard;
