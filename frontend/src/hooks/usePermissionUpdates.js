import { useEffect, useCallback, useContext, useRef } from "react";
import api from "../services/api";
import { NotificationContext } from "../context/NotificationContext";

export function usePermissionUpdates(onUpdate) {
  const { addNotification } = useContext(NotificationContext);
  const lastCountRef = useRef(0);

  const checkForUpdates = useCallback(async () => {
    try {
      const res = await api.get("/permission/pending");
      const currentCount = res.data.length;

      // If there are new requests, show notification
      if (currentCount > lastCountRef.current) {
        const newRequests = currentCount - lastCountRef.current;
        addNotification(
          `🔔 You have ${newRequests} new edit request${newRequests > 1 ? "s" : ""}!`,
          "info",
          5000,
        );
      }

      lastCountRef.current = currentCount;

      if (onUpdate) {
        onUpdate(res.data);
      }
    } catch (err) {
      console.error("Failed to check permission updates:", err);
    }
  }, [onUpdate, addNotification]);

  useEffect(() => {
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 3000);
    return () => clearInterval(interval);
  }, [checkForUpdates]);
}
