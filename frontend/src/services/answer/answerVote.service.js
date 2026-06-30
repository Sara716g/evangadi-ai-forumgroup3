/**
 * Answer-vote API service — toggle upvote on an answer.
 */
import { apiClient } from "../core/api.client.js";

/** Toggle upvote on an answer (adds vote if not voted, removes if already voted). */
export async function toggleAnswerVote(answerId) {
  const res = await apiClient.post(`/api/answers/${answerId}/vote`);
  return res.data;
}

export default { toggleAnswerVote };
