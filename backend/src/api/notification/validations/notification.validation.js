import { param, body } from 'express-validator';

export const notificationIdParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Notification ID must be a valid integer.')
    .toInt(),
];

export const createNotificationValidation = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('userId must be a valid integer.')
    .toInt(),
  body('type')
    .trim()
    .notEmpty()
    .withMessage('Type is required.'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required.'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required.'),
];
