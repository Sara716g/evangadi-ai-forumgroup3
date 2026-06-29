import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Inbox } from 'lucide-react';
import { notificationService } from '../../services/notification.service.js';
import styles from './Notifications.module.css';

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchNotifications() {
    try {
      setIsLoading(true);
      const data = await notificationService.list();
      const payload = data.data || data;
      const raw = payload.notifications || payload || [];
      setNotifications(raw.map((n) => ({
        id: n.notification_id || n.id,
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: n.is_read === 1 || n.is_read === true,
        createdAt: n.created_at,
      })));
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function handleMarkAsRead(id) {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }

  async function handleDelete(id) {
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }

  function handleClick(notification) {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.loadingState}><p>Loading notifications...</p></div>
      </div>
    );
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
          <button type="button" className={styles.markAllBtn} onClick={handleMarkAllRead}>
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className={styles.emptyState}>
          <Inbox size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No notifications yet</h3>
          <p className={styles.emptyMessage}>
            When someone answers your question or interacts with your posts, you'll see notifications here.
          </p>
        </div>
      ) : (
        <div className={styles.notificationList}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`${styles.notificationCard} ${!n.isRead ? styles.unread : ''}`}
              onClick={() => handleClick(n)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleClick(n)}
            >
              <div className={styles.notificationContent}>
                <div className={styles.notificationHeader}>
                  <Bell size={14} className={styles.notificationIcon} />
                  <h4 className={styles.notificationTitle}>{n.title}</h4>
                </div>
                <p className={styles.notificationMessage}>{n.message}</p>
                <span className={styles.notificationTime}>{timeAgo(n.createdAt)}</span>
              </div>
              <div className={styles.notificationActions}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
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
