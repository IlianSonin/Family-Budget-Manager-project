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
          `🔔 ${newCount} new edit request${newCount > 1 ? "s" : ""}!`,
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
          "✅ One of your permission requests was approved!",
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
          "❌ One of your permission requests was rejected.",
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
      addNotification("💬 Message sent!", "success", 2000);
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
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h2>Edit Permission Requests</h2>

      {selectedRequest ? (
        <div style={detailsStyle}>
          <div style={detailsHeaderStyle}>
            <h3 style={{ margin: 0 }}>
              Request from {selectedRequest.requestedBy?.name || "Unknown"}
            </h3>
            <button
              onClick={() => setSelectedRequest(null)}
              style={closeButtonStyle}
            >
              ✕
            </button>
          </div>

          <div style={itemDetailsStyle}>
            <p>
              <strong>Item:</strong> {selectedRequest.budgetItemId?.category} —
              ₪{selectedRequest.budgetItemId?.amount}
            </p>
            <p>
              <strong>Type:</strong> {selectedRequest.budgetItemId?.type}
            </p>
            {selectedRequest.reason && (
              <p
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: 8,
                  borderRadius: 4,
                }}
              >
                <strong>Reason:</strong> {selectedRequest.reason}
              </p>
            )}
          </div>

          <div style={messagesStyle}>
            <h4>Messages</h4>
            {messages.length === 0 ? (
              <p style={{ fontSize: 13, opacity: 0.7 }}>No messages yet</p>
            ) : (
              <div style={messagesListStyle}>
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    style={{
                      marginBottom: 12,
                      padding: 10,
                      backgroundColor: "#f9f9f9",
                      borderRadius: 4,
                      borderLeft: "3px solid #2196F3",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      {msg.senderId?.name || "Unknown"}
                    </p>
                    <p style={{ margin: 0, fontSize: 13 }}>{msg.content}</p>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        fontSize: 11,
                        opacity: 0.6,
                      }}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <textarea
                placeholder="Send a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={messageInputStyle}
              />
              <button
                onClick={() =>
                  handleSendMessage(
                    selectedRequest._id,
                    selectedRequest.requestedBy._id,
                  )
                }
                style={primaryButtonStyle}
              >
                Send Message
              </button>
            </div>
          </div>

          {tab === "incoming" && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => handleApprove(selectedRequest._id)}
                style={approveButtonStyle}
              >
                ✓ Approve
              </button>
              <button
                onClick={() => handleReject(selectedRequest._id)}
                style={rejectButtonStyle}
              >
                ✕ Reject
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 20, borderBottom: "2px solid #ddd" }}>
            <button
              onClick={() => setTab("incoming")}
              style={{
                padding: "10px 20px",
                marginRight: 10,
                backgroundColor: tab === "incoming" ? "#4CAF50" : "#eee",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: tab === "incoming" ? "bold" : "normal",
              }}
            >
              Requests For My Items ({incomingRequests.length})
            </button>
            <button
              onClick={() => setTab("my")}
              style={{
                padding: "10px 20px",
                backgroundColor: tab === "my" ? "#4CAF50" : "#eee",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: tab === "my" ? "bold" : "normal",
              }}
            >
              My Requests ({myRequests.length})
            </button>
          </div>

          {tab === "incoming" && (
            <div>
              <h3>Requests For Your Items</h3>
              {incomingRequests.length === 0 ? (
                <p>No pending requests</p>
              ) : (
                incomingRequests.map((req) => (
                  <div
                    key={req._id}
                    onClick={() => setSelectedRequest(req)}
                    style={requestCardStyle}
                  >
                    <div style={{ flex: 1 }}>
                      <h4>{req.requestedBy?.name || "Unknown User"}</h4>
                      <p
                        style={{ margin: "4px 0", fontSize: 14, opacity: 0.7 }}
                      >
                        Wants to edit:{" "}
                        <strong>{req.budgetItemId?.category}</strong> — ₪
                        {req.budgetItemId?.amount}
                      </p>
                      <p
                        style={{ margin: "4px 0", fontSize: 12, opacity: 0.6 }}
                      >
                        {new Date(req.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div style={{ color: "#2196F3", fontSize: 18 }}>→</div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "my" && (
            <div>
              <h3>My Edit Requests</h3>
              {myRequests.length === 0 ? (
                <p>You haven't requested any permissions</p>
              ) : (
                myRequests.map((req) => (
                  <div
                    key={req._id}
                    onClick={() => setSelectedRequest(req)}
                    style={requestCardStyle}
                  >
                    <div style={{ flex: 1 }}>
                      <h4>
                        Owner:{" "}
                        <strong>{req.itemOwner?.name || "Unknown"}</strong>
                      </h4>
                      <p
                        style={{ margin: "4px 0", fontSize: 14, opacity: 0.7 }}
                      >
                        Item: <strong>{req.budgetItemId?.category}</strong> — ₪
                        {req.budgetItemId?.amount}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: 14 }}>
                        Status:{" "}
                        <span
                          style={{
                            padding: "2px 8px",
                            backgroundColor:
                              req.status === "approved"
                                ? "#d4edda"
                                : req.status === "rejected"
                                  ? "#f8d7da"
                                  : "#fff3cd",
                            color:
                              req.status === "approved"
                                ? "#155724"
                                : req.status === "rejected"
                                  ? "#721c24"
                                  : "#856404",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: "bold",
                          }}
                        >
                          {req.status.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <div style={{ color: "#2196F3", fontSize: 18 }}>→</div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const detailsStyle = {
  backgroundColor: "#f9f9f9",
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 16,
  marginTop: 12,
};

const detailsHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
  paddingBottom: 12,
  borderBottom: "1px solid #ddd",
};

const closeButtonStyle = {
  backgroundColor: "transparent",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
  color: "#999",
  padding: 0,
};

const itemDetailsStyle = {
  backgroundColor: "white",
  padding: 12,
  borderRadius: 4,
  marginBottom: 16,
  border: "1px solid #eee",
};

const messagesStyle = {
  marginBottom: 16,
};

const messagesListStyle = {
  backgroundColor: "white",
  padding: 12,
  borderRadius: 4,
  marginBottom: 12,
  maxHeight: 300,
  overflowY: "auto",
  border: "1px solid #eee",
};

const messageInputStyle = {
  width: "100%",
  padding: 10,
  marginBottom: 8,
  borderRadius: 4,
  border: "1px solid #ddd",
  fontFamily: "inherit",
  fontSize: 13,
  height: 60,
  boxSizing: "border-box",
};

const primaryButtonStyle = {
  width: "100%",
  padding: 10,
  backgroundColor: "#2196F3",
  color: "white",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: "500",
};

const approveButtonStyle = {
  flex: 1,
  padding: 10,
  backgroundColor: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};

const rejectButtonStyle = {
  flex: 1,
  padding: 10,
  backgroundColor: "#f44336",
  color: "white",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};

const requestCardStyle = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 16,
  marginBottom: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  cursor: "pointer",
  transition: "all 0.2s",
  backgroundColor: "white",
};

export default PermissionRequests;
