import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import { getSimilarQuestionsController } from "../controller/question.controller.js";
import { getSimilarQuestionsValidation } from "../validations/question.validation.js";

// Initialize Express router for grouping related endpoints
const router = express.Router();

// Define HTTP GET route with a checkpoint pipeline (middleware chain)
router.get(
  "/:questionHash/similar", // Endpoint path with dynamic questionHash param
  authenticateUser, // Checkpoint 1: Verifies the user is logged in
  getSimilarQuestionsValidation, // Checkpoint 2: Validates incoming req.params and req.query values
  getSimilarQuestionsController, // Checkpoint 3: Executes core controller logic on valid requests
);

export default router;
