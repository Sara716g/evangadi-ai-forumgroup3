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
  const sql =
    'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE';
  const rows = await safeExecute(sql, [userId]);
  return rows[0].count;
};

// Creates a notification row. Called from other modules (e.g. answer.service.js)
// whenever something notification-worthy happens (new answer, answer seen, etc).
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  link,
}) => {
  const sql = `
    INSERT INTO notifications (user_id, type, title, message, link, is_read)
    VALUES (?, ?, ?, ?, ?, FALSE)
  `;
  const result = await safeExecute(sql, [userId, type, title, message, link]);
  return {
    id: result.insertId,
    userId,
    type,
    title,
    message,
    link,
    isRead: false,
  };
};

// Creates OR groups a "new_answer" notification for the asker.
//
// Behavior:
// - If the asker has no unread "new_answer" notification for this question yet,
//   a new notification row is created with count = 1.
// - If they already have one unread "new_answer" notification for this question,
//   that SAME row is updated instead of creating a new one: the count goes up
//   by 1, the message becomes "N people answered your question.", and the link
//   is updated to point at the newest answer.
export const groupNewAnswerNotification = async ({
  userId,
  questionId,
  questionHash,
  answerId,
}) => {
  const link = `/question/${questionHash}#answer-${answerId}`;

  const existingSql = `
    SELECT notification_id, message
    FROM notifications
    WHERE user_id = ?
      AND type = 'new_answer'
      AND is_read = FALSE
      AND link LIKE ?
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const likePattern = `/question/${questionHash}#answer-%`;
  const existingRows = await safeExecute(existingSql, [userId, likePattern]);

  if (existingRows.length === 0) {
    return createNotification({
      userId,
      type: 'new_answer',
      title: 'New Answer',
      message: 'Someone answered your question.',
      link,
    });
  }

  const existing = existingRows[0];
  const match = existing.message.match(/^(\d+)\s+people/);
  const previousCount = match ? Number(match[1]) : 1;
  const newCount = previousCount + 1;

  const newMessage =
    newCount === 1
      ? 'Someone answered your question.'
      : `${newCount} people answered your question.`;

  const updateSql = `
    UPDATE notifications
    SET message = ?, link = ?, created_at = NOW()
    WHERE notification_id = ?
  `;
  await safeExecute(updateSql, [newMessage, link, existing.notification_id]);

  return {
    id: existing.notification_id,
    userId,
    type: 'new_answer',
    title: 'New Answer',
    message: newMessage,
    link,
    isRead: false,
    grouped: true,
    count: newCount,
  };
};

// Records that an answer's author should be told their answer was seen by the asker.
// Guards against duplicate notifications: only fires once per (answer, viewer) pair,
// and never fires if the viewer is the answer's own author.
export const notifyAnswerSeen = async ({
  answerId,
  answererId,
  viewerId,
  viewerName,
  questionHash,
}) => {
  if (answererId === viewerId) {
    return null;
  }

  const existingSql = `
    SELECT notification_id FROM notifications
    WHERE type = 'answer_seen' AND link = ? AND user_id = ?
  `;
  const link = `/question/${questionHash}#answer-${answerId}`;

  const existing = await safeExecute(existingSql, [link, answererId]);

  if (existing.length > 0) {
    return null;
  }

  return createNotification({
    userId: answererId,
    type: 'answer_seen',
    title: 'Answer Seen',
    message: `${viewerName} saw your answer.`,
    link,
  });
};

// Marks a single notification as read, only if it belongs to this user.
export const markAsRead = async (notificationId, userId) => {
  const checkSql =
    'SELECT notification_id FROM notifications WHERE notification_id = ? AND user_id = ?';
  const rows = await safeExecute(checkSql, [notificationId, userId]);
  if (rows.length === 0) {
    throw new NotFoundError('Notification not found.');
  }

  const updateSql =
    'UPDATE notifications SET is_read = TRUE WHERE notification_id = ?';
  await safeExecute(updateSql, [notificationId]);
  return { id: notificationId, isRead: true };
};

// Marks every notification belonging to this user as read.
export const markAllAsRead = async (userId) => {
  const sql =
    'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE';
  await safeExecute(sql, [userId]);
  return { success: true };
};

// Deletes a notification, only if it belongs to this user.
export const deleteNotification = async (notificationId, userId) => {
  const checkSql =
    'SELECT notification_id FROM notifications WHERE notification_id = ? AND user_id = ?';
  const rows = await safeExecute(checkSql, [notificationId, userId]);
  if (rows.length === 0) {
    throw new NotFoundError('Notification not found.');
  }

  const deleteSql = 'DELETE FROM notifications WHERE notification_id = ?';
  await safeExecute(deleteSql, [notificationId]);
  return { id: notificationId, deleted: true };
};
