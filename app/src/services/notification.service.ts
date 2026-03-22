import api from './api';
import { Notification } from '../types';

export async function getNotifications(page = 1): Promise<{
  notifications: Notification[];
  total: number;
  unreadCount: number;
  totalPages: number;
}> {
  const res = await api.get('/notifications', { params: { page } });
  return res.data as {
    notifications: Notification[];
    total: number;
    unreadCount: number;
    totalPages: number;
  };
}

export async function markRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get<{ success: boolean; unreadCount: number }>('/notifications/unread-count');
  return res.data.unreadCount;
}
