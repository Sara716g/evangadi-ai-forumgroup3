import { apiClient } from '../core/api.client.js';

export const adminService = {
  getStats() {
    return apiClient.get('/api/admin/stats').then((r) => r.data);
  },

  getUsers({ page = 1, limit = 20, search = '' } = {}) {
    return apiClient
      .get('/api/admin/users', { params: { page, limit, search } })
      .then((r) => r.data);
  },

  updateUserStatus(userId, status) {
    return apiClient
      .put(`/api/admin/users/${userId}/status`, { status })
      .then((r) => r.data);
  },

  deleteQuestion(questionHash) {
    return apiClient.delete(`/api/admin/questions/${questionHash}`).then((r) => r.data);
  },

  deleteAnswer(answerId) {
    return apiClient.delete(`/api/admin/answers/${answerId}`).then((r) => r.data);
  },
};
