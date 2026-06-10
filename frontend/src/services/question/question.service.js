import { apiClient } from "../core/api.client.js";

export const questionService = {
  createQuestion: async ({ title, content }) => {
    const response = await apiClient.post("/api/questions", {
      title,
      content,
    });
    return response.data;
  },

  getQuestions: async (search = "") => {
    const response = await apiClient.get("/api/questions", {
      params: { search },
    });
    return response.data.data;
  },

  getSemanticQuestions: async (search = "") => {
    const response = await apiClient.get("/api/questions", {
      params: { search, semantic: true },
    });
    return response.data.data;
  },
};
