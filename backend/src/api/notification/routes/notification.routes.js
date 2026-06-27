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

router.use(authenticateUser);

router.get('/', getNotificationsController);
router.post('/', createNotificationValidation, validationErrorHandler, createNotificationController);
router.put('/read-all', markAllAsReadController);
router.put('/:id/read', notificationIdParamValidation, validationErrorHandler, markAsReadController);
router.delete('/:id', notificationIdParamValidation, validationErrorHandler, deleteNotificationController);

export default router;
