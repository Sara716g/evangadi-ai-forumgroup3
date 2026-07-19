/**
 * @file RAG (Retrieval-Augmented Generation) service.
 *
 * Handles the full lifecycle of user-uploaded PDF documents:
 * 1. Upload & store the PDF on disk
 * 2. Extract text via pdf-parse
 * 3. Chunk the text into overlapping segments (default 1000 chars, 150 overlap)
 * 4. Generate vector embeddings for each chunk via Gemini
 * 5. Store chunks + embeddings in MySQL
 * 6. At query time: embed the user's query, rank chunks by cosine similarity,
 *    then prompt Gemini to answer using only the top-ranked excerpts.
 *
 * Embedding calls use exponential-backoff retry (up to 5 attempts) to
 * handle Gemini API quota limits (HTTP 429).
 */

import fs from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";
import { safeExecute } from "../../../../db/config.js";
import {
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
} from "../../../utils/errors/index.js";
import {
  cosineSimilarity,
  parseEmbedding,
} from "../../../utils/vector/vector.utils.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const textAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/** Base directory where uploaded RAG PDFs are stored on disk. */
const UPLOAD_BASE_DIR = path.resolve(process.cwd(), "uploads", "rag");

/** Default number of top chunks to return for search / query. */
const DEFAULT_K = 5;

/** Minimum cosine similarity score for a chunk to be considered relevant. */
const DEFAULT_THRESHOLD = 0.45;

/** Gemini model used for free-form text generation (answer generation). */
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash-lite";

/**
 * Resolve the Gemini embedding model name from the environment.
 * Falls back to gemini-embedding-001 if the configured model is the
 * legacy "embedding-001" identifier.
 */
const resolveEmbeddingModel = () => {
  const configured = process.env.GEMINI_EMBEDDING_MODEL?.trim();
  return !configured || configured === "embedding-001"
    ? "gemini-embedding-001"
    : configured;
};

/** Convert a relative DB storage_path to an absolute filesystem path. */
const resolveStorageAbsolutePath = (storagePath) =>
  path.join(UPLOAD_BASE_DIR, storagePath);

/**
 * Verify that a document exists and belongs to the given user.
 * Optionally enforces that the document has finished processing.
 *
 * @param {number} documentId
 * @param {number} userId
 * @param {object} options - { requireReady: boolean }
 * @returns {object} The document row from the database.
 */
const assertOwnedDocument = async (
  documentId,
  userId,
  { requireReady = false } = {},
) => {
  const rows = await safeExecute(
    "SELECT * FROM documents WHERE document_id = $1 AND user_id = $2 LIMIT 1",
    [documentId, userId],
  );

  const document = rows[0];
  if (!document) {
    throw new NotFoundError("Document not found.");
  }

  if (requireReady && document.status !== "ready") {
    throw new BadRequestError("Document is not ready for this operation.");
  }

  return document;
};

/** Maximum number of retry attempts for embedding API calls on quota errors. */
const EMBEDDING_MAX_RETRIES = 5;

/** Base delay (ms) for exponential backoff between embedding retries. */
const EMBEDDING_BASE_DELAY_MS = 2000;

/** Promise-based sleep helper for retry delays. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Detect HTTP 429 (quota/rate-limit) errors from the Gemini API. */
const isQuotaError = (error) => {
  const status = error?.status || error?.response?.status || error?.cause?.status;
  return status === 429;
};

/**
 * Generate a vector embedding for a document chunk.
 * Uses RETRIEVAL_DOCUMENT task type. Retries on quota errors with
 * exponential backoff (2s, 4s, 8s, ...).
 */
