import { apiClient } from '../core/api.client.js';

/**
 * Connects with the Express backend to query external forum data.
 * @param {string} query - The search text string (must be >= 3 characters)
 * @returns {Promise<Array>} - Resolves to an array of formatted query matches
 */
export const externalForumSearch = async (query) => {
  try {
    const response = await apiClient.get('/api/community/external', {
      params: { q: query }
    });

    // Looks safely at your endpoint response structure: { success, questions }
    return response.data?.questions || [];
  } catch (error) {
    console.error("Error in externalForumSearch service:", error);
    throw error.response?.data?.message || "Something went wrong while scanning the community forums.";
  }
};