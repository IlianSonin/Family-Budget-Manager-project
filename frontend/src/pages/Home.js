import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";

function Home() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // ⛔ אין טוקן → לא פונים לשרת
    if (!token) {
      navigate("/login");
      return;
    }

    api
      .get("/auth/me")
      .then((res) => {
        if (!res.data.familyId) {
          navigate("/family");
        }
      })
      .catch(() => {
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