const generateDocumentEmbedding = async (text, attempt = 1) => {
  try {
    const model = genAI.getGenerativeModel({ model: resolveEmbeddingModel() });
    const result = await model.embedContent({
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_DOCUMENT",
    });

    if (result?.embedding?.values) {
      return result.embedding.values;
    }

    throw new Error("Unexpected embedding response format");
  } catch (error) {
    if (isQuotaError(error) && attempt < EMBEDDING_MAX_RETRIES) {
      const delay = EMBEDDING_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(
        `[RAG] Embedding quota hit (attempt ${attempt}/${EMBEDDING_MAX_RETRIES}). Retrying in ${delay}ms...`,
      );
      await sleep(delay);
      return generateDocumentEmbedding(text, attempt + 1);
    }
    console.error("Embedding generation failed:", error);
    throw new Error(`Embedding failed: ${error.message}`);
  }
};

/**
 * Generate a vector embedding for a user search query.
 * Uses RETRIEVAL_QUERY task type (as opposed to RETRIEVAL_DOCUMENT).
 */
const generateQueryEmbedding = async (text, attempt = 1) => {
  try {
    const model = genAI.getGenerativeModel({ model: resolveEmbeddingModel() });
    const result = await model.embedContent({
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_QUERY",
    });

    if (result?.embedding?.values) {
      return result.embedding.values;
    }

    throw new Error("Unexpected embedding response format");
  } catch (error) {
    if (isQuotaError(error) && attempt < EMBEDDING_MAX_RETRIES) {
      const delay = EMBEDDING_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(
        `[RAG] Query embedding quota hit (attempt ${attempt}/${EMBEDDING_MAX_RETRIES}). Retrying in ${delay}ms...`,
      );
      await sleep(delay);
      return generateQueryEmbedding(text, attempt + 1);
    }
    console.error("Query embedding generation failed:", error);
    throw new ServiceUnavailableError(
      `Failed to generate query embedding: ${error.message}`,
    );
  }
};

/**
 * Split text into overlapping chunks for embedding.
 * The overlap ensures context continuity across chunk boundaries.
 *
 * @param {string} text - Full extracted PDF text.
 * @param {number} chunkSize - Characters per chunk (default 1000).
 * @param {number} overlap - Overlap between consecutive chunks (default 150).
 * @returns {string[]} Array of non-empty chunk strings.
 */
const chunkText = (text, chunkSize = 1000, overlap = 150) => {
  const chunks = [];
  let i = 0;

  while (i < text.length) {
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(chunk.trim());
    i += chunkSize - overlap;
  }

  return chunks.filter(Boolean);
};

/** Fetch all chunk rows with their embeddings for a given document. */
const fetchDocumentChunkRows = async (documentId) =>
  safeExecute(
    `SELECT dcv.chunk_id, dcv.embedding, dc.chunk_index, dc.content
     FROM document_chunk_vectors dcv
     JOIN document_chunks dc ON dc.chunk_id = dcv.chunk_id
     WHERE dc.document_id = $1`,
    [documentId],
  );

/**
 * Rank document chunks by cosine similarity to the query embedding.
 * Returns the top-k chunks that exceed the similarity threshold.
 */
const rankDocumentChunks = async (documentId, query, k = DEFAULT_K) => {
  const queryVector = await generateQueryEmbedding(query);
  const rows = await fetchDocumentChunkRows(documentId);

  return rows
    .map((row) => ({
      chunkId: row.chunk_id,
      chunkIndex: row.chunk_index,
      content: row.content,
      score: cosineSimilarity(queryVector, parseEmbedding(row.embedding)),
    }))
    .filter((item) => item.score >= DEFAULT_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, Number(k) || DEFAULT_K);
};

/** Number of chunks to embed concurrently in a single batch. */
const EMBEDDING_BATCH_SIZE = 5;

/**
 * Full PDF processing pipeline: extract text → chunk → embed → store.
 * Called in the background after upload so the HTTP response returns immediately.
 */
