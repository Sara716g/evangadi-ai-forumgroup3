import fs from "fs";
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

export const getDocumentsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documents = await ragService.getDocumentsByUserIdService(userId);

    return res.status(200).json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
};

export const getDocumentMetaController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.documentId;
    const data = await ragService.getDocumentMetaService(documentId, userId);

    return res.status(200).json({
      success: true,
      message: "Document fetched successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocumentController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.documentId;
    const result = await ragService.deleteDocumentService(documentId, userId);

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const searchInDocumentController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.documentId;
    const query = req.query.query;
    const k = req.query.k;

    const result = await ragService.searchInDocumentService(
      documentId,
      userId,
      query,
      k,
    );

    return res.status(200).json({
      success: true,
      message: "Search results fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const queryDocumentController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.documentId;
    const query = req.body.query;

    const result = await ragService.queryDocumentService(
      documentId,
      userId,
      query,
    );

    return res.status(200).json({
      success: true,
      message: "Answer and citations",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentFileController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.documentId;
    const { absolutePath, title } = await ragService.getDocumentFilePathService(
      documentId,
      userId,
    );

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message: "Document file not found on disk.",
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${title}"`);

    return res.sendFile(absolutePath);
  } catch (error) {
    next(error);
  }
};

export const retryDocumentController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.documentId;
    const document = await ragService.retryDocumentService(documentId, userId);

    return res.status(200).json({
      success: true,
      message: "Document reprocessing started.",
      data: document,
    });
  } catch (error) {
    next(error);
  }
};
