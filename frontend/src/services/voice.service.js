import { apiClient } from './core/api.client.js';

export const uploadVoiceMessage = async ({ audioBlob, duration, questionId, answerId }) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'voice-message.webm');
  formData.append('duration', duration);
  if (questionId) formData.append('questionId', questionId);
  if (answerId) formData.append('answerId', answerId);

  const response = await apiClient.post('/api/voice-messages', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getVoiceMessage = async (messageId) => {
  const response = await apiClient.get(`/api/voice-messages/${messageId}`);
  return response.data;
};
