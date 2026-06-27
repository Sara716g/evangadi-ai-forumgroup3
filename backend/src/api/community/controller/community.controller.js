import { fetchExternalForumSearch } from '../service/community.service.js';

export const getExternalSearch = async (req, res, next) => {
  try {
    // Support both 'query' (from spec) and 'q' (from user's draft)
    const query = req.query.query || req.query.q;
    const forum = req.query.forum || 'stackoverflow';
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 8;

    // Validation check: query parameter must exist and be at least 3 characters long
    if (!query || query.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Search query parameter 'query' is required and must be at least 3 characters long."
      });
    }

    const results = await fetchExternalForumSearch(query.trim(), forum, limit);

    // Format response exactly to match Milestone 4 documentation spec
    return res.status(200).json({
      success: true,
      forum: forum.toLowerCase(),
      questions: results
    });

  } catch (error) {
    next(error); // Passes unexpected errors down to central error-handler middleware
  }
};