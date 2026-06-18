import * as ragService from "../service/rag.service.js";

export const createDocumentController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    const document = await ragService.createDocumentFromUploadService(
      file,
      userId,
    );

    const message =
      document.status === "ready"
        ? "Document uploaded and processed."
        : "Document uploaded but processing failed.";

    return res.status(201).json({
      success: true,
      message,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves list of documents for the authenticated user
 */
export const getDocumentsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documents = await ragService.getDocumentsByUserIdService(userId);
    return res.status(200).json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
};
