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

  const calculatePasswordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { level: "Weak", color: "#2196F3", width: "33%" };
    if (score <= 4) return { level: "Medium", color: "#FF9800", width: "66%" };
    return { level: "Strong", color: "#4CAF50", width: "100%" };
  };

  const passwordStrength = calculatePasswordStrength(password);

  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;

    const domain = email.split("@")[1].toLowerCase();
    const commonDomains = [
      "gmail.com",
      "outlook.com",
      "hotmail.com",
      "yahoo.com",
      "icloud.com",
      "aol.com",
    ];

    // Check exact match
    if (commonDomains.includes(domain)) return true;

    // Check for common typos (edit distance <= 1)
    for (let d of commonDomains) {
      if (editDistance(domain, d) <= 1) return true;
    }

    return false;
  };

  const editDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    if (a[0] === b[0]) return editDistance(a.slice(1), b.slice(1));
    return (
      1 +
      Math.min(
        editDistance(a.slice(1), b),
        editDistance(a, b.slice(1)),
        editDistance(a.slice(1), b.slice(1)),
      )
    );
  };

  const handleRegister = async () => {
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Invalid email format");
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
          margin: "10px auto",
          padding: 0,
        }}
      >
        <div
          className="card"
          style={{ boxShadow: "0 8px 32px rgba(30, 136, 229, 0.2)" }}
        >
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <h2 style={{ marginBottom: 2 }}>Create Account</h2>
            <p style={{ color: "#757575", marginBottom: 0, fontSize: "14px" }}>
              Join your family budget today
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 8 }}>
              {error}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 8 }}>
            <label>Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "16px",
                transition: "border-color 0.3s ease",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1e88e5")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd")}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 8 }}>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
                transition: "border-color 0.3s ease",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1e88e5")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd")}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 8 }}>
            <label>Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
                transition: "border-color 0.3s ease",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1e88e5")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd")}
            />
            {password && (
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    width: "100%",
                    height: 4,
                    backgroundColor: "#e0e0e0",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: passwordStrength.width,
                      height: "100%",
                      backgroundColor: passwordStrength.color,
                      transition: "width 0.3s ease, background-color 0.3s ease",
                    }}
                  />
                </div>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: passwordStrength.color,
                    marginTop: 4,
                    marginBottom: 0,
                    fontWeight: 500,
                  }}
                >
                  Password Strength: {passwordStrength.level}
                </p>
              </div>
            )}
            <p style={{ fontSize: "0.85rem", color: "#999", marginBottom: 0 }}>
              Minimum 6 characters
            </p>
          </div>

          <div className="form-group" style={{ marginBottom: 8 }}>
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
                transition: "border-color 0.3s ease",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1e88e5")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd")}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleRegister}
            disabled={loading}
            style={{
              width: "100%",
              marginBottom: 8,
              padding: "12px 20px",
              fontSize: "1rem",
            }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <div
            style={{
              textAlign: "center",
              paddingTop: 8,
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
