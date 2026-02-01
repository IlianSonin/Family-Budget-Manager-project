import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

function CreateFamily() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

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

    try {
      await api.post("/family/create", {
        name,
        password,
      });

      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create family");
    }
  };

  return (
    <div>
      <h2>Create Family</h2>

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

      <input
        type="password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button onClick={handleCreate}>Create</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default CreateFamily;
