/**
 * @file Admin API routes.
 *
 * Platform administration: stats, user management, content moderation.
 * All routes require JWT authentication AND admin role.
 */

import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';
import {
  paginationValidation,
  userIdParamValidation,
  updateStatusValidation,
  questionHashParamValidation,
  answerIdParamValidation,
} from '../validations/admin.validation.js';
import {
  getStatsController,
  getUsersController,
  getQuestionsController,
  updateUserStatusController,
  toggleUserRoleController,
  deleteQuestionController,
  deleteAnswerController,
} from '../controller/admin.controller.js';

const router = express.Router();

/** Authorization middleware — rejects non-admin users with 403. */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.',
    });
  }
  next();
};

/** Require authentication + admin role for all admin routes. */
router.use(authenticateUser);
router.use(requireAdmin);

router.get('/stats', getStatsController);
router.get('/users', paginationValidation, validationErrorHandler, getUsersController);
router.get('/questions', paginationValidation, validationErrorHandler, getQuestionsController);
router.put(
  '/users/:userId/status',
  userIdParamValidation,
  updateStatusValidation,
  validationErrorHandler,
  updateUserStatusController
);
router.put(
  '/users/:userId/role',
  userIdParamValidation,
  validationErrorHandler,
  toggleUserRoleController
);
router.delete(
  '/questions/:questionHash',
  questionHashParamValidation,
  validationErrorHandler,
  deleteQuestionController
);
router.delete(
  '/answers/:answerId',
  answerIdParamValidation,
  validationErrorHandler,
  deleteAnswerController
);

export default router;
