import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../../services/notification.service.js";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const data = await notificationService.list();
        const payload = data.data || data;
        const list = payload.notifications || [];

        // TEMP EBUG — check your browser console after reloav keyng this page.
        // Look at whether each item has a real "link" value or not.
        console.log("notif payload:", list);

        setNotifications(list);
      } catch (e) {
        console.log("notifications load error:", e);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  function handleClick(notification) {
    // Mark as read first (best effort, ignore failure)
    if (notification.notification_id && !notification.is_read) {
      notificationService
        .markAsRead(notification.notification_id)
        .catch(() => {});
    }

    if (notification.link) {
      navigate(notification.link);
    } else {
      console.log("This notification has no link field:", notification);
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Notifications
      </h2>
      <p style={{ color: "#888", marginBottom: 24 }}>
        Stay updated with activity on your questions and answers.
      </p>

      {isLoading ? (
        <p style={{ color: "#888" }}>Loading...</p>
      ) : notifications.length === 0 ? (
        <p style={{ color: "#888" }}>No notifications yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {notifications.map((n) => (
            <div
              key={n.notification_id}
              onClick={() => handleClick(n)}
              style={{
                background: "#fff",
                border: "1px solid #e8e8e8",
                borderRadius: 8,
                padding: "16px 20px",
                cursor: n.link ? "pointer" : "default",
                borderLeft: n.is_read
                  ? "1px solid #e8e8e8"
                  : "4px solid #e67e22",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {n.title || "New Answer"}
              </div>
              <div style={{ color: "#555", fontSize: 14, marginTop: 4 }}>
                {n.message || "Someone answered your question."}
              </div>
              <div style={{ color: "#aaa", fontSize: 12, marginTop: 8 }}>
                {n.created_at
                  ? new Date(n.created_at).toLocaleDateString()
                  : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
