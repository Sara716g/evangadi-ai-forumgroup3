// backend/src/api/question/service/GeminiTextCoach.service.js
import { generateText } from '../../../utils/ai.js'; // Goes up 3 levels to reach src/utils/ai.js

export const generateQuestionDraftCoachService = async ({ title, content }) => {
  const prompt = `You are a question writing coach for a developer forum.
The user has this question title and content:
Title: ${title || 'No title provided'}
Content: ${content}

Provide:
1) A short summary of the question.
2) Three ways to make the question clearer or more answerable.
3) One suggested alternative title.
4) Two example tags or keywords.
Respond in a concise, human-friendly format.`;

  const draft = await generateText(prompt);
  return {
    suggestion: draft,
    question: {
      title: title || null,
      content,
    },
  };
};