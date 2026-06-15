import { GoogleGenAI } from '@google/genai';
import { ServiceUnavailableError } from '../errors/index.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * [T-11-SEMANTIC-SEARCH] Embed a search query via Gemini for vector comparison.
 * Uses RETRIEVAL_QUERY task type (search string → vector).
 *
 * @param {string} text - User search query (min 5 chars, validated upstream).
 * @returns {Promise<number[]>} Embedding vector values.
 */
export const embedSearchQuery = async text => {
  try {
    const response = await ai.models.embedContent({
      model: GEMINI_EMBEDDING_MODEL,
      contents: text,
      config: {
        taskType: 'RETRIEVAL_QUERY',
      },
    });

    const values =
      response.embeddings?.[0]?.values ?? response.embedding?.values;

    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('Gemini returned an empty embedding');
    }

    return values;
  } catch (error) {
    throw new ServiceUnavailableError(
      `Failed to generate query embedding: ${error.message}`,
    );
  }
};
