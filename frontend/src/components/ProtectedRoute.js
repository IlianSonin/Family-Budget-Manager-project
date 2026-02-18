import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../services/api";

function ProtectedRoute({ children }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");

      console.log("🔍 ProtectedRoute: Validating token", {
        hasToken: !!token,
        token: token ? `${token.substring(0, 20)}...` : "none",
      });

      if (!token) {
        console.log("🚫 ProtectedRoute: No token found");
        setIsValidating(false);
        setIsAuthenticated(false);
        return;
      }

      try {
        console.log("🔐 ProtectedRoute: Calling /auth/me");
        const response = await api.get("/auth/me");
        console.log("✅ ProtectedRoute: /auth/me success", response.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.log("❌ ProtectedRoute: /auth/me failed", {
          status: err.response?.status,
          message: err.response?.data?.message || err.message,
        });
        // Token is invalid, remove it
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, []);

  if (isValidating) {
    // Show loading state while validating token
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;
