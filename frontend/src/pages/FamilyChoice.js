import { useNavigate } from "react-router-dom";

function FamilyChoice() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 20 }}>
      <h2>Choose Family Action</h2>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={() => navigate("/family/create")}>
          Create Family
        </button>

        <button onClick={() => navigate("/family/join")}>
          Join Family
        </button>
      </div>
    </div>
  );
}

export default FamilyChoice;
