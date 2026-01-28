import { useNavigate } from "react-router-dom";

function FamilyChoice() {
  const navigate = useNavigate();

  return (
    <div>
      <h2>Family Setup</h2>
      <button onClick={() => navigate("/family/create")}>
        Create Family
      </button>
      <button onClick={() => navigate("/family/join")}>
        Join Family
      </button>
    </div>
  );
}

export default FamilyChoice;
