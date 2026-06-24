// backend/src/api/question/service/GeminiTextCoach.service.js
import { generateText } from '../../../utils/ai.js';

export const generateQuestionDraftCoachService = async ({ title, content }) => {
  const prompt = `You are a question writing coach for a developer forum.
The user has this question title and content:
Title: ${title || 'No title provided'}
Content: ${content}

Respond with valid JSON only, no markdown. Use this exact structure:
{
  "overall": "A short 1-2 sentence summary of the question quality",
  "tips": ["tip 1", "tip 2", "tip 3"],
  "improvedBody": "An improved version of the question body"
}`;

  let raw;
  try {
    raw = await generateText(prompt);
  } catch (err) {
    console.error('[GeminiTextCoach] AI call failed:', err.message);
    throw err;
  }

  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  let jsonStr = raw.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      overall: parsed.overall || '',
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
      improvedBody: parsed.improvedBody || '',
    };
  } catch {
    return {
      overall: raw,
      tips: [],
      improvedBody: '',
    };
  }
};