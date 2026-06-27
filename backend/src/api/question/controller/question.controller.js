import { StatusCodes } from "http-status-codes";
import {
  createQuestionWithVectorService,
  getSimilarQuestionsService,
  getSingleQuestionWithAnswersService,
  getAllQuestionsService,
} from "../service/question.service.js";

// Services
// import {
//   createQuestionWithVectorService,
//   getSimilarQuestionsService,
//   getSingleQuestionWithAnswersService,
// } from "../service/question.service.js";

/**
 * @desc Create a new question + generate vector embedding
 */
export const createQuestionController = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;

    const newQuestion = await createQuestionWithVectorService({
      title,
      content,
      userId,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Question posted successfully.",
      data: newQuestion,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get similar questions using embeddings/vector similarity
 */
export const getSimilarQuestionsController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const { k, threshold } = req.query;

    const { data, meta } = await getSimilarQuestionsService({
      questionHash,
      ...(k !== undefined ? { k: Number(k) } : {}),
      ...(threshold !== undefined ? { threshold: Number(threshold) } : {}),
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Similar questions fetched successfully",
      data,
      meta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get a single question with all of its answers (and answer attachments)
 */
export const getSingleQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;

    const question = await getSingleQuestionWithAnswersService({ questionHash });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Question fetched successfully",
      data: question,
    });
  } catch (error) {
    next(error);
  }
};
/**
 * @desc Get a list of questions, optionally filtered by search text or "mine"
 */
export const getAllQuestionsController = async (req, res, next) => {
  try {
    const { search, mine } = req.query;
    const userId = req.user?.id;

    const data = await getAllQuestionsService({
      search: search || "",
      mine: mine === "true" || mine === true,
      userId,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Questions fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};