const processUploadedPdf = async (documentId, filePath) => {
  const pdfBuffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: pdfBuffer });

  let text = "";

  try {
    const result = await parser.getText();
    text = result.text?.trim() || "";
  } finally {
    await parser.destroy();
  }

  if (!text) {
    throw new Error("PDF contains no extractable text.");
  }

  const chunks = chunkText(text);

  const chunkIds = [];
  for (const [index, content] of chunks.entries()) {
    const chunkResult = await safeExecute(
      "INSERT INTO document_chunks (document_id, chunk_index, content) VALUES ($1, $2, $3) RETURNING chunk_id",
      [documentId, index, content],
    );
    chunkIds.push({ id: chunkResult[0].chunk_id, content });
  }

  for (let i = 0; i < chunkIds.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = chunkIds.slice(i, i + EMBEDDING_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((chunk) =>
        generateDocumentEmbedding(chunk.content).then((embedding) => ({
          chunkId: chunk.id,
          content: chunk.content,
          embedding,
        })),
      ),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        const { chunkId, content: srcText, embedding } = result.value;
        await safeExecute(
          "INSERT INTO document_chunk_vectors (chunk_id, source_text, embedding) VALUES ($1, $2, $3)",
          [chunkId, srcText, JSON.stringify(embedding)],
        );
      } else {
        console.error("Embedding batch item failed:", result.reason);
      }
    }

    if (i + EMBEDDING_BATCH_SIZE < chunkIds.length) {
      await sleep(1500);
    }
  }

  await safeExecute(
    "UPDATE documents SET status = 'ready', error_message = NULL WHERE document_id = $1",
    [documentId],
  );
};

/** Fire-and-forget wrapper for background PDF processing. */
const processPdfBackground = (documentId, filePath) => {
  processUploadedPdf(documentId, filePath).catch((err) => {
    console.error("[RAG] Background processing crashed:", err);
  });
};

/**
 * Create a document record and kick off background PDF processing.
 * Returns the document row immediately (status: 'processing') while
 * chunking and embedding happen asynchronously.
 */
export const createDocumentFromUploadService = async (file, userId) => {
  if (!file) {
    throw new BadRequestError("No file provided.");
  }

  const storagePath = path
    .relative(UPLOAD_BASE_DIR, file.path)
    .replace(/\\/g, "/");

  const insertResult = await safeExecute(
    `INSERT INTO documents (user_id, title, storage_path, mime_type, byte_size, status)
     VALUES ($1, $2, $3, $4, $5, 'processing') RETURNING document_id`,
    [userId, file.originalname, storagePath, file.mimetype, file.size],
  );

  const documentId = insertResult[0].document_id;

  setImmediate(() => processPdfBackground(documentId, file.path));

  const rows = await safeExecute(
    "SELECT * FROM documents WHERE document_id = $1 LIMIT 1",
    [documentId],
  );

  return rows[0];
};

/** List all documents belonging to a user, newest first. */
export const getDocumentsByUserIdService = async (userId) => {
  try {
    return await safeExecute(
      "SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );
  } catch (error) {
    console.error("Database error in getDocumentsByUserIdService:", error);
    throw new Error("Could not retrieve documents.");
  }
};

/** Fetch metadata for a single document (title, status, size, timestamps). */
export const getDocumentMetaService = async (documentId, userId) => {
  const rows = await safeExecute(
    `SELECT document_id, title, mime_type, byte_size, status, error_message,
            created_at, updated_at, user_id, storage_path
     FROM documents
     WHERE document_id = $1 AND user_id = $2
     LIMIT 1`,
    [documentId, userId],
  );

  if (!rows || rows.length === 0) {
    throw new NotFoundError("Document not found.");
  }

  return rows[0];
};

/** Delete a document's file from disk and its record (cascades to chunks/vectors). */
export const deleteDocumentService = async (documentId, userId) => {
  const document = await assertOwnedDocument(documentId, userId);
  const absolutePath = resolveStorageAbsolutePath(document.storage_path);

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  await safeExecute("DELETE FROM documents WHERE document_id = $1", [documentId]);

  return { id: documentId };
};

/** Semantic search within a document — returns ranked chunk excerpts. */
export const searchInDocumentService = async (
  documentId,
  userId,
  query,
  k = DEFAULT_K,
) => {
  await assertOwnedDocument(documentId, userId, { requireReady: true });
  const rankedChunks = await rankDocumentChunks(documentId, query, k);

  return {
    query,
    results: rankedChunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      chunkIndex: chunk.chunkIndex,
      excerpt: chunk.content,
      score: chunk.score,
    })),
  };
};

