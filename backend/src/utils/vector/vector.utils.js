/**
 * Normalize embedding values stored as JSON in MySQL.
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
 * Cosine similarity: cos(a,b) = (a·b) / (||a|| × ||b||)
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
