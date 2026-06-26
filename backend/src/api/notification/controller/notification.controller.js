import { StatusCodes } from 'http-status-codes';
import * as notificationService from '../service/notification.service.js';

export const getNotificationsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifications = await notificationService.getNotificationsByUserId(userId);
    const unreadCount = await notificationService.getUnreadCount(userId);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Notifications fetched successfully.',
      data: { notifications, unreadCount },
    });
  } catch (error) {
    next(error);
  }
};

export const createNotificationController = async (req, res, next) => {
  try {
    const { userId, type, title, message, link } = req.body;
    const result = await notificationService.createNotification({ userId, type, title, message, link });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Notification created successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsReadController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    const result = await notificationService.markAsRead(notificationId, userId);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Notification marked as read.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsReadController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.markAllAsRead(userId);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'All notifications marked as read.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotificationController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    const result = await notificationService.deleteNotification(notificationId, userId);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Notification deleted successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
