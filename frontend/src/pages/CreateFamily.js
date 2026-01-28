import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

function CreateFamily() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleCreate = async () => {
    await api.post("/family/create", { name });
    navigate("/home");
  };

  return (
    <div>
      <h2>Create Family</h2>
      <input
        placeholder="Family name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleCreate}>Create</button>
    </div>
  );
}

export default CreateFamily;
