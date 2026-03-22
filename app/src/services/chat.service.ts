import api from './api';
import { Conversation, Message } from '../types';

export async function getConversations(): Promise<Conversation[]> {
  const res = await api.get<{ success: boolean; conversations: Conversation[] }>('/chat/conversations');
  return res.data.conversations;
}

export async function createConversation(recipientId: string, jobId?: string): Promise<Conversation> {
  const res = await api.post<{ success: boolean; conversation: Conversation }>('/chat/conversations', {
    recipientId,
    jobId,
  });
  return res.data.conversation;
}

export async function getMessages(conversationId: string, page = 1): Promise<Message[]> {
  const res = await api.get<{ success: boolean; messages: Message[] }>(
    `/chat/conversations/${conversationId}/messages`,
    { params: { page } },
  );
  return res.data.messages;
}

export async function markRead(conversationId: string): Promise<void> {
  await api.post(`/chat/conversations/${conversationId}/read`);
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get<{ success: boolean; unreadCount: number }>('/chat/unread');
  return res.data.unreadCount;
}

export async function sendImageMessage(
  conversationId: string,
  imageBase64: string,
  mimeType = 'image/jpeg',
): Promise<void> {
  await api.post(`/chat/conversations/${conversationId}/image`, { imageBase64, mimeType });
}
