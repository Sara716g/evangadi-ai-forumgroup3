import { apiClient } from "../core/api.client.js";

export async function postAnswer(questionId, content, files = []) {
  if (files && files.length > 0) {
    const formData = new FormData();
    formData.append("questionId", questionId);
    formData.append("content", content);
    files.forEach((file) => formData.append("files", file));

    const res = await apiClient.post("/api/answers", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  }

  const res = await apiClient.post("/api/answers", {
    questionId,
    content,
  });
  return res.data.data;
}

export async function assessAnswerFit(questionHash, answerText) {
  const res = await apiClient.post(
    `/api/questions/${questionHash}/answer-fit`,
    {
      answerText,
    },
  );
  return res.data.data;
}

export default { postAnswer, assessAnswerFit };