import { apiClient } from "./core/api.client.js";

export async function postAnswer(questionId, content) {
  const res = await apiClient.post("/api/answers", {
    questionId,
    content,
  });
  return res.data;
}

export async function assessAnswerFit(questionHash, answerText) {
  const res = await apiClient.post(
    `/api/questions/${questionHash}/answer-fit`,
    {
      answerText,
    },
  );
  return res.data;
}

export default { postAnswer, assessAnswerFit };
