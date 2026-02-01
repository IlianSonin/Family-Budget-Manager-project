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
  const [showAdd, setShowAdd] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const { addNotification } = useContext(NotificationContext);
  const navigate = useNavigate();
  const lastPermissionCountRef = useRef(0);

  const month = useMemo(() => getCurrentMonth(), []);

  const loadData = useCallback(async () => {
    try {
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
          `🔔 You have ${newCount} new edit request${newCount > 1 ? "s" : ""}!`,
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
    addNotification("👋 Logged out successfully", "success", 2000);
    setTimeout(() => {
      navigate("/login");
    }, 500);
  };

  if (loading) return <p>Loading dashboard...</p>;
  if (!summary) return <p>Failed to load budget data</p>;

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Logout
        </button>
      </div>

      {/* Family */}
      {family && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7 }}>Family</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{family.name}</div>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Members</div>

            {Array.isArray(family.members) && family.members.length > 0 ? (
              <div style={{ marginTop: 6 }}>
                {family.members.map((m) => (
                  <div
                    key={m._id}
                    style={{
                      padding: "6px 0",
                      borderBottom: "1px solid #f2f2f2",
                    }}
                  >
                    <strong>{m.name}</strong>
                    {m.email ? <span> — {m.email}</span> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ marginTop: 6 }}>No members yet</p>
            )}
          </div>
        </div>
      )}

      {/* Snapshot cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Card label="Month" value={month} />
        <Card label="Income" value={`₪${summary.income}`} />
        <Card label="Expenses" value={`₪${summary.expenses}`} />
        <Card label="Balance" value={`₪${summary.balance}`} />
      </div>

      {/* Quick Add */}
      <div
        style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}
      >
        <button onClick={() => setShowAdd(true)}>+ Add income / expense</button>
        <button onClick={loadData}>Refresh</button>
        <a
          href="/permissions"
          style={{
            padding: "8px 16px",
            backgroundColor: "#2196F3",
            color: "white",
            borderRadius: 4,
            textDecoration: "none",
          }}
        >
          Edit Permissions
        </a>
      </div>

      {/* Shopping List */}
      <ShoppingList />

      {/* Categories */}
      <div style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Top expense categories</h3>

        {categories.length === 0 ? (
          <p>No expenses yet for this month</p>
        ) : (
          <div
            style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}
          >
            {categories.slice(0, 5).map((c) => (
              <div
                key={c.category}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <span>{c.category}</span>
                <strong>₪{c.total}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Recent activity</h3>

        {recent.length === 0 ? (
          <p>No activity yet</p>
        ) : (
          <div
            style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}
          >
            {recent.map((a) => {
              const isOwner =
                currentUser &&
                a.createdBy &&
                typeof a.createdBy === "object" &&
                a.createdBy._id === currentUser._id;
              return (
                <div
                  key={a._id}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div>
                        <strong>{a.createdBy?.name || "Someone"}</strong> added{" "}
                        <strong>
                          {a.type === "income" ? "income" : "expense"}
                        </strong>{" "}
                        — ₪{a.amount}
                      </div>

                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                        Category: {a.category}
                        {a.note ? ` | Note: ${a.note}` : ""}
                      </div>

                      {a.editedBy &&
                        typeof a.editedBy === "object" &&
                        a.editedBy._id !== a.createdBy._id && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#ff9800",
                              marginTop: 4,
                            }}
                          >
                            (Edited by {a.editedBy?.name || "someone"})
                          </div>
                        )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        alignItems: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => setEditingItemId(a._id)}
                        style={{
                          padding: "6px 12px",
                          fontSize: 12,
                          backgroundColor: isOwner ? "#4CAF50" : "#2196F3",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        {isOwner ? "Edit" : "Request Edit"}
                      </button>

                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        {a.createdAt
                          ? new Date(a.createdAt).toLocaleString()
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

      {/* Modal */}
      {showAdd && (
        <QuickAddModal
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            loadData();
          }}
        />
      )}

      {/* Edit Item Modal */}
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

function Card({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 12,
        minWidth: 180,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default Dashboard;
