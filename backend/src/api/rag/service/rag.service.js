import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { safeExecute } from "../../../../db/config.js";
import { BadRequestError } from "../../../utils/errors/index.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const UPLOAD_BASE_DIR = path.resolve(process.cwd(), "uploads", "rag");

// --- Helper: Embedding Logic ---
const resolveEmbeddingModel = () => {
  const configured = process.env.GEMINI_EMBEDDING_MODEL?.trim();
  return !configured || configured === "embedding-001"
    ? "gemini-embedding-001"
    : configured;
};

const generateEmbedding = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: resolveEmbeddingModel() });
    const result = await model.embedContent({
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_DOCUMENT",
    });

    if (result?.embedding?.values) return result.embedding.values;
    throw new Error("Unexpected embedding response format");
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw new Error(`Embedding failed: ${error.message}`);
  }
};

// --- Helper: Processing Logic ---
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

const processUploadedPdf = async (documentId, filePath) => {
  const pdfBuffer = await fs.readFile(filePath);
  const data = await pdfParse(pdfBuffer);
  const text = data.text?.trim() || "";

  if (!text) throw new Error("PDF contains no extractable text.");

  const chunks = chunkText(text);

  for (const [index, content] of chunks.entries()) {
    const chunkResult = await safeExecute(
      "INSERT INTO document_chunks (document_id, chunk_index, content) VALUES (?, ?, ?)",
      [documentId, index, content],
    );

    const embedding = await generateEmbedding(content);

    await safeExecute(
      "INSERT INTO document_chunk_vectors (chunk_id, source_text, embedding) VALUES (?, ?, ?)",
      [chunkResult.insertId, content, JSON.stringify(embedding)],
    );
  }

  await safeExecute(
    "UPDATE documents SET status = 'ready', error_message = NULL WHERE document_id = ?",
    [documentId],
  );
};

// --- Exported Services ---

export const createDocumentFromUploadService = async (file, userId) => {
  if (!file) throw new BadRequestError("No file provided.");

  const storagePath = path
    .relative(UPLOAD_BASE_DIR, file.path)
    .replace(/\\/g, "/");

  const insertResult = await safeExecute(
    `INSERT INTO documents (user_id, title, storage_path, mime_type, byte_size, status)
     VALUES (?, ?, ?, ?, ?, 'processing')`,
    [userId, file.originalname, storagePath, file.mimetype, file.size],
  );

  const documentId = insertResult.insertId;

  try {
    await processUploadedPdf(documentId, file.path);
  } catch (error) {
    console.error("Document processing error:", error);
    await safeExecute(
      "UPDATE documents SET status = 'failed', error_message = ? WHERE document_id = ?",
      [error.message || "Unknown error", documentId],
    );
  }

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
