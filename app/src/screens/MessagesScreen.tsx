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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { Socket } from 'socket.io-client';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import UserBottomBar from '../components/navigation/UserBottomBar';
import { getConversations } from '../services/chat.service';
import { getStoredUser } from '../services/authService';
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
  const insets = useSafeAreaInsets();
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
      const err = e as { response?: { status?: number; data?: { message?: string } }; message?: string; code?: string };
      const msg = err?.response?.data?.message ?? err?.message ?? 'Lỗi tải dữ liệu';
      console.error('[MessagesScreen] load error:', msg, '| code:', err?.code, '| status:', err?.response?.status);
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
    if (conv.lastMessage.type === 'image') return 'Da gui 1 anh';
    const content = conv.lastMessage.content ?? '';
    if (content.startsWith('data:image/')) return 'Da gui 1 anh';
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
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => (navigation as any).navigate('Home')}>
            <Ionicons name="home-outline" size={22} color="#6A5A4A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="search" size={22} color="#6A5A4A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="add" size={24} color="#6A5A4A" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={16} color="#A0927E" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm cuộc trò chuyện..."
          placeholderTextColor="#B0A090"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="warning-outline" size={40} color="#C87941" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void load()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <ActivityIndicator color="#C87941" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 10) + 92 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C87941" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.empty}>Chưa có cuộc trò chuyện nào</Text>
            </View>
          }
        />
      )}
      <UserBottomBar navigation={navigation} active="Messages" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2EAE0' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#F2EAE0',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A0F0A',
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: 'row', gap: 2 },
  iconBtn: {
    padding: 8,
    backgroundColor: '#E8DDD2',
    borderRadius: 12,
    marginLeft: 6,
  },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAE2D8',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#DDD5C8',
    shadowColor: '#8B6F5E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#1A0F0A',
    fontSize: 14,
    fontWeight: '500',
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginVertical: 4,
    backgroundColor: '#FBF7F3',
    borderRadius: 18,
    shadowColor: '#8B6F5E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  itemBody: { flex: 1, marginLeft: 14 },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A0F0A',
    flex: 1,
    marginRight: 8,
  },
  itemTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B7060',
  },
  itemSub: { marginTop: 3 },
  rolePill: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7A5C42',
    backgroundColor: '#EDE3D8',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
    overflow: 'hidden',
  },
  itemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  itemPreview: {
    fontSize: 13,
    color: '#6B5040',
    flex: 1,
    marginRight: 8,
    lineHeight: 18,
  },
  itemPreviewBold: {
    color: '#1A0F0A',
    fontWeight: '600',
  },

  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  empty: { textAlign: 'center', color: '#7A6050', fontSize: 14, marginTop: 12, fontWeight: '500' },
  errorText: { color: '#B85C2A', fontSize: 14, textAlign: 'center', marginTop: 12, fontWeight: '500' },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: '#C87941',
    borderRadius: 24,
    shadowColor: '#C87941',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
