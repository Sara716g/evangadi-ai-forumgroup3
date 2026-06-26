import { safeExecute } from '../../../../db/config.js';
import { NotFoundError } from '../../../utils/errors/index.js';

export const getNotificationsByUserId = async (userId) => {
  const sql = `
    SELECT notification_id, user_id, type, title, message, link, is_read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `;
  return safeExecute(sql, [userId]);
};

export const getUnreadCount = async (userId) => {
  const sql = 'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE';
  const rows = await safeExecute(sql, [userId]);
  return rows[0].count;
};

export const createNotification = async ({ userId, type, title, message, link }) => {
  const sql = 'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)';
  const result = await safeExecute(sql, [userId, type, title, message, link || null]);
  return { notificationId: result.insertId };
};

export const markAsRead = async (notificationId, userId) => {
  const sql = 'UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?';
  const result = await safeExecute(sql, [notificationId, userId]);

  if (result.affectedRows === 0) {
    throw new NotFoundError('Notification not found.');
  }

  return { notificationId };
};

export const markAllAsRead = async (userId) => {
  const sql = 'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE';
  await safeExecute(sql, [userId]);
  return { success: true };
};

export const deleteNotification = async (notificationId, userId) => {
  const sql = 'DELETE FROM notifications WHERE notification_id = ? AND user_id = ?';
  const result = await safeExecute(sql, [notificationId, userId]);

  if (result.affectedRows === 0) {
    throw new NotFoundError('Notification not found.');
  }

  return { notificationId };
};
