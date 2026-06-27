import { apiClient } from "../core/api.client.js";

export async function toggleAnswerVote(answerId) {
  const res = await apiClient.post(`/api/answers/${answerId}/vote`);
  return res.data;
}

export default { toggleAnswerVote };
