import { useEffect, useState, useContext, useRef, useCallback } from "react";
import api from "../services/api";
import { NotificationContext } from "../context/NotificationContext";

function PermissionRequests() {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("incoming");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const { addNotification } = useContext(NotificationContext);
  const lastIncomingCountRef = useRef(0);
  const lastMyCountRef = useRef(0);

  const loadRequests = useCallback(async () => {
    try {
      const [incomingRes, myRes] = await Promise.all([
        api.get("/permission/pending"),
        api.get("/permission/my-requests"),
      ]);

      // Check for new incoming requests
      if (incomingRes.data.length > lastIncomingCountRef.current) {
        const newCount = incomingRes.data.length - lastIncomingCountRef.current;
        addNotification(
          `${newCount} new edit request${newCount > 1 ? "s" : ""}!`,
          "info",
          5000,
        );
      }

      // Check for status changes in my requests
      const prevApproved = myRequests.filter(
        (r) => r.status === "approved",
      ).length;
      const newApproved = myRes.data.filter(
        (r) => r.status === "approved",
      ).length;
      if (newApproved > prevApproved) {
        addNotification(
          "One of your permission requests was approved!",
          "success",
          5000,
        );
      }

      const prevRejected = myRequests.filter(
        (r) => r.status === "rejected",
      ).length;
      const newRejected = myRes.data.filter(
        (r) => r.status === "rejected",
      ).length;
      if (newRejected > prevRejected) {
        addNotification(
          "One of your permission requests was rejected.",
          "warning",
          5000,
        );
      }

      lastIncomingCountRef.current = incomingRes.data.length;
      lastMyCountRef.current = myRes.data.length;

      setIncomingRequests(incomingRes.data);
      setMyRequests(myRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [myRequests, addNotification]);

  const loadMessages = useCallback(async (permissionId) => {
    try {
      const res = await api.get("/message/permission", {
        params: { permissionId },
      });
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    // Set up polling: check requests every 3 seconds, messages every 2 seconds if selected
    const requestInterval = setInterval(loadRequests, 3000);

    return () => clearInterval(requestInterval);
  }, [loadRequests]);

  useEffect(() => {
    if (selectedRequest) {
      loadMessages(selectedRequest._id);
      const messageInterval = setInterval(() => {
        loadMessages(selectedRequest._id);
      }, 2000);
      return () => clearInterval(messageInterval);
    }
  }, [selectedRequest, loadMessages]);

  const handleApprove = async (permissionId) => {
    try {
      await api.post("/permission/approve", { permissionId });
      addNotification("✅ Permission approved!", "success", 3000);
      loadRequests();
      setSelectedRequest(null);
    } catch (err) {
      addNotification(
        err.response?.data?.message || "Failed to approve",
        "error",
      );
    }
  };

  const handleReject = async (permissionId) => {
    try {
      await api.post("/permission/reject", { permissionId });
      addNotification("❌ Permission rejected!", "info", 3000);
      loadRequests();
      setSelectedRequest(null);
    } catch (err) {
      addNotification(
        err.response?.data?.message || "Failed to reject",
        "error",
      );
    }
  };

  const handleSendMessage = async (permissionId, recipientId) => {
    if (!newMessage.trim()) return;

    try {
      await api.post("/message/send", {
        recipientId,
        permissionId,
        content: newMessage,
      });
      setNewMessage("");
      addNotification("Message sent!", "success", 2000);
      loadMessages(permissionId);
    } catch (err) {
      addNotification(
        err.response?.data?.message || "Failed to send message",
        "error",
      );
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: "#1e88e5", marginBottom: 8 }}>
            Edit Permission Requests
          </h1>
          <p style={{ color: "#757575" }}>
            Manage requests to edit family budget items
          </p>
        </div>

        {selectedRequest ? (
          <div
            className="card"
            style={{ boxShadow: "0 8px 32px rgba(30, 136, 229, 0.2)" }}
          >
            <div className="card-header" style={{ marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>
                Request from {selectedRequest.requestedBy?.name || "Unknown"}
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#999",
                  padding: 0,
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                padding: 16,
                borderRadius: 8,
                marginBottom: 20,
                borderLeft: "4px solid #1e88e5",
              }}
            >
              <h4 style={{ marginTop: 0, marginBottom: 8, color: "#1e88e5" }}>
                Item Details
              </h4>
              <p style={{ marginBottom: 8 }}>
                <strong>Category:</strong>{" "}
                {selectedRequest.budgetItemId?.category}
              </p>
              <p style={{ marginBottom: 8 }}>
                <strong>Amount:</strong> ₪{selectedRequest.budgetItemId?.amount}
              </p>
              <p style={{ marginBottom: 0 }}>
                <strong>Type:</strong>{" "}
                {selectedRequest.budgetItemId?.type === "income"
                  ? "Income"
                  : "Expense"}
              </p>
              {selectedRequest.reason && (
                <p
                  style={{
                    marginTop: 12,
                    padding: 12,
                    background: "#ffffff",
                    borderRadius: 6,
                    borderLeft: "3px solid #ff9800",
                  }}
                >
                  <strong>Reason:</strong> {selectedRequest.reason}
                </p>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ marginBottom: 12, color: "#212121" }}>Messages</h4>
              {messages.length === 0 ? (
                <p style={{ textAlign: "center", color: "#999", padding: 20 }}>
                  No messages yet. Start the conversation!
                </p>
              ) : (
                <div
                  style={{
                    background: "#f5f5f5",
                    borderRadius: 8,
                    padding: 12,
                    maxHeight: 300,
                    overflowY: "auto",
                    marginBottom: 12,
                  }}
                >
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      style={{
                        marginBottom: 12,
                        padding: 12,
                        backgroundColor: "#ffffff",
                        borderRadius: 6,
                        borderLeft: "4px solid #1e88e5",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontWeight: 600,
                          color: "#212121",
                        }}
                      >
                        {msg.senderId?.name || "Unknown"}
                      </p>
                      <p style={{ margin: 0, color: "#555", lineHeight: 1.5 }}>
                        {msg.content}
                      </p>
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: 11,
                          color: "#999",
                        }}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <textarea
                  placeholder="Send a message to discuss this request..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 8,
                    border: "2px solid #bbdefb",
                    fontFamily: "inherit",
                    fontSize: 14,
                    minHeight: 70,
                    resize: "vertical",
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    handleSendMessage(
                      selectedRequest._id,
                      selectedRequest.requestedBy._id,
                    )
                  }
                  style={{ width: "100%" }}
                >
                  Send Message
                </button>
              </div>
            </div>

            {tab === "incoming" && (
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  className="btn btn-success"
                  onClick={() => handleApprove(selectedRequest._id)}
                  style={{ flex: 1 }}
                >
                  Approve
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleReject(selectedRequest._id)}
                  style={{ flex: 1 }}
                >
                  Reject
                </button>
              </div>
            )}

            <button
              className="btn btn-secondary"
              onClick={() => setSelectedRequest(null)}
              style={{ width: "100%", marginTop: 12 }}
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 24,
                borderBottom: "2px solid #eeeeee",
                paddingBottom: 12,
              }}
            >
              <button
                onClick={() => setTab("incoming")}
                className="btn"
                style={{
                  background:
                    tab === "incoming"
                      ? "linear-gradient(135deg, #1e88e5 0%, #64b5f6 100%)"
                      : "#f5f5f5",
                  color: tab === "incoming" ? "#fff" : "#212121",
                  fontSize: "1rem",
                  padding: "10px 20px",
                }}
              >
                Requests For My Items ({incomingRequests.length})
              </button>
              <button
                onClick={() => setTab("my")}
                className="btn"
                style={{
                  background:
                    tab === "my"
                      ? "linear-gradient(135deg, #1e88e5 0%, #64b5f6 100%)"
                      : "#f5f5f5",
                  color: tab === "my" ? "#fff" : "#212121",
                  fontSize: "1rem",
                  padding: "10px 20px",
                }}
              >
                My Requests ({myRequests.length})
              </button>
            </div>

            {tab === "incoming" && (
              <div>
                <h3 style={{ marginBottom: 20, color: "#212121" }}>
                  Requests For Your Items
                </h3>
                {incomingRequests.length === 0 ? (
                  <div className="card" style={{ textAlign: "center" }}>
                    <p style={{ color: "#999", marginBottom: 0 }}>
                      No pending requests
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {incomingRequests.map((req) => (
                      <div
                        key={req._id}
                        onClick={() => setSelectedRequest(req)}
                        className="card"
                        style={{
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "translateY(-2px)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "translateY(0)")
                        }
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "start",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <h4 style={{ marginBottom: 8 }}>
                              {req.requestedBy?.name || "Unknown User"}
                            </h4>
                            <p style={{ marginBottom: 8, color: "#757575" }}>
                              Wants to edit:{" "}
                              <strong>{req.budgetItemId?.category}</strong> — ₪
                              {req.budgetItemId?.amount}
                            </p>
                            <p
                              style={{
                                marginBottom: 0,
                                fontSize: 12,
                                color: "#999",
                              }}
                            >
                              {new Date(req.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div style={{ fontSize: 24, color: "#1e88e5" }}>
                            →
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "my" && (
              <div>
                <h3 style={{ marginBottom: 20, color: "#212121" }}>
                  My Edit Requests
                </h3>
                {myRequests.length === 0 ? (
                  <div className="card" style={{ textAlign: "center" }}>
                    <p style={{ color: "#999", marginBottom: 0 }}>
                      You haven't requested any permissions
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {myRequests.map((req) => (
                      <div
                        key={req._id}
                        onClick={() => setSelectedRequest(req)}
                        className="card"
                        style={{
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "translateY(-2px)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "translateY(0)")
                        }
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "start",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <h4 style={{ marginBottom: 8 }}>
                              Owner:{" "}
                              <strong>
                                {req.itemOwner?.name || "Unknown"}
                              </strong>
                            </h4>
                            <p style={{ marginBottom: 8, color: "#757575" }}>
                              Item:{" "}
                              <strong>{req.budgetItemId?.category}</strong> — ₪
                              {req.budgetItemId?.amount}
                            </p>
                            <p style={{ marginBottom: 0 }}>
                              Status:{" "}
                              <span
                                className={`badge badge-${req.status === "approved" ? "success" : req.status === "rejected" ? "danger" : "warning"}`}
                              >
                                {req.status.toUpperCase()}
                              </span>
                              {req.status === "approved" && req.expiresAt && (
                                <span
                                  style={{
                                    marginLeft: 8,
                                    fontSize: "0.9em",
                                    color: "#666",
                                  }}
                                >
                                  Expires:{" "}
                                  {new Date(req.expiresAt).toLocaleString()}
                                </span>
                              )}
                            </p>
                          </div>
                          <div style={{ fontSize: 24, color: "#1e88e5" }}>
                            →
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PermissionRequests;
