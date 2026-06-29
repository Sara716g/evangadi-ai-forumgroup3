import { StatusCodes } from 'http-status-codes';
import { getAnswerCommentsService, createAnswerCommentService } from '../service/answerComment.service.js';

export const getAnswerCommentsController = async (req, res, next) => {
  try {
    const { answerId } = req.params;

    const comments = await getAnswerCommentsService({
      answerId: Number(answerId),
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

export const createAnswerCommentController = async (req, res, next) => {
  try {
    const { answerId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const comment = await createAnswerCommentService({
      answerId: Number(answerId),
      userId,
      content,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};
