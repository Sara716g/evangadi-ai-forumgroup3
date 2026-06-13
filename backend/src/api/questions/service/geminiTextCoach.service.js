import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const generateQuestionDraftCoachService = async ({
  title,
  content,
}) => {
  const prompt = `
You are a senior programming forum expert.

Your task is to review a question draft and give improvement tips.

Rules:
- Focus on clarity, completeness, and usefulness
- Do NOT answer the question
- Only give improvement suggestions

Title:
${title || 'No title'}

Content:
${content || 'No content'}

Return ONLY 3–5 short bullet-point tips.
`;

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash-lite',
    contents: prompt,
  });

  const text = response.text; // ✅ correct usage

  const tips = text
    .split('\n')
    .map(t => t.replace(/^[-*•]\s*/, '').trim())
    .filter(t => t.length > 0);

  return { tips };
};