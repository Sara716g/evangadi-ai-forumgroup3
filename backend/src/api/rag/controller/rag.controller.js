import { StatusCodes } from 'http-status-codes';
import {
  createDocumentFromUploadService,
  deleteDocumentService,
  getDocumentFileService,
  getDocumentMetaService,
  listDocumentsForUserService,
  queryDocumentService,
  searchInDocumentService,
} from '../service/rag.service.js';

export const createDocumentController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    const document = await createDocumentFromUploadService({ userId, file });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Document uploaded and processed.',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const listDocumentsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documents = await listDocumentsForUserService({ userId });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Documents fetched successfully.',
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentMetaController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = Number(req.params.documentId);

    const document = await getDocumentMetaService({ documentId, userId });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document fetched successfully.',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentFileController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = Number(req.params.documentId);

    const { filePath, mimeType } = await getDocumentFileService({ documentId, userId });

    res.type(mimeType);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

export const deleteDocumentController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = Number(req.params.documentId);

    const result = await deleteDocumentService({ documentId, userId });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document deleted successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const searchInDocumentController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = Number(req.params.documentId);
    const query = req.query.query;
    const k = req.query.k;

    const result = await searchInDocumentService({
      userId,
      documentId,
      query,
      k,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Ranked chunk excerpts',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const queryDocumentController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = Number(req.params.documentId);
    const query = req.body.query;

    const result = await queryDocumentService({
      userId,
      documentId,
      query,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Answer and citations',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
