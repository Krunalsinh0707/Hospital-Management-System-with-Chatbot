import api from './api';

export const notificationService = {
  getMyNotifications: async () => {
    const response = await api.get('/notifications/my');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  }
};

export default notificationService;
