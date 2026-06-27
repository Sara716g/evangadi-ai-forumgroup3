import { StatusCodes } from 'http-status-codes';
import {
  createAnswerService,
  deleteAnswerAttachmentService,
  getAnswerAttachmentFileService,
} from '../service/answer.service.js';

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