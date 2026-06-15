/**
 * ============================================================================
 * Domain: RAG Document Pipeline (Orange Domain)
 * ============================================================================
 * Manages knowledge base documents with:
 * 1. Document upload and chunking (text segmentation for LLM context windows)
 * 2. Vector embeddings for chunks (stored in document_chunk_vectors)
 * 3. Vector similarity search across document corpus
 * 4. RAG-augmented Q&A using retrieved chunks as context
 *
 * Status Tracking Pattern:
 * - Document status: 'pending' → 'processing' → 'ready' | 'failed'
 * - Chunk vector status: 'ready' (complete), 'pending' (processing), 'failed' (error)
 * - Enables async processing without blocking document upload
 * ============================================================================
 */

import path from 'path';
import fs from 'fs/promises';
import * as pdfParse from 'pdf-parse';
import { safeExecute } from '../../../../db/config.js';
import { BadRequestError, NotFoundError, ServiceUnavailableError } from '../../../utils/errors/index.js';
import { generateEmbedding, generateText } from '../../../utils/ai.js';
import { cosineSimilarity, normalizeEmbedding } from '../../../utils/vector.js';

const UPLOAD_BASE_DIR = path.resolve(process.cwd(), 'uploads', 'rag');
const DEFAULT_SEARCH_K = Number(process.env.RAG_SEARCH_K ?? 5);
const DEFAULT_SEARCH_THRESHOLD = Number(process.env.RAG_SEARCH_THRESHOLD ?? 0.0);
const CHUNK_SIZE = Number(process.env.RAG_CHUNK_SIZE ?? 1000);
const CHUNK_OVERLAP = Number(process.env.RAG_CHUNK_OVERLAP ?? 150);

const mapDocumentRow = row => ({
  document_id: row.document_id,
  title: row.title,
  mime_type: row.mime_type,
  byte_size: Number(row.byte_size),
  status: row.status,
  error_message: row.error_message,
  created_at: row.created_at,
  updated_at: row.updated_at,
  user_id: row.user_id,
  storage_path: row.storage_path,
});

const normalizePdfText = content => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  return content.replace(/\s+/g, ' ').trim();
};

