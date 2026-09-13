import { api } from './client';
import { Notification } from '../types';

export const notificationsApi = {
  // Get notifications
  getMyNotifications: async (unreadOnly = false): Promise<Notification[]> => {
    const query = unreadOnly ? '?unread=true' : '';
    return api.get<Notification[]>(`/notifications${query}`, false);
  },

  // Mark single as read
  markAsRead: async (id: number): Promise<void> => {
    return api.put(`/notifications/${id}/read`, {}, false);
  },

  // Mark all as read
  markAllAsRead: async (): Promise<void> => {
    return api.put('/notifications/read-all', {}, false);
  },
};
