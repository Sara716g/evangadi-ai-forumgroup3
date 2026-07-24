/**
 * Notification API service — list, mark-as-read, and delete user notifications.
 */
import { apiClient } from './core/api.client.js';

export const notificationService = {
  list() {
    return apiClient.get('/api/notifications').then((r) => r.data);
  },

  markAsRead(id) {
    return apiClient.put(`/api/notifications/${id}/read`).then((r) => r.data);
  },

  markAllAsRead() {
    return apiClient.put('/api/notifications/read-all').then((r) => r.data);
  },

  delete(id) {
    return apiClient.delete(`/api/notifications/${id}`).then((r) => r.data);
  },
};
