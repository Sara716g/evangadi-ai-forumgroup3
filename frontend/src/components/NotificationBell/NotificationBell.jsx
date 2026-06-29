import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationService } from '../../services/notification.service.js';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  async function fetchNotifications() {
    try {
      const data = await notificationService.list();
      const payload = data.data || data;
      setNotifications(payload.notifications || []);
      setUnreadCount(payload.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  function handleNotificationClick(notification) {
    if (!notification.is_read) {
      handleMarkAsRead(notification.notification_id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  }

  return (
    <div className={styles.bellWrapper} ref={dropdownRef}>
      <button
        type="button"
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h4 className={styles.dropdownTitle}>Notifications</h4>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.markAllRead}
                onClick={handleMarkAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className={styles.notificationList}>
            {notifications.length === 0 ? (
              <p className={styles.emptyState}>No notifications yet.</p>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`${styles.notificationItem} ${
                    !notification.is_read ? styles.unread : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={styles.notificationContent}>
                    <p className={styles.notificationTitle}>{notification.title}</p>
                    <p className={styles.notificationMessage}>{notification.message}</p>
                    <span className={styles.notificationTime}>
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className={styles.dropdownFooter}>
              <button
                type="button"
                className={styles.viewAll}
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
