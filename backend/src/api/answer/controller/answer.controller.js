/**
 * @file Answer controller.
 *
 * Handles HTTP request/response for answer CRUD, attachment streaming,
 * and attachment deletion. Delegates business logic to the service layer.
 */

import { StatusCodes } from 'http-status-codes';
import {
  createAnswerService,
  deleteAnswerAttachmentService,
  getAnswerAttachmentFileService,
  getAnswersService,
  getUserAnswersService,
} from '../service/answer.service.js';

/** POST / — Create an answer with optional file attachments. */
export const createAnswerController = async (req, res, next) => {
  try {
    const { questionId, content } = req.body;
    const userId = req.user.id;
    const files = req.files || [];

    const answer = await createAnswerService({
      userId,
      questionId,
      content,
      files,
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

/** GET / — List answers, optionally filtered by questionId or userId. */
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

/** GET /attachments/:attachmentId — Stream an attachment file (image/PDF). */
export const getAnswerAttachmentFileController = async (req, res, next) => {
  try {
    const attachmentId = Number(req.params.attachmentId);

    const { filePath, mimeType, originalName } = await getAnswerAttachmentFileService({
      attachmentId,
    });

    res.type(mimeType);
    // Images render inline; PDFs default to inline preview too, but keep the
    // original filename so a "download" still saves something sensible.
    res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

/** DELETE /attachments/:attachmentId — Remove an attachment (author only). */
export const deleteAnswerAttachmentController = async (req, res, next) => {
  try {
    const attachmentId = Number(req.params.attachmentId);
    const userId = req.user.id;

    const result = await deleteAnswerAttachmentService({ attachmentId, userId });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Attachment removed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};