import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

function CreateFamily() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleCreate = async () => {
    setError("");

    if (!name || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    setLoading(true);

    try {
      await api.post("/family/create", {
        name,
        password,
      });

      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create family");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleCreate();
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth: 420, margin: "60px auto", padding: 0 }}>
        <div
          className="card"
          style={{ boxShadow: "0 8px 32px rgba(30, 136, 229, 0.2)" }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{ marginBottom: 8 }}>Create Family Group</h2>
            <p style={{ color: "#757575", marginBottom: 0 }}>
              Set up your family budget management
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Family Name</label>
            <input
              type="text"
              placeholder="The Smith Family"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <p style={{ fontSize: "0.85rem", color: "#999", marginBottom: 0 }}>
              A unique name for your family group
            </p>
          </div>

          <div className="form-group">
            <label>Family Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <p style={{ fontSize: "0.85rem", color: "#999", marginBottom: 0 }}>
              Share this with family members to join (minimum 4 characters)
            </p>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 24px",
              fontSize: "1rem",
            }}
          >
            {loading ? "Creating..." : "Create Family"}
          </button>

          <div
            style={{
              textAlign: "center",
              paddingTop: 16,
              borderTop: "1px solid #eeeeee",
              marginTop: 16,
            }}
          >
            <p style={{ marginBottom: 0 }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/family");
                }}
                style={{
                  color: "#1e88e5",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                ← Go Back
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateFamily;
