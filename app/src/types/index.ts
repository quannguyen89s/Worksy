export interface User {
  /** Khi trả từ JWT/AsyncStorage → dùng id */
  id: string;
  /** Khi trả từ MongoDB populate → dùng _id */
  _id?: string;
  name: string;
  email?: string;
  role: 'customer' | 'worker';
  avatar?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: User | string;
  content: string;
  type: 'text' | 'image' | 'file';
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
  jobId?: { _id: string; title: string; status: string } | null;
  lastMessage?: Message | null;
  lastMessageAt: string | null;
  unreadCount?: Record<string, number>;
}

export interface Notification {
  _id: string;
  userId: string;
  type:
    | 'new_message'
    | 'job_application'
    | 'application_accepted'
    | 'application_rejected'
    | 'job_assigned'
    | 'job_completed';
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export type RootStackParamList = {
  Messages: undefined;
  Chat: { conversationId: string; recipientName: string; recipientId: string };
  Notifications: undefined;
};
