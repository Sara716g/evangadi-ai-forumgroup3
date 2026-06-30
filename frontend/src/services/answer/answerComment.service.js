/**
 * Answer-comment API service — fetch and post comments on answers.
 */
import { apiClient } from "../core/api.client.js";

/** Retrieve all comments for a given answer. */
export async function getAnswerComments(answerId) {
  const res = await apiClient.get(`/api/answers/${answerId}/comments`);
  return res.data;
}

/** Post a new comment on an answer. */
export async function postAnswerComment(answerId, content) {
  const res = await apiClient.post(`/api/answers/${answerId}/comments`, { content });
  return res.data;
}

export default { getAnswerComments, postAnswerComment };
