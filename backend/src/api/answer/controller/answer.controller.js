import { StatusCodes } from 'http-status-codes';
import { createAnswerService, getAnswersService, getUserAnswersService } from '../service/answer.service.js';

export const createAnswerController = async (req, res, next) => {
  try {
    const { questionId, content } = req.body;
    const userId = req.user.id;

    const answer = await createAnswerService({
      userId,
      questionId,
      content,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Answer posted successfully',
      data: answer,
    });
  } catch (error) {
    next(error);
  }
};

export const getAnswersController = async (req, res, next) => {
  try {
    const { questionId, userId } = req.query;
    let answers;
    if (userId) {
      answers = await getUserAnswersService(userId);
    } else if (questionId) {
      answers = await getAnswersService(questionId);
    } else {
      answers = await getAnswersService();
    }
    res.json({ success: true, data: answers });
  } catch (error) {
    next(error);
  }
};
