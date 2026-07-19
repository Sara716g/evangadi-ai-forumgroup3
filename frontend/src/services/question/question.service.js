/**
 * Question API service — CRUD operations and semantic search for forum questions.
 */
import { apiClient } from "../core/api.client.js";

export const questionService = {
  /** Create a new question. */
  createQuestion: async ({ title, content }) => {
    const response = await apiClient.post("/api/questions", {
      title,
      content,
    });
    return response.data;
  },

  /** Generate a polished question draft via the AI draft-coach endpoint. */
  generateQuestionDraftCoach: async ({ title, content }) => {
    const response = await apiClient.post("/api/questions/draft-coach", {
      title,
      content,
    });
    return response.data.data;
  },

  /** Fetch questions with optional keyword search and "mine" filter. */
  getQuestions: async (search = "", mine = false) => {
    const params = { search };
    if (mine) params.mine = true;
    const response = await apiClient.get("/api/questions", { params });
    return response.data.data;
  },

  /** Semantic search — finds questions by meaning, not just keywords. */
  getSemanticQuestions: async (query = "") => {
    const response = await apiClient.get("/api/questions/search", {
      params: { query },
    });
    return response.data.data;
  },
};

/** Fetch a single question by its hash (used by the question detail page). */
export async function getSingleQuestion(questionHash) {
  const res = await apiClient.get(`/api/questions/${questionHash}`);
  return res.data;
}

/** Fetch similar questions for the sidebar recommendations. */
export async function getSimilarQuestions(questionHash) {
  const res = await apiClient.get(`/api/questions/${questionHash}/similar`);
  return res.data;
}
