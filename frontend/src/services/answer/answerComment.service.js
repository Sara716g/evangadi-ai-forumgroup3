import { apiClient } from "../core/api.client.js";

export async function getAnswerComments(answerId) {
  const res = await apiClient.get(`/api/answers/${answerId}/comments`);
  return res.data;
}

export async function postAnswerComment(answerId, content) {
  const res = await apiClient.post(`/api/answers/${answerId}/comments`, { content });
  return res.data;
}

export default { getAnswerComments, postAnswerComment };
