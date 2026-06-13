import { StatusCodes } from 'http-status-codes';
import { generateQuestionDraftCoachService } from '../service/geminiTextCoach.service.js';

export const generateQuestionDraftCoachController = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    const result = await generateQuestionDraftCoachService({
      title,
      content,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Draft suggestions generated',
      data: result,
import { searchQuestionsSemanticService } from '../services/question.service.js';

export const searchQuestionsSemanticController = async (req, res, next) => {
  try {
    const query = String(req.query.query || '').trim();
    const k = req.query.k ?? undefined;
    const threshold = req.query.threshold ?? undefined;

    const searchResult = await searchQuestionsSemanticService({
      query,
      k,
      threshold,
    });

    return res.status(200).json({
      success: true,
      message: 'Semantic search completed successfully',
      data: searchResult.items,
      meta: {
        total: searchResult.total,
        k: searchResult.k,
        threshold: searchResult.threshold,
        query,
        questionHash: null,
      },
    });
  } catch (error) {
    next(error);
  }
};