const chunkDocumentText = text => {
  const normalized = normalizePdfText(text);
  const chunks = [];

  let start = 0;
  while (start < normalized.length) {
    let end = Math.min(start + CHUNK_SIZE, normalized.length);
    let chunk = normalized.slice(start, end);

    if (end < normalized.length) {
      const lastSpaceIndex = chunk.lastIndexOf(' ');
      if (lastSpaceIndex > 0) {
        chunk = chunk.slice(0, lastSpaceIndex);
      }
    }

    chunks.push(chunk.trim());
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks.filter(Boolean);
};

const getDocumentStoragePath = documentPath => path.join(UPLOAD_BASE_DIR, documentPath);

const assertOwnedDocument = async ({ documentId, userId }) => {
  const sql = `
    SELECT
      document_id,
      user_id,
      title,
      mime_type,
      storage_path,
      byte_size,
      status,
      error_message,
      created_at,
      updated_at
    FROM documents
    WHERE document_id = ?
      AND user_id = ?
    LIMIT 1
  `;

  const rows = await safeExecute(sql, [documentId, userId]);
  if (rows.length === 0) {
    throw new NotFoundError('Document not found');
  }

  return rows[0];
};

export const createDocumentFromUploadService = async ({ userId, file }) => {
  if (!file) {
    throw new BadRequestError('PDF file is required.');
  }

  const storagePath = path.join(String(userId), file.filename);
  const insertSql = `
    INSERT INTO documents (user_id, title, mime_type, storage_path, byte_size, status)
    VALUES (?, ?, ?, ?, ?, 'processing')
  `;

  const insertResult = await safeExecute(insertSql, [
    userId,
    file.originalname,
    file.mimetype,
    storagePath,
    file.size,
  ]);

  const documentId = insertResult.insertId;
  const absolutePath = path.resolve(file.path);

  try {
    const pdfBuffer = await fs.readFile(absolutePath);
    const parsed = await pdfParse.PDFParse(pdfBuffer);
    const text = normalizePdfText(parsed.text);

    if (!text) {
      throw new ServiceUnavailableError('Uploaded PDF contains no extractable text.');
    }

    const chunks = chunkDocumentText(text);
    if (chunks.length === 0) {
      throw new ServiceUnavailableError('Unable to split document text into chunks.');
    }

    const chunkSql = `
      INSERT INTO document_chunks (document_id, chunk_index, content, page_start, page_end)
      VALUES (?, ?, ?, NULL, NULL)
    `;
    const vectorSql = `
      INSERT INTO document_chunk_vectors (chunk_id, source_text, embedding, status)
      VALUES (?, ?, ?, 'ready')
    `;

    for (let index = 0; index < chunks.length; index += 1) {
      const content = chunks[index];
      const chunkResult = await safeExecute(chunkSql, [documentId, index, content]);
      const chunkId = chunkResult.insertId;
      const embedding = await generateEmbedding(content);
      await safeExecute(vectorSql, [chunkId, content, JSON.stringify(embedding)]);
    }

    await safeExecute(`UPDATE documents SET status = 'ready', updated_at = NOW() WHERE document_id = ?`, [documentId]);

    return {
      document_id: documentId,
      title: file.originalname,
      mime_type: file.mimetype,
      byte_size: Number(file.size),
      status: 'ready',
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: userId,
      storage_path: storagePath,
    };
  } catch (error) {
    await safeExecute(
      `UPDATE documents SET status = 'failed', error_message = ?, updated_at = NOW() WHERE document_id = ?`,
      [error.message, documentId],
    );
    throw error;
  }
};

export const listDocumentsForUserService = async ({ userId }) => {
  const sql = `
    SELECT
      document_id,
      title,
      mime_type,
      byte_size,
      status,
      error_message,
      created_at,
      updated_at
    FROM documents
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  const rows = await safeExecute(sql, [userId]);
  return rows.map(row => ({
    document_id: row.document_id,
    title: row.title,
    mime_type: row.mime_type,
    byte_size: Number(row.byte_size),
    status: row.status,
    error_message: row.error_message,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
};

export const getDocumentMetaService = async ({ documentId, userId }) => {
  const row = await assertOwnedDocument({ documentId, userId });
  return mapDocumentRow(row);
};

export const getDocumentFileService = async ({ documentId, userId }) => {
  const row = await assertOwnedDocument({ documentId, userId });
  const filePath = getDocumentStoragePath(row.storage_path);
  return {
    filePath,
    mimeType: row.mime_type,
  };
};

export const deleteDocumentService = async ({ documentId, userId }) => {
  const row = await assertOwnedDocument({ documentId, userId });
  const absolutePath = getDocumentStoragePath(row.storage_path);

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    // File may already be missing; continue with deletion.
  }

  await safeExecute('DELETE FROM documents WHERE document_id = ?', [documentId]);
  return { id: documentId };
};

export const searchInDocumentService = async ({ userId, documentId, query, k }) => {
  const row = await assertOwnedDocument({ documentId, userId });
  if (row.status !== 'ready') {
    throw new ServiceUnavailableError('Document is not ready for search.');
  }

  const searchVector = await generateEmbedding(query);
  const normalizedVector = normalizeEmbedding(searchVector);
  if (normalizedVector.length === 0) {
    throw new ServiceUnavailableError('Unable to generate embedding for search query.');
  }

  const sql = `
    SELECT
      dc.chunk_id,
      dc.chunk_index,
      dc.content,
      dcv.embedding
    FROM document_chunk_vectors dcv
    JOIN document_chunks dc ON dcv.chunk_id = dc.chunk_id
    WHERE dc.document_id = ?
      AND dcv.status = 'ready'
  `;

  const rows = await safeExecute(sql, [documentId]);
  const results = rows
    .map(row => {
      const embedding = normalizeEmbedding(JSON.parse(row.embedding || '[]'));
      return {
        chunkId: row.chunk_id,
        chunkIndex: row.chunk_index,
        excerpt: row.content,
        score: cosineSimilarity(normalizedVector, embedding),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Number(k ?? DEFAULT_SEARCH_K));

  return {
    query,
    results,
  };
};

export const queryDocumentService = async ({ userId, documentId, query }) => {
  const searchResult = await searchInDocumentService({ userId, documentId, query, k: DEFAULT_SEARCH_K });
  const topChunks = searchResult.results;

  if (topChunks.length === 0) {
    return {
      answer: 'No relevant document excerpts were found for this query.',
      citations: [],
      chunksUsed: [],
    };
  }

  const context = topChunks
    .map(
      (chunk, index) =>
        `Excerpt ${index + 1} (chunk ${chunk.chunkIndex}): ${chunk.excerpt}`,
    )
    .join('\n\n');

  const prompt = `You are an assistant that answers questions using only the provided document excerpts.
If the answer cannot be found in the text, say that the information is not available.

User question: ${query}

Document excerpts:
${context}

Answer the question clearly and cite the excerpts by chunk index.`;

  const answer = await generateText(prompt);

  return {
    answer,
    citations: topChunks.map(chunk => ({ ref: chunk.chunkId, chunkIndex: chunk.chunkIndex })),
    chunksUsed: topChunks.map(chunk => chunk.chunkId),
  };
};
