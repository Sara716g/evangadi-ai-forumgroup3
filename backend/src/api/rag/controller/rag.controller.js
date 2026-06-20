import { validationResult } from "express-validator";
import { getDocumentMetaService } from "../service/rag.service.js";

/**
 * GET /api/rag/documents/:documentId
 *
 * Returns metadata for a single RAG document owned by the
 * authenticated user.
 */
export const getDocumentMetaController = async (req, res) => {
  // 1. Validate params
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array(),
    });
  }

  const documentId = req.params.documentId; // already cast to int by validator
  const userId = req.user.id; // set by your auth middleware

  try {
    // 2. Fetch & verify ownership
    const data = await getDocumentMetaService(documentId, userId);

    // 3. Return formatted metadata
    return res.status(200).json({
      success: true,
      message: "Document fetched successfully.",
      data,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: err.message || "Internal server error.",
    });
  }
};
