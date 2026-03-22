import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { Socket } from 'socket.io-client';
import { getNotifications, markAllRead, markRead } from '../services/notification.service';
import { getConversations } from '../services/chat.service';
import { getStoredUser } from '../services/auth.service';
import { connectSocket } from '../services/socket';
import { Notification } from '../types';

const ICON_MAP: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  new_message: { name: 'chatbubble-ellipses', color: '#6C63FF' },
  job_application: { name: 'briefcase', color: '#43B89C' },
  application_accepted: { name: 'checkmark-circle', color: '#4CAF50' },
  application_rejected: { name: 'close-circle', color: '#E57373' },
  job_assigned: { name: 'person-add', color: '#F9A825' },
  job_completed: { name: 'trophy', color: '#64B5F6' },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)} giờ trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function groupByDay(items: Notification[]): { title: string; data: Notification[] }[] {
  const now = new Date();
  const todayStr = now.toDateString();
  const groups: Record<string, Notification[]> = {};

  for (const item of items) {
    const d = new Date(item.createdAt);
    const key = d.toDateString() === todayStr ? 'MỚI' : 'TRƯỚC ĐÓ';
    if (!groups[key]) groups[key] = [];
    groups[key]!.push(item);
  }
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [navigating, setNavigating] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  const load = useCallback(async () => {
    const res = await getNotifications();
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  }, []);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      const sock = await connectSocket();
      if (!mounted) return;
      socketRef.current = sock;
      sock.on('notification', () => { void load(); });
    };

    void setup();

    return () => {
      mounted = false;
      socketRef.current?.off('notification');
    };
  }, [load]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleMarkOne = async (id: string) => {
    await markRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAll = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handlePress = async (item: Notification) => {
    if (!item.isRead) void handleMarkOne(item._id);

    if (item.type === 'new_message') {
      const convId = item.data['conversationId'] as string | undefined;
      if (!convId) {
        navigation.navigate('ChatTab');
        return;
      }

      setNavigating(item._id);
      try {
        const [convs, me] = await Promise.all([getConversations(), getStoredUser()]);
        const myId = me?.id ?? me?._id ?? '';
        const conv = convs.find((c) => c._id === convId);

        let recipientName = 'Tin nhắn';
        let recipientId = '';

        if (conv) {
          const recipient = conv.participants.find((p) => {
            const pid = String(p._id ?? p.id ?? '');
            return pid !== myId;
          });
          recipientName = recipient?.name ?? 'Tin nhắn';
          recipientId = String(recipient?._id ?? recipient?.id ?? '');
        }

        navigation.navigate('ChatTab', {
          screen: 'Chat',
          params: { conversationId: convId, recipientName, recipientId },
        });
      } catch {
        navigation.navigate('ChatTab');
      } finally {
        setNavigating(null);
      }
    }
  };


  const grouped = groupByDay(notifications);

  const renderItem = ({ item }: { item: Notification }) => {
    const icon = ICON_MAP[item.type] ?? {
      name: 'notifications' as keyof typeof Ionicons.glyphMap,
      color: '#888',
    };
    const isNavigatingThis = navigating === item._id;
    const isClickable = item.type === 'new_message';

    return (
      <TouchableOpacity
        style={[styles.item, !item.isRead && styles.itemUnread]}
        activeOpacity={isClickable ? 0.7 : 1}
        onPress={() => void handlePress(item)}>
        <View style={[styles.iconWrap, { backgroundColor: icon.color + '22' }]}>
          {isNavigatingThis ? (
            <ActivityIndicator size="small" color={icon.color} />
          ) : (
            <Ionicons name={icon.name} size={22} color={icon.color} />
          )}
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemTop}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
            {isClickable && (
              <Ionicons name="chevron-forward" size={14} color="#555" style={styles.chevron} />
            )}
          </View>
          <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.itemTime}>{formatTime(item.createdAt)}</Text>
        </View>
        {!item.isRead && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAll}>
            <Text style={styles.readAll}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color="#6C63FF" style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={56} color="#333" />
          <Text style={styles.empty}>Chưa có thông báo nào</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.title}
          renderItem={({ item: group }) => (
            <>
              <Text style={styles.groupLabel}>{group.title}</Text>
              {group.data.map((n) => (
                <React.Fragment key={n._id}>{renderItem({ item: n })}</React.Fragment>
              ))}
            </>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  readAll: { fontSize: 14, color: '#6C63FF', fontWeight: '600' },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a2a',
  },
  itemUnread: { backgroundColor: '#13132a' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  itemContent: { flex: 1 },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemTitle: { fontSize: 14, fontWeight: '600', color: '#e8e8f0', flex: 1, marginBottom: 3 },
  chevron: { marginLeft: 4 },
  itemBody: { fontSize: 13, color: '#999', lineHeight: 18 },
  itemTime: { fontSize: 12, color: '#555', marginTop: 5 },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#6C63FF',
    marginTop: 6,
    marginLeft: 8,
    flexShrink: 0,
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  empty: { color: '#555', fontSize: 14 },
});