/**
 * AI-grounded Q&A on a document.
 * 1. Rank chunks by cosine similarity to the query.
 * 2. Build a prompt with the top chunks as context.
 * 3. Ask Gemini to answer using only those chunks.
 * 4. Return the answer with inline citations.
 */
export const queryDocumentService = async (documentId, userId, query) => {
  await assertOwnedDocument(documentId, userId, { requireReady: true });
  const rankedChunks = await rankDocumentChunks(documentId, query, DEFAULT_K);

  if (rankedChunks.length === 0) {
    return {
      answer:
        "I could not find relevant passages in this document to answer your question.",
      citations: [],
      chunksUsed: [],
    };
  }

  const contextBlock = rankedChunks
    .map(
      (chunk) =>
        `[${chunk.chunkIndex}] ${chunk.content}`,
    )
    .join("\n\n");

  const prompt = [
    "Answer the user's question using only the document excerpts below.",
    "If the excerpts do not contain enough information, say you cannot find it in the document.",
    "When you use information from an excerpt, cite it inline as [chunk_index].",
    "",
    "Document excerpts:",
    contextBlock,
    "",
    `Question: ${query}`,
  ].join("\n");

  try {
    const response = await textAI.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 2048,
      },
    });

    const answer =
      response.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim() || "I could not generate an answer from this document.";

    const citations = rankedChunks.map((chunk) => ({
      ref: `[${chunk.chunkIndex}]`,
      chunkIndex: chunk.chunkIndex,
    }));

    const chunksUsed = rankedChunks.map((chunk) => chunk.chunkIndex);

    return { answer, citations, chunksUsed };
  } catch (error) {
    console.error("RAG query generation failed:", error);
    throw new ServiceUnavailableError(
      `Failed to generate answer: ${error.message}`,
    );
  }
};

/** Return the absolute filesystem path and title for streaming the PDF. */
export const getDocumentFilePathService = async (documentId, userId) => {
  const document = await assertOwnedDocument(documentId, userId, {
    requireReady: true,
  });

  return {
    absolutePath: resolveStorageAbsolutePath(document.storage_path),
    title: document.title,
  };
};

/** Re-process a failed document: delete old chunks, reset status, restart background processing. */
export const retryDocumentService = async (documentId, userId) => {
  const document = await assertOwnedDocument(documentId, userId);

  if (document.status !== "failed") {
    throw new BadRequestError("Only failed documents can be retried.");
  }

  const absolutePath = resolveStorageAbsolutePath(document.storage_path);

  try {
    await fs.access(absolutePath);
  } catch {
    throw new NotFoundError("Document file not found on disk.");
  }

  await safeExecute(
    "DELETE FROM document_chunk_vectors WHERE chunk_id IN (SELECT chunk_id FROM document_chunks WHERE document_id = $1)",
    [documentId],
  );
  await safeExecute(
    "DELETE FROM document_chunks WHERE document_id = $1",
    [documentId],
  );
  await safeExecute(
    "UPDATE documents SET status = 'processing', error_message = NULL WHERE document_id = $1",
    [documentId],
  );

  setImmediate(() => processPdfBackground(documentId, absolutePath));

  const rows = await safeExecute(
    "SELECT * FROM documents WHERE document_id = $1 LIMIT 1",
    [documentId],
  );

  return rows[0];
};
