import * as ragService from "../service/rag.service.js";

export const searchInDocumentController = async (req, res, next) => {
  try {
    const documentId = Number(req.params.documentId);
    const userId = req.user.id;
    const query = req.query.query;
    const k = Number(req.query.k || 5);

    const results = await ragService.searchInDocumentService(
      documentId,
      userId,
      query,
      k
    );

    return res.status(200).json({
      success: true,
      message: "Ranked chunk excerpts",
      data: {
        query,
        results,
      },
    });
  } catch (error) {
    next(error);
  }
};