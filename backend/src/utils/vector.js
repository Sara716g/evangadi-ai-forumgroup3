// export const generateHexString = (length = 16) => {
//   const hex = '0123456789abcdef';
//   let result = '';

//   for (let i = 0; i < length; i += 1) {
//     result += hex[Math.floor(Math.random() * hex.length)];
//   }

//   return result;
// };

// export const normalizeEmbedding = embedding => {
//   if (!Array.isArray(embedding)) {
//     return [];
//   }
//   return embedding.map(value => Number(value) || 0);
// };

// export const cosineSimilarity = (a, b) => {
//   if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
//     return 0;
//   }

//   const length = Math.min(a.length, b.length);
//   let dot = 0;
//   let magnitudeA = 0;
//   let magnitudeB = 0;

//   for (let i = 0; i < length; i += 1) {
//     const x = Number(a[i]) || 0;
//     const y = Number(b[i]) || 0;
//     dot += x * y;
//     magnitudeA += x * x;
//     magnitudeB += y * y;
//   }

//   if (magnitudeA === 0 || magnitudeB === 0) {
//     return 0;
//   }

//   return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
// };

// backend/src/utils/vector.js

/**
 * Calculates the dot product of two vectors.
 */


// export const dotProduct = (vecA, vecB) => {
//   if (vecA.length !== vecB.length) {
//     throw new Error('Vectors must be of the same length to calculate dot product.');
//   }
//   return vecA.reduce((sum, val, idx) => sum + (val * vecB[idx]), 0);
// };

// /**
//  * Calculates the magnitude (Euclidean length) of a vector.
//  */
// export const magnitude = (vec) => {
//   return Math.sqrt(vec.reduce((sum, val) => sum + (val * val), 0));
// };

// /**
//  * Calculates the cosine similarity between two numerical arrays.
//  * Formula: (A · B) / (||A|| * ||B||)
//  */
// export const cosineSimilarity = (vecA, vecB) => {
//   const dot = dotProduct(vecA, vecB);
//   const magA = magnitude(vecA);
//   const magB = magnitude(vecB);
  
//   if (magA === 0 || magB === 0) {
//     return 0; // Prevent division by zero
//   }
  
//   return dot / (magA * magB);
// };


// backend/src/utils/vector.js
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