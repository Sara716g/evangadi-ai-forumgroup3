import { StatusCodes } from "http-status-codes";
import {
  createAnswerService,
  deleteAnswerAttachmentService,
  getAnswerAttachmentFileService,
  getAnswersService,
  getUserAnswersService,
  markAnswerSeenService,
} from "../service/answer.service.js";

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
      message: "Answer posted successfully",
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

export const getAnswerAttachmentFileController = async (req, res, next) => {
  try {
    const attachmentId = Number(req.params.attachmentId);

    const { filePath, mimeType, originalName } =
      await getAnswerAttachmentFileService({
        attachmentId,
      });

    res.type(mimeType);
    // Images render inline; PDFs default to inline preview too, but keep the
    // original filename so a "download" still saves something sensible.
    res.setHeader("Content-Disposition", `inline; filename="${originalName}"`);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

export const deleteAnswerAttachmentController = async (req, res, next) => {
  try {
    const attachmentId = Number(req.params.attachmentId);
    const userId = req.user.id;

    const result = await deleteAnswerAttachmentService({
      attachmentId,
      userId,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Attachment removed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Called by the frontend when the asker views an answer (e.g. when the
// question detail page loads). Notifies the answer's author that their
// answer was seen.
export const markAnswerSeenController = async (req, res, next) => {
  try {
    const answerId = Number(req.params.answerId);
    const viewerId = req.user.id;

    const result = await markAnswerSeenService({ answerId, viewerId });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Answer marked as seen.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
