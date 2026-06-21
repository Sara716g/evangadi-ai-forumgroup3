import { BadRequestError } from "../../../utils/errors/index.js";

export const parseDocumentIdParam = (req, res, next) => {
  const documentId = Number(req.params.documentId);

  if (!Number.isInteger(documentId) || documentId <= 0) {
    return next(new BadRequestError("A valid document ID is required."));
  }

  req.params.documentId = documentId;
  return next();
};

export const validateSearchQuery = (req, res, next) => {
  const query = req.query.query?.trim();

  if (!query) {
    return next(new BadRequestError("Search query is required."));
  }

  req.query.query = query;
  return next();
};

export const validateQueryBody = (req, res, next) => {
  const query = req.body?.query?.trim();

  if (!query) {
    return next(new BadRequestError("Query is required."));
  }

  req.body.query = query;
  return next();
};
