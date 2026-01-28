import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../services/api";
import QuickAddModal from "../components/QuickAddModal";

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

  const month = useMemo(() => getCurrentMonth(), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, categoriesRes, familyRes, recentRes] =
        await Promise.all([
          api.get("/budget/summary", { params: { month } }),
          api.get("/budget/categories", { params: { month } }),
          api.get("/family/me"),
          api.get("/budget/recent"),
        ]);

      setSummary(summaryRes.data);
      setCategories(categoriesRes.data);
      setFamily(familyRes.data);
      setRecent(recentRes.data);
    } catch (err) {
      console.log("Dashboard error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <p>Loading dashboard...</p>;
  if (!summary) return <p>Failed to load budget data</p>;

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 12 }}>Dashboard</h2>

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
      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button onClick={() => setShowAdd(true)}>+ Add income / expense</button>
        <button onClick={loadData}>Refresh</button>
      </div>

      {/* Categories */}
      <div style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Top expense categories</h3>

        {categories.length === 0 ? (
          <p>No expenses yet for this month</p>
        ) : (
          <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
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
          <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
            {recent.map((a) => (
              <div
                key={a._id}
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <strong>{a.createdBy?.name || "Someone"}</strong>{" "}
                    added{" "}
                    <strong>{a.type === "income" ? "income" : "expense"}</strong>{" "}
                    — ₪{a.amount}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                  </div>
                </div>

                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  Category: {a.category}
                  {a.note ? ` | Note: ${a.note}` : ""}
                </div>
              </div>
            ))}
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
