import { apiClient } from '../core/api.client.js';

export const profileService = {
  get() {
    return apiClient.get('/api/profile').then((r) => r.data);
  },

  update(data) {
    return apiClient.put('/api/profile', data).then((r) => r.data);
  },

  uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient
      .post('/api/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
