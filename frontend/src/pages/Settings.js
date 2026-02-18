import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { NotificationContext } from "../context/NotificationContext";
import { useContext } from "react";

function Settings() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useContext(NotificationContext);

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await api.delete("/auth/delete");
      localStorage.removeItem("token");
      addNotification("Account deleted successfully", "success", 3000);
      navigate("/login");
    } catch (err) {
      addNotification("Failed to delete account", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth: 600, margin: "20px auto", padding: 0 }}>
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "#f5f5f5",
              border: "1px solid #ddd",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              color: "#666",
              fontSize: "14px",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#e8f4fd";
              e.target.style.borderColor = "#1e88e5";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#f5f5f5";
              e.target.style.borderColor = "#ddd";
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
        <div
          className="card"
          style={{ boxShadow: "0 8px 32px rgba(30, 136, 229, 0.2)" }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{ marginBottom: 4 }}>Settings</h2>
            <p style={{ color: "#757575", marginBottom: 0, fontSize: "14px" }}>
              Manage your account and preferences
            </p>
          </div>

          {/* Notifications Section */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12 }}>Notifications</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="checkbox" id="notifications" disabled />
              <label htmlFor="notifications" style={{ color: "#999" }}>
                Enable notifications (coming soon)
              </label>
            </div>
          </div>

          {/* Account Section */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12 }}>Account</h3>
            <button
              className="btn btn-danger"
              onClick={handleDeleteAccount}
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Deleting..." : "Delete Account"}
            </button>
            <p style={{ fontSize: "12px", color: "#999", marginTop: 8 }}>
              This will permanently delete your account and all associated data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
