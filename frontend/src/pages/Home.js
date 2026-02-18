import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";

function Home() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    console.log("🏠 Home: Checking authentication", {
      hasToken: !!token,
      token: token ? `${token.substring(0, 20)}...` : "none",
    });

    // ⛔ אין טוקן → לא פונים לשרת
    if (!token) {
      console.log("🚫 Home: No token, redirecting to login");
      navigate("/login");
      return;
    }

    console.log("🔐 Home: Calling /auth/me");
    api
      .get("/auth/me")
      .then((res) => {
        console.log("✅ Home: /auth/me success", {
          userId: res.data._id,
          hasFamily: !!res.data.familyId,
          familyId: res.data.familyId,
        });
        if (!res.data.familyId) {
          console.log("👨‍👩‍👧‍👦 Home: No family, redirecting to /family");
          navigate("/family");
        } else {
          console.log("✅ Home: User has family, showing dashboard");
        }
      })
      .catch((err) => {
        console.log("❌ Home: /auth/me failed", {
          status: err.response?.status,
          message: err.response?.data?.message || err.message,
        });
        // טוקן לא תקף / פג תוקף
        localStorage.removeItem("token");
        navigate("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  if (loading) return <p>Loading...</p>;

  return <Dashboard />;
}

export default Home;
