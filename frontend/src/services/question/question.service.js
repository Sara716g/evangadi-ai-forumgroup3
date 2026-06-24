import { apiClient } from "../core/api.client.js";

export const questionService = {
  createQuestion: async ({ title, content }) => {
    const response = await apiClient.post("/api/questions", {
      title,
      content,
    });
    return response.data;
  },

  generateQuestionDraftCoach: async ({ title, content }) => {
    const response = await apiClient.post("/api/questions/draft-coach", {
      title,
      content,
    });
    return response.data.data;
  },

  getQuestions: async (search = "", mine = false) => {
    const params = { search };
    if (mine) params.mine = true;
    const response = await apiClient.get("/api/questions", { params });
    return response.data.data;
  },

  getSemanticQuestions: async (query = "") => {
    const response = await apiClient.get("/api/questions/search", {
      params: { query },
    });
    return response.data.data;
  },
};

// Convenience function used by question detail page
export async function getSingleQuestion(questionHash) {
  const res = await apiClient.get(`/api/questions/${questionHash}`);
  return res.data;
}

export async function getSimilarQuestions(questionHash) {
  const res = await apiClient.get(`/api/questions/${questionHash}/similar`);
  return res.data;
}
