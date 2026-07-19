/**
 * @file Gemini AI client utilities.
 *
 * Provides two core capabilities used across the backend:
 * 1. generateEmbedding — converts text into a vector for semantic search.
 * 2. generateText — sends a prompt to Gemini and returns the text response.
 *
 * Both functions include input validation and translate Gemini-specific
 * error codes (429 quota, 503 overloaded) into ApplicationErrors that
 * the global error handler can format.
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { BadRequestError, ServiceUnavailableError } from './errors/index.js';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash-lite';

/** Shared Google Generative AI client instance. */
export const aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Flatten the Gemini response parts array into a single text string.
 * Gemini may return multiple { text } parts; this joins them.
 */
const parsePartsText = (content) => {
  if (!content || !Array.isArray(content.parts)) {
    return '';
  }
  return content.parts.map(part => part.text || '').join('');
};

/**
 * Generate a vector embedding for the given text using Gemini.
 * Used by the RAG and question modules to enable semantic search.
 *
 * @param {string} text - The text to embed (must be non-empty after trim).
 * @returns {Promise<number[]>} The embedding vector.
 */
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

/**
 * Generate a free-form text response from Gemini.
 * Used by the draft coach, answer-fit evaluator, AI assistant, and RAG query.
 *
 * @param {string} prompt - The user/system prompt to send.
 * @returns {Promise<string>} The generated text.
 */
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

  // Warn when the response was cut short by the token limit
  if (candidate.finishReason === 'MAX_TOKENS') {
    console.warn('[Gemini generateText] Response truncated: hit maxOutputTokens limit');
  }

  return parsePartsText(candidate.content);
};