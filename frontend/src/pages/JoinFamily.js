import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

function JoinFamily() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    setError("");

    if (!name || !password) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      await api.post("/family/join", {
        name,
        password,
      });

      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join family");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleJoin();
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
            <h2 style={{ marginBottom: 8 }}>Join Family</h2>
            <p style={{ color: "#757575", marginBottom: 0 }}>
              Enter the family details to join an existing group
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
          </div>

          <button
            className="btn btn-primary"
            onClick={handleJoin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 24px",
              fontSize: "1rem",
            }}
          >
            {loading ? "Joining..." : "Join Family"}
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

export default JoinFamily;
