import { GoogleGenAI } from "@google/genai";
import { safeExecute } from "../../../../db/config.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateQuestionHash = () => {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const generateEmbedding = async (text) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-2",
        content: { parts: [{ text }] },
        taskType: "RETRIEVAL_DOCUMENT",
      }),
    },
  );
  const data = await response.json();
  return data.embedding.values;
};

export const createQuestionWithVectorService = async ({
  title,
  content,
  userId,
}) => {
  const questionHash = generateQuestionHash();

  // Phase 1: save the question
  const insertSql = `
    INSERT INTO questions (question_hash, user_id, title, content)
    VALUES (?, ?, ?, ?)
  `;
  const result = await safeExecute(insertSql, [
    questionHash,
    userId,
    title,
    content,
  ]);
  const questionId = result.insertId;

  // Phase 2: generate embedding — never blocks the response if it fails
  let embedding = null;
  let vectorStatus = "failed";

  try {
    embedding = await generateEmbedding(title);
    vectorStatus = "ready";
  } catch (error) {
    console.error(
      `[T-09] Embedding failed for question ${questionId}:`,
      error.message,
    );
  }

  const vectorSql = `
    INSERT INTO question_vectors (question_id, source_text, embedding, status)
    VALUES (?, ?, ?, ?)
  `;
  await safeExecute(vectorSql, [
    questionId,
    title,
    JSON.stringify(embedding ?? []),
    vectorStatus,
  ]);

  return { id: questionId, questionHash, title, content, userId };
};
