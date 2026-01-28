import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

function JoinFamily() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleJoin = async () => {
    setError("");

    if (!name || !password) {
      setError("Please fill all fields");
      return;
    }

    try {
      await api.post("/family/join", {
        name,
        password,
      });

      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join family");
    }
  };

  return (
    <div>
      <h2>Join Family</h2>

      <input
        placeholder="Family name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="password"
        placeholder="Family password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleJoin}>Join</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default JoinFamily;
