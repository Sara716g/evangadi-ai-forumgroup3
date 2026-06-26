// backend/src/utils/ai.js
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { BadRequestError, ServiceUnavailableError } from './errors/index.js';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash-lite';

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
    throw new BadRequestError('Text is required for embedding generation.');
  }

  const normalizedText = text.trim();
  if (!normalizedText) {
    throw new BadRequestError('Text must not be empty for embedding generation.');
  }

  const result = await aiClient.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents: [normalizedText],
    config: {
      taskType: 'RETRIEVAL_DOCUMENT',
    },
  });

  const values = result.embeddings?.[0]?.values;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Failed to generate embedding from Gemini.');
  }

  return values;
};

export const generateText = async (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    throw new BadRequestError('Prompt is required for text generation.');
  }

  let response;
  try {
    response = await aiClient.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 4096,
      },
    });
  } catch (err) {
    console.error('[Gemini generateText] Full error:', err);
    const msg = err?.message || String(err);
    if (msg.includes('429') || msg.includes('quota')) {
      throw new ServiceUnavailableError('AI service quota exceeded. Please try again later.');
    }
    if (msg.includes('404') || msg.includes('not found')) {
      throw new ServiceUnavailableError(`AI model "${GEMINI_TEXT_MODEL}" is not available.`);
    }
    if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('overloaded') || msg.includes('high demand')) {
      throw new ServiceUnavailableError('AI service is temporarily busy. Please try again in a moment.');
    }
    throw new ServiceUnavailableError('AI service is temporarily unavailable. Please try again later.');
  }

  const candidate = response.candidates?.[0];
  if (!candidate?.content) {
    throw new Error('Failed to generate text from Gemini.');
  }

  if (candidate.finishReason === 'MAX_TOKENS') {
    console.warn('[Gemini generateText] Response truncated: hit maxOutputTokens limit');
  }

  return parsePartsText(candidate.content);
};