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
