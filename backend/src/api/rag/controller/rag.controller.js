import { StatusCodes } from "http-status-codes";
import { deleteDocumentService } from "../service/rag.service.js";

// Deletes a RAG document by its ID. Only the user who uploaded the document can delete it.
export const deleteDocumentController = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    await deleteDocumentService(userId, documentId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Document deleted successfully.",
      data: { id: documentId },
    });
  } catch (error) {
    next(error);
  }
};
