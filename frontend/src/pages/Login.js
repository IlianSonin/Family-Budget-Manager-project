import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("🔐 Attempting login for:", email);
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      console.log("✅ Login response:", {
        hasToken: !!res.data.token,
        tokenLength: res.data.token?.length,
      });
      localStorage.setItem("token", res.data.token);
      console.log(
        "💾 Token stored in localStorage:",
        localStorage.getItem("token") ? "YES" : "NO",
      );

      navigate("/home");
    } catch (err) {
      console.log(
        "❌ Login failed:",
        err.response?.data?.message || err.message,
      );
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
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
            <h2 style={{ marginBottom: 8 }}>Login</h2>
            <p style={{ color: "#757575", marginBottom: 0 }}>
              Sign in to your Family Budget account
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

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
          </div>

          <button
            className="btn btn-primary"
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              marginBottom: 16,
              padding: "14px 24px",
              fontSize: "1rem",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div
            style={{
              textAlign: "center",
              paddingTop: 16,
              borderTop: "1px solid #eeeeee",
            }}
          >
            <p style={{ marginBottom: 0 }}>
              Don't have an account?{" "}
              <Link
                to="/register"
                style={{
                  color: "#1e88e5",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Register Here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
