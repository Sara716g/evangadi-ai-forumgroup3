import { StatusCodes } from 'http-status-codes';
import { toggleAnswerVoteService } from '../service/answerVote.service.js';

export const toggleAnswerVoteController = async (req, res, next) => {
  try {
    const { answerId } = req.params;
    const userId = req.user.id;

    const result = await toggleAnswerVoteService({
      answerId: Number(answerId),
      userId,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
