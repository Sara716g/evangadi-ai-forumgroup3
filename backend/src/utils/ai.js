// backend/src/utils/ai.js
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash-lite';

// Initialize the client instance using the standard SDK
export const aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const parsePartsText = (content) => {
  if (!content || !Array.isArray(content.parts)) {
    return '';
  }
  return content.parts.map(part => part.text || '').join('');
};

export const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Text is required for embedding generation.');
  }

  const normalizedText = text.trim();
  if (!normalizedText) {
    throw new Error('Text must not be empty for embedding generation.');
  }

  const result = await aiClient.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents: [normalizedText],
  });

  const values = result.embeddings?.[0]?.values;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Failed to generate embedding from Gemini.');
  }

  return values;
};

export const generateText = async (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required for text generation.');
  }

  const response = await aiClient.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: prompt,
    config: {
      maxOutputTokens: 250,
    },
  });

  const candidate = response.candidates?.[0];
  if (!candidate?.content) {
    throw new Error('Failed to generate text from Gemini.');
  }

  return parsePartsText(candidate.content);
};