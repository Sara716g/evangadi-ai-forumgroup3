import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';
import {
  documentIdParamValidation,
  queryDocumentValidation,
  searchDocumentValidation,
} from '../validations/rag.validation.js';
import {
  createDocumentController,
  deleteDocumentController,
  getDocumentFileController,
  getDocumentMetaController,
  listDocumentsController,
  queryDocumentController,
  searchInDocumentController,
} from '../controller/rag.controller.js';
import { uploadDocument, createDocumentMulterErrorHandler } from '../rag.upload.config.js';

const router = express.Router();

router.use(authenticateUser);

router.post('/', uploadDocument.single('file'), createDocumentMulterErrorHandler, createDocumentController);
router.get('/', listDocumentsController);
router.get('/:documentId', documentIdParamValidation, validationErrorHandler, getDocumentMetaController);
router.get('/:documentId/file', documentIdParamValidation, validationErrorHandler, getDocumentFileController);
router.delete('/:documentId', documentIdParamValidation, validationErrorHandler, deleteDocumentController);
router.get('/:documentId/search', searchDocumentValidation, validationErrorHandler, searchInDocumentController);
router.post('/:documentId/query', queryDocumentValidation, validationErrorHandler, queryDocumentController);

export default router;
