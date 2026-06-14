// =============================================================================
// [T-11-SHARED] Vector utility helpers — shared by BOTH semantic search (T-11-SEMANTIC-SEARCH)
// and similar questions (T-11-SIMILAR-QUESTIONS) endpoints.
//
// Ownership: used by both team members working on T-11.
//   • T-11-SEMANTIC-SEARCH  →  GET /api/questions/search
//   • T-11-SIMILAR-QUESTIONS →  GET /api/questions/:questionHash/similar
// =============================================================================

/**
 * [T-11-SHARED] Normalize embedding values stored as JSON in MySQL.
 * MySQL may return embeddings as a JSON string or already-parsed array.
 *
 * @param {string|number[]} embedding - Raw embedding from the database row.
 * @returns {number[]} Parsed embedding array.
 */
export const parseEmbedding = embedding => {
  if (Array.isArray(embedding)) {
    return embedding;
  }

  if (typeof embedding === 'string') {
    return JSON.parse(embedding);
  }

  return embedding;
};

/**
 * [T-11-SHARED] Cosine similarity: cos(a,b) = (a·b) / (||a|| × ||b||)
 * Returns a value between 0 (orthogonal) and 1 (identical direction).
 *
 * @param {number[]} vectorA - First embedding vector.
 * @param {number[]} vectorB - Second embedding vector.
 * @returns {number} Cosine similarity score (0–1), or 0 on invalid input.
 */
export const cosineSimilarity = (vectorA, vectorB) => {
  if (
    !Array.isArray(vectorA) ||
    !Array.isArray(vectorB) ||
    vectorA.length === 0 ||
    vectorB.length === 0 ||
    vectorA.length !== vectorB.length
  ) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i += 1) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
};

/**
 * [T-11-SHARED] Score all vector rows against a source vector, then filter
 * by threshold, sort descending, and slice to the top-k results.
 *
 * Used by:
 *   • searchQuestionsSemanticService  (T-11-SEMANTIC-SEARCH)
 *   • getSimilarQuestionsService      (T-11-SIMILAR-QUESTIONS)
 *
 * @param {number[]} sourceVector - The reference embedding to compare against.
 * @param {Array<{question_id: number, embedding: string|number[]}>} vectorRows - DB rows from question_vectors.
 * @param {Object} options
 * @param {number} options.k - Maximum number of results to return.
 * @param {number} options.threshold - Minimum cosine similarity score to include.
 * @param {number|null} [options.excludeQuestionId=null] - question_id to exclude (used by T-11-SIMILAR-QUESTIONS).
 * @returns {Array<{questionId: number, score: number}>} Ranked matches.
 */
export const rankVectorsBySimilarity = (
  sourceVector,
  vectorRows,
  { k, threshold, excludeQuestionId = null },
) => {
  return vectorRows
    .filter(
      row =>
        excludeQuestionId === null || row.question_id !== excludeQuestionId,
    )
    .map(row => ({
      questionId: row.question_id,
      score: cosineSimilarity(sourceVector, parseEmbedding(row.embedding)),
    }))
    .filter(match => match.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
};
