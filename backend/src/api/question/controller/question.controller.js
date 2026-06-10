import { StatusCodes } from "http-status-codes";
import { getSimilarQuestionsService } from "../service/question.service.js";

// Controller: Handles HTTP requests for finding similar questions
export const getSimilarQuestionsController = async (req, res, next) => {
  try {
    // Extract required path param and optional query parameters
    const { questionHash } = req.params;
    const { k, threshold } = req.query;

    // Call service layer; conditionally inject k and threshold only if provided
    const { data, meta } = await getSimilarQuestionsService({
      questionHash,
      ...(k !== undefined ? { k: Number(k) } : {}),
      ...(threshold !== undefined ? { threshold: Number(threshold) } : {}),
    });

    // Send 200 OK with the fetched data and metadata
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Similar questions fetched successfully",
      data,
      meta,
    });
  } catch (error) {
    // Forward any caught errors to the global error handler
    next(error);
  }
};
