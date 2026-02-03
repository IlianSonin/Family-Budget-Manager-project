import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "./services/api"; // אם אצלך api נמצא ב- src/services/api

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async () => {
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", { name, email, password });
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleRegister();
    }
  };

  return (
    <div className="page-wrapper">
      <div
        style={{
          maxWidth: 420,
          margin: "60px auto",
          padding: 0,
        }}
      >
        <div
          className="card"
          style={{ boxShadow: "0 8px 32px rgba(30, 136, 229, 0.2)" }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{ marginBottom: 8 }}>Create Account</h2>
            <p style={{ color: "#757575", marginBottom: 0 }}>
              Join your family budget today
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <p style={{ fontSize: "0.85rem", color: "#999", marginBottom: 0 }}>
              Minimum 6 characters
            </p>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleRegister}
            disabled={loading}
            style={{
              width: "100%",
              marginBottom: 16,
              padding: "14px 24px",
              fontSize: "1rem",
            }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <div
            style={{
              textAlign: "center",
              paddingTop: 16,
              borderTop: "1px solid #eeeeee",
            }}
          >
            <p style={{ marginBottom: 0 }}>
              Already have an account?{" "}
              <Link
                to="/login"
                style={{
                  color: "#1e88e5",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
