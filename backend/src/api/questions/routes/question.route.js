import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { searchQuestionsSemanticValidation } from '../validations/question.validation.js';
import { searchQuestionsSemanticController } from '../controller/question.controller.js';

const router = express.Router();

/**
 * @openapi
 * /api/questions/search:
 *   get:
 *     summary: Search questions using semantic similarity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 5
 *       - in: query
 *         name: k
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *       - in: query
 *         name: threshold
 *         required: false
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *     responses:
 *       '200':
 *         description: Semantic search completed successfully
 */
router.get(
  '/search',
  authenticateUser,
  searchQuestionsSemanticValidation,
  searchQuestionsSemanticController,
);

export default router;
