import { StatusCodes } from 'http-status-codes';
import {
  createQuestionWithVectorService,
  getQuestionsService,
  getSingleQuestionService,
  searchQuestionsSemanticService,
  getSimilarQuestionsService,
  generateQuestionDraftCoachService,
  assessAnswerAgainstQuestionService,
} from '../service/question.service.js';

export const createQuestionController = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;

    const question = await createQuestionWithVectorService({
      userId,
      title,
      content,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Question posted successfully.',
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

export const generateQuestionDraftCoachController = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    const result = await generateQuestionDraftCoachService({ title, content });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Draft suggestions generated',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const assessAnswerAgainstQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const { answerText } = req.body;

    const result = await assessAnswerAgainstQuestionService({
      questionHash,
      answerText,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Answer fit assessed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getQuestionsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search, mine } = req.query;

    const data = await getQuestionsService({
      userId,
      search,
      mine,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Questions fetched successfully.',
      data,
      meta: {
        limit: data.length,
        total: data.length,
        sortBy: 'newest',
        sortOrder: 'desc',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;

    const result = await getSingleQuestionService({
      questionHash,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Question fetched successfully',
      question: result.question,
      answers: result.answers,
      answersMeta: result.answersMeta,
    });
  } catch (error) {
    next(error);
  }
};

export const searchQuestionsController = async (req, res, next) => {
  try {
    const { query: searchQuery, k, threshold } = req.query;

    const result = await searchQuestionsSemanticService({
      query: searchQuery,
      k,
      threshold,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Semantic search completed successfully',
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

export const getSimilarQuestionsController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const { k, threshold } = req.query;

    const result = await getSimilarQuestionsService({
      questionHash,
      k,
      threshold,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Similar questions fetched successfully',
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};