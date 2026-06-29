import crypto from 'crypto';

/**
 * Generates a random 16-character lowercase hex string
 */
export const generateHexString = (length = 16) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

/**
 * Normalizes an embedding vector array (optional utility step depending on database structure)
 */
export const normalizeEmbedding = (vector) => {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map(val => val / magnitude);
};

/**
 * Calculates the cosine similarity between two numerical arrays
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (
    !Array.isArray(vecA) ||
    !Array.isArray(vecB) ||
    vecA.length === 0 ||
    vecB.length === 0 ||
    vecA.length !== vecB.length
  ) {
    return 0;
  }
  
  const dotProduct = vecA.reduce((sum, val, idx) => sum + (val * vecB[idx]), 0);
  const magA = Math.sqrt(vecA.reduce((sum, val) => sum + (val * val), 0));
  const magB = Math.sqrt(vecB.reduce((sum, val) => sum + (val * val), 0));
  
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
};