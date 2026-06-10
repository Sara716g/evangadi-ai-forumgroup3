import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const evaluateAnswerFit = async (question, answerDraft) => {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_TEXT_MODEL,
  });

  const prompt = `
You are an expert evaluator. Given a question and a draft answer, evaluate how well the answer addresses the question.

Question: ${question}

Draft Answer: ${answerDraft}

Respond in this exact JSON format:
{
  "score": <number between 0 and 100>,
  "verdict": "<Excellent|Good|Fair|Poor>",
  "feedback": "<2-3 sentences of specific feedback>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>"]
}
Only respond with the JSON, nothing else.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};
