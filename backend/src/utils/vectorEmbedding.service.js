/**
 * ============================================================================
 * Cross-Domain Utility: Vector Embedding Service
 * ============================================================================
 * Provides reusable patterns for vector embedding generation with status tracking.
 * Used by both Green Domain (question vectors) and Orange Domain (document chunks).
 * 
 * Status Flow:
 * 1. Create with status 'ready' (optimistic) or 'pending' (for async workers)
 * 2. Attempt embedding generation
 * 3. Update to 'ready' on success or 'failed' on error
 * ============================================================================
 */

import { generateEmbedding } from '../utils/ai.js';
import { normalizeEmbedding } from '../utils/vector.js';

export const generateAndStoreEmbedding = async ({ text }) => {
  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return {
        embedding: [],
        status: 'failed',
        error: 'Text is required and must not be empty',
      };
    }

    const vector = await generateEmbedding(text);
    if (Array.isArray(vector) && vector.length > 0) {
      return {
        embedding: vector,
        status: 'ready',
        error: null,
      };
    }

    return {
      embedding: [],
      status: 'failed',
      error: 'Embedding generation returned empty vector',
    };
  } catch (error) {
    return {
      embedding: [],
      status: 'failed',
      error: error.message,
    };
  }
};

export const validateEmbeddingStatus = (status) => {
  const validStates = ['ready', 'pending', 'failed'];
  return validStates.includes(status) ? status : 'failed';
};

export const isEmbeddingReady = (status) => status === 'ready';

export const isEmbeddingProcessing = (status) => status === 'pending';

export const isEmbeddingFailed = (status) => status === 'failed';
