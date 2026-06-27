/**
 * ============================================================================
 * Domain: AI Search/Embeddings (Green Domain)
 * ============================================================================
 * Encapsulates vector utility functions for semantic search operations.
 * Provides consistent interface for embedding normalization and similarity scoring.
 * ============================================================================
 */
// backend/src/api/question/service/vector.service.js

// FIXED: Changed from '../../../../utils/vector.js' to '../../../utils/vector.js'
import { generateHexString, normalizeEmbedding, cosineSimilarity } from '../../../utils/vector.js';

export { generateHexString, normalizeEmbedding, cosineSimilarity };
