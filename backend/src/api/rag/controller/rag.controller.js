import { listDocumentsForUserService } from '../service/rag.service.js';

export const listDocumentsController = async (req, res, next) => {
  try {
    // req.user.id is populated by your authentication middleware
    const userId = req.user.id;

    // Fetch the sorted documents from the service
    const documents = await listDocumentsForUserService(userId);

    // Return the response in the exact format requested by the spec
    return res.status(200).json({
      success: true,
      message: "Documents fetched successfully.",
      data: documents
    });
  } catch (error) {
    // Pass any errors to your global error handler middleware
    next(error);
  }
};