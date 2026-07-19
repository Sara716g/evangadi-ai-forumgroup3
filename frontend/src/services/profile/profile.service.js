/**
 * Profile API service — read/update profile, upload avatar, manage credentials.
 */
import { apiClient } from '../core/api.client.js';

export const profileService = {
  /** Fetch the authenticated user's own profile. */
  getMyProfile() {
    return apiClient.get('/api/profile/me').then((r) => r.data.data);
  },

  /** Fetch any user's public profile by user ID. */
  getProfile(userId) {
    return apiClient.get(`/api/profile/${userId}`).then((r) => r.data.data);
  },

  /** Update profile fields (display_name, bio, etc.). */
  updateProfile(data) {
    return apiClient.put('/api/profile', data).then((r) => r.data.data);
  },

  /** Upload a new avatar image (multipart/form-data). */
  uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post('/api/profile/avatar', formData, {
      headers: { 'Content-Type': undefined },
    }).then((r) => r.data.data);
  },

  /** Add a credential (e.g., certification, badge) to the profile. */
  addCredential(type, title) {
    return apiClient.post('/api/profile/credentials', { type, title }).then((r) => r.data.data);
  },

  /** Remove a credential from the profile. */
  deleteCredential(credentialId) {
    return apiClient.delete(`/api/profile/credentials/${credentialId}`).then((r) => r.data.data);
  },
};
