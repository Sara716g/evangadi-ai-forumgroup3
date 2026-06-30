/**
 * @file Notification API routes.
 *
 * CRUD for user notifications (create, list, mark-read, delete).
 * All routes require JWT authentication.
 */

import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';
import {
  notificationIdParamValidation,
  createNotificationValidation,
} from '../validations/notification.validation.js';
import {
  getNotificationsController,
  createNotificationController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController,
} from '../controller/notification.controller.js';

const router = express.Router();

/** Require authentication for all notification routes. */
router.use(authenticateUser);

/** GET / — List all notifications for the authenticated user. */
router.get('/', getNotificationsController);

/** POST / — Create a new notification (used internally by other services). */
router.post('/', createNotificationValidation, validationErrorHandler, createNotificationController);

/** PUT /read-all — Mark all unread notifications as read. */
router.put('/read-all', markAllAsReadController);

/** PUT /:id/read — Mark a single notification as read. */
router.put('/:id/read', notificationIdParamValidation, validationErrorHandler, markAsReadController);

/** DELETE /:id — Delete a notification. */
router.delete('/:id', notificationIdParamValidation, validationErrorHandler, deleteNotificationController);

export default router;
