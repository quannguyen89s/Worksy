import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { Socket } from 'socket.io-client';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { getConversations } from '../services/chat.service';
import { getStoredUser } from '../services/auth.service';
import { connectSocket } from '../services/socket';
import { Conversation, RootStackParamList, User } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Messages'> };


function formatTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin}p`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function extractId(obj: unknown): string {
  if (!obj || typeof obj !== 'object') return String(obj ?? '');
  const o = obj as Record<string, unknown>;
  return String(o['_id'] ?? o['id'] ?? '');
}


export default function MessagesScreen({ navigation }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filtered, setFiltered] = useState<Conversation[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [me, setMe] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  const socketRef = useRef<Socket | null>(null);

  const load = useCallback(async () => {
    try {
      setError('');
      const [convs, user] = await Promise.all([getConversations(), getStoredUser()]);
      setConversations(convs);
      setFiltered(convs);
      setMe(user);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      const msg = err?.response?.data?.message ?? err?.message ?? 'Lỗi tải dữ liệu';
      console.error('[MessagesScreen] load error:', JSON.stringify(e));
      setError(msg);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      const sock = await connectSocket();
      if (!mounted) return;
      socketRef.current = sock;

      sock.on('conversation_updated', () => { void load(); });
      sock.on('user_online', ({ userId }: { userId: string }) => {
        setOnlineIds((prev) => { const next = new Set(prev); next.add(userId); return next; });
      });
      sock.on('user_offline', ({ userId }: { userId: string }) => {
        setOnlineIds((prev) => { const next = new Set(prev); next.delete(userId); return next; });
      });
    };

    void setup();

    return () => {
      mounted = false;
      const sock = socketRef.current;
      if (sock) {
        sock.off('conversation_updated');
        sock.off('user_online');
        sock.off('user_offline');
      }
    };
  }, [load]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const participantIds = useMemo(() => {
    const myId = me?.id ?? me?._id ?? '';
    const ids = new Set<string>();
    for (const conv of conversations) {
      for (const p of conv.participants) {
        const pid = extractId(p);
        if (pid && pid !== myId) ids.add(pid);
      }
    }
    return Array.from(ids);
  }, [conversations, me]);

  useEffect(() => {
    const sock = socketRef.current;
    if (!sock || participantIds.length === 0) return;
    sock.emit('get_online_users', participantIds, (online: string[]) => {
      setOnlineIds(new Set(online));
    });
  }, [participantIds]);
  useEffect(() => {
    if (!query.trim()) {
      setFiltered(conversations);
    } else {
      const q = query.toLowerCase();
      setFiltered(
        conversations.filter((c) =>
          c.participants.some((p) => p.name?.toLowerCase().includes(q)),
        ),
      );
    }
  }, [query, conversations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };


  const getRecipient = (conv: Conversation): User | null => {
    if (!me) return conv.participants[0] ?? null;
    const myId = me.id ?? me._id ?? '';
    return (
      conv.participants.find((p) => extractId(p) !== myId) ??
      conv.participants[0] ??
      null
    );
  };

  const getUnread = (conv: Conversation): number => {
    if (!me || !conv.unreadCount) return 0;
    const myId = me.id ?? me._id ?? '';
    return conv.unreadCount[myId] ?? 0;
  };

  const getLastMessage = (conv: Conversation): string => {
    if (!conv.lastMessage) return 'Bắt đầu cuộc trò chuyện...';
    const content = conv.lastMessage.content ?? '';
    return content.length > 50 ? content.slice(0, 50) + '...' : content;
  };


  const renderItem = ({ item }: { item: Conversation }) => {
    const recipient = getRecipient(item);
    const unread = getUnread(item);
    const name = recipient?.name ?? 'Unknown';
    const roleLabel = recipient?.role === 'worker' ? 'Thợ' : 'Khách';
    const jobLabel = item.jobId?.title ?? null;

    return (
      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item._id,
            recipientName: name,
            recipientId: extractId(recipient),
          })
        }>
        <Avatar name={name} uri={recipient?.avatar || undefined} size={50} online={onlineIds.has(extractId(recipient))} />
        <View style={styles.itemBody}>
          <View style={styles.itemTop}>
            <Text style={styles.itemName} numberOfLines={1}>{name}</Text>
            <Text style={styles.itemTime}>{formatTime(item.lastMessageAt)}</Text>
          </View>
          <View style={styles.itemSub}>
            <Text style={styles.rolePill}>
              {roleLabel}{jobLabel ? ` · ${jobLabel}` : ''}
            </Text>
          </View>
          <View style={styles.itemBottom}>
            <Text
              style={[styles.itemPreview, unread > 0 && styles.itemPreviewBold]}
              numberOfLines={1}>
              {getLastMessage(item)}
            </Text>
            <Badge count={unread} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="search" size={22} color="#e8e8f0" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="add" size={24} color="#e8e8f0" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={16} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#666"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="warning-outline" size={40} color="#E57373" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void load()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <ActivityIndicator color="#6C63FF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.empty}>Chưa có cuộc trò chuyện nào</Text>
            </View>
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
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8 },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e30',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 42, color: '#e8e8f0', fontSize: 14 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1e1e30',
  },
  itemBody: { flex: 1, marginLeft: 14 },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: { fontSize: 15, fontWeight: '600', color: '#fff', flex: 1, marginRight: 8 },
  itemTime: { fontSize: 12, color: '#888' },
  itemSub: { marginTop: 2 },
  rolePill: { fontSize: 12, color: '#9b9bc0', marginTop: 2 },
  itemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  itemPreview: { fontSize: 13, color: '#888', flex: 1, marginRight: 8 },
  itemPreviewBold: { color: '#ccc', fontWeight: '500' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  empty: { textAlign: 'center', color: '#555', fontSize: 14, marginTop: 12 },
  errorText: { color: '#E57373', fontSize: 14, textAlign: 'center', marginTop: 12 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#6C63FF',
    borderRadius: 20,
  },
  retryText: { color: '#fff', fontWeight: '600' },
});
