import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Inbox } from 'lucide-react';
import { notificationService } from '../../services/notification.service.js';
import styles from './Notifications.module.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setIsLoading(true);
      const data = await notificationService.list();
      const payload = data.data || data;
      setNotifications(payload.notifications || []);
      setUnreadCount(payload.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMarkAsRead(id) {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }

  async function handleDelete(id) {
    try {
      await notificationService.delete(id);
      const deleted = notifications.find((n) => n.notification_id === id);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
      if (deleted && !deleted.is_read) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Notifications</h1>
          <p className={styles.pageSubtitle}>
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className={styles.markAllBtn}
            onClick={handleMarkAllAsRead}
          >
            <Check size={16} />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className={styles.loadingState}>
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className={styles.emptyState}>
          <Inbox size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No notifications</h3>
          <p className={styles.emptyMessage}>
            When someone interacts with your questions or answers, you will see notifications here.
          </p>
        </div>
      ) : (
        <div className={styles.notificationList}>
          {notifications.map((notification) => (
            <div
              key={notification.notification_id}
              className={`${styles.notificationCard} ${
                !notification.is_read ? styles.unread : ''
              }`}
            >
              <div className={styles.notificationContent}>
                <div className={styles.notificationHeader}>
                  <Bell size={16} className={styles.notificationIcon} />
                  <h3 className={styles.notificationTitle}>{notification.title}</h3>
                </div>
                <p className={styles.notificationMessage}>{notification.message}</p>
                <span className={styles.notificationTime}>
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </div>
              <div className={styles.notificationActions}>
                {!notification.is_read && (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => handleMarkAsRead(notification.notification_id)}
                    title="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => handleDelete(notification.notification_id)}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
