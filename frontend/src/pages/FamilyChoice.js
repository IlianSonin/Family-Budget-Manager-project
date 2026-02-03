import { useNavigate } from "react-router-dom";

function FamilyChoice() {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2>Family Setup</h2>
          <p style={{ color: "#757575" }}>
            Would you like to create a new family group or join an existing one?
          </p>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
        >
          {/* Create Family Card */}
          <div
            className="card"
            style={{
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-4px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
            onClick={() => navigate("/family/create")}
          >
            <h3 style={{ marginBottom: 12 }}>Create New Family</h3>
            <p style={{ color: "#757575", marginBottom: 16 }}>
              Start a new family budget group and invite members
            </p>
            <button className="btn btn-primary" style={{ width: "100%" }}>
              Create Family
            </button>
          </div>

          {/* Join Family Card */}
          <div
            className="card"
            style={{
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-4px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
            onClick={() => navigate("/family/join")}
          >
            <div style={{ fontSize: "3rem", marginBottom: 16 }}></div>
            <p style={{ color: "#757575", marginBottom: 16 }}>
              Join an existing family group using an invitation code
            </p>
            <button className="btn btn-secondary" style={{ width: "100%" }}>
              Join Family
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FamilyChoice;
