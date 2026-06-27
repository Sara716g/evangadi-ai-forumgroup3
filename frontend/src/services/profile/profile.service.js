import { apiClient } from '../core/api.client.js';

export const profileService = {
  getMyProfile() {
    return apiClient.get('/api/profile/me').then((r) => r.data.data);
  },

  getProfile(userId) {
    return apiClient.get(`/api/profile/${userId}`).then((r) => r.data.data);
  },

  updateProfile(data) {
    return apiClient.put('/api/profile', data).then((r) => r.data.data);
  },

  uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post('/api/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data);
  },

  addCredential(type, title) {
    return apiClient.post('/api/profile/credentials', { type, title }).then((r) => r.data.data);
  },

  deleteCredential(credentialId) {
    return apiClient.delete(`/api/profile/credentials/${credentialId}`).then((r) => r.data.data);
  },
};
