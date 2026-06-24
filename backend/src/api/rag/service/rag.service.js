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
const UPLOAD_BASE_DIR = path.resolve(process.cwd(), "uploads", "rag");
const DEFAULT_K = 5;
const DEFAULT_THRESHOLD = 0.45;
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash-lite";

const resolveEmbeddingModel = () => {
  const configured = process.env.GEMINI_EMBEDDING_MODEL?.trim();
  return !configured || configured === "embedding-001"
    ? "gemini-embedding-001"
    : configured;
};

const resolveStorageAbsolutePath = (storagePath) =>
  path.join(UPLOAD_BASE_DIR, storagePath);

const assertOwnedDocument = async (
  documentId,
  userId,
  { requireReady = false } = {},
) => {
  const rows = await safeExecute(
    "SELECT * FROM documents WHERE document_id = ? AND user_id = ? LIMIT 1",
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

const generateDocumentEmbedding = async (text) => {
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
    console.error("Embedding generation failed:", error);
    throw new Error(`Embedding failed: ${error.message}`);
  }
};

const generateQueryEmbedding = async (text) => {
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
    console.error("Query embedding generation failed:", error);
    throw new ServiceUnavailableError(
      `Failed to generate query embedding: ${error.message}`,
    );
  }
};

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

const fetchDocumentChunkRows = async (documentId) =>
  safeExecute(
    `SELECT dcv.chunk_id, dcv.embedding, dc.chunk_index, dc.content
     FROM document_chunk_vectors dcv
     JOIN document_chunks dc ON dc.chunk_id = dcv.chunk_id
     WHERE dc.document_id = ?`,
    [documentId],
  );

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

  try {
    for (const [index, content] of chunks.entries()) {
      const chunkResult = await safeExecute(
        "INSERT INTO document_chunks (document_id, chunk_index, content) VALUES (?, ?, ?)",
        [documentId, index, content],
      );

      const embedding = await generateDocumentEmbedding(content);

      await safeExecute(
        "INSERT INTO document_chunk_vectors (chunk_id, source_text, embedding) VALUES (?, ?, ?)",
        [chunkResult.insertId, content, JSON.stringify(embedding)],
      );
    }

    await safeExecute(
      "UPDATE documents SET status = 'ready', error_message = NULL WHERE document_id = ?",
      [documentId],
    );
  } catch (error) {
    console.error("Document processing error:", error);
    await safeExecute(
      "DELETE FROM document_chunk_vectors WHERE chunk_id IN (SELECT chunk_id FROM document_chunks WHERE document_id = ?)",
      [documentId],
    );
    await safeExecute(
      "DELETE FROM document_chunks WHERE document_id = ?",
      [documentId],
    );
    await safeExecute(
      "UPDATE documents SET status = 'failed', error_message = ? WHERE document_id = ?",
      [error.message || "Processing failed", documentId],
    );
  }
};

const processPdfBackground = (documentId, filePath) => {
  processUploadedPdf(documentId, filePath).catch((err) => {
    console.error("[RAG] Background processing crashed:", err);
  });
};

export const createDocumentFromUploadService = async (file, userId) => {
  if (!file) {
    throw new BadRequestError("No file provided.");
  }

  const storagePath = path
    .relative(UPLOAD_BASE_DIR, file.path)
    .replace(/\\/g, "/");

  const insertResult = await safeExecute(
    `INSERT INTO documents (user_id, title, storage_path, mime_type, byte_size, status)
     VALUES (?, ?, ?, ?, ?, 'processing')`,
    [userId, file.originalname, storagePath, file.mimetype, file.size],
  );

  const documentId = insertResult.insertId;

  setImmediate(() => processPdfBackground(documentId, file.path));

  const rows = await safeExecute(
    "SELECT * FROM documents WHERE document_id = ? LIMIT 1",
    [documentId],
  );

  return rows[0];
};

export const getDocumentsByUserIdService = async (userId) => {
  try {
    return await safeExecute(
      "SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
  } catch (error) {
    console.error("Database error in getDocumentsByUserIdService:", error);
    throw new Error("Could not retrieve documents.");
  }
};

export const getDocumentMetaService = async (documentId, userId) => {
  const rows = await safeExecute(
    `SELECT document_id, title, mime_type, byte_size, status, error_message,
            created_at, updated_at, user_id, storage_path
     FROM documents
     WHERE document_id = ? AND user_id = ?
     LIMIT 1`,
    [documentId, userId],
  );

  if (!rows || rows.length === 0) {
    throw new NotFoundError("Document not found.");
  }

  return rows[0];
};

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

  await safeExecute("DELETE FROM documents WHERE document_id = ?", [documentId]);

  return { id: documentId };
};

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

export const getDocumentFilePathService = async (documentId, userId) => {
  const document = await assertOwnedDocument(documentId, userId, {
    requireReady: true,
  });

  return {
    absolutePath: resolveStorageAbsolutePath(document.storage_path),
    title: document.title,
  };
};

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
    "DELETE FROM document_chunk_vectors WHERE chunk_id IN (SELECT chunk_id FROM document_chunks WHERE document_id = ?)",
    [documentId],
  );
  await safeExecute(
    "DELETE FROM document_chunks WHERE document_id = ?",
    [documentId],
  );
  await safeExecute(
    "UPDATE documents SET status = 'processing', error_message = NULL WHERE document_id = ?",
    [documentId],
  );

  setImmediate(() => processPdfBackground(documentId, absolutePath));

  const rows = await safeExecute(
    "SELECT * FROM documents WHERE document_id = ? LIMIT 1",
    [documentId],
  );

  return rows[0];
};
