import express from "express";
import { answerFitController } from "../controller/answer-fit.controller.js";
import { authenticateUser } from "../../../../src/middleware/authentication.js";

const router = express.Router();

/**
 * @route POST /api/questions/:questionId/answer-fit
 * @desc Evaluate how well a draft answer addresses a question
 * @access Private
 */
router.post("/:questionId/answer-fit", authenticateUser, answerFitController);

export default router;
