import { useContext } from "react";
import { NotificationContext } from "../context/NotificationContext";

function NotificationContainer() {
  const { notifications, removeNotification } = useContext(NotificationContext);

  return (
    <div style={containerStyle}>
      {notifications.map((notif) => (
        <div
          key={notif.id}
          style={{
            ...notificationStyle,
            backgroundColor:
              notif.type === "error"
                ? "#f44336"
                : notif.type === "success"
                  ? "#4CAF50"
                  : notif.type === "warning"
                    ? "#ff9800"
                    : "#2196F3",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          <div style={{ flex: 1 }}>{notif.message}</div>
          <button
            onClick={() => removeNotification(notif.id)}
            style={closeButtonStyle}
          >
            ✕
          </button>
        </div>
      ))}
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(400px);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
}

const containerStyle = {
  position: "fixed",
  top: 16,
  right: 16,
  zIndex: 9999,
  maxWidth: 400,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const notificationStyle = {
  padding: 16,
  borderRadius: 8,
  color: "white",
  fontSize: 14,
  fontWeight: "500",
  display: "flex",
  alignItems: "center",
  gap: 12,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
};

const closeButtonStyle = {
  backgroundColor: "transparent",
  border: "none",
  color: "white",
  cursor: "pointer",
  fontSize: 18,
  padding: 0,
  lineHeight: 1,
};

export default NotificationContainer;
