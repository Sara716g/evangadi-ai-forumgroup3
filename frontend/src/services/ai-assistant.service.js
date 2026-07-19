/**
 * AI Assistant service — sends user questions to the Gemini-backed /ai-assistant/answer endpoint.
 * Uses the shared apiClient for consistent auth headers, timeout, and 401 handling.
 */
import { apiClient } from "./core/api.client";

export const aiAssistantService = {
  getAnswer: async (question, history = []) => {
    const response = await apiClient.post("/api/ai-assistant/answer", {
      question,
      history,
    });
    return response.data;
  },
};
