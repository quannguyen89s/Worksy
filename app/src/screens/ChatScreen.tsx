import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { Socket } from 'socket.io-client';
import MessageBubble from '../components/MessageBubble';
import Avatar from '../components/Avatar';
import { getMessages, markRead, sendImageMessage } from '../services/chat.service';
import { getStoredUser } from '../services/authService';
import { connectSocket } from '../services/socket';
import { Message, RootStackParamList, User } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Chat'>;
  route: RouteProp<RootStackParamList, 'Chat'>;
};



function extractSenderId(senderId: unknown): string {
  if (typeof senderId === 'string') return senderId;
  if (senderId && typeof senderId === 'object') {
    const o = senderId as Record<string, unknown>;
    return String(o['_id'] ?? o['id'] ?? '');
  }
  return '';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h < 12 ? 'SA' : 'CH';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (msgDay.getTime() === today.getTime()) return `Hôm nay, ${formatTime(iso)}`;
  if (msgDay.getTime() === yesterday.getTime()) return `Hôm qua, ${formatTime(iso)}`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}


type ChatItem =
  | { type: 'message'; data: Message }
  | { type: 'date'; label: string; key: string };

function buildChatItems(messages: Message[]): ChatItem[] {
  const items: ChatItem[] = [];
  let lastDay = '';

  for (const msg of messages) {
    const created = msg.createdAt ?? '';
    if (created) {
      const d = new Date(created);
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (dayKey !== lastDay) {
        lastDay = dayKey;
        items.push({ type: 'date', label: dayLabel(created), key: `date-${dayKey}` });
      }
    }
    items.push({ type: 'message', data: msg });
  }
  return items;
}


export default function ChatScreen({ navigation, route }: Props) {
  const { conversationId, recipientName, recipientId } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);

  const flatRef = useRef<FlatList>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 120);
  }, []);

  const load = useCallback(async () => {
    try {
      const [msgs, user] = await Promise.all([getMessages(conversationId), getStoredUser()]);
      setMessages(msgs);
      setMe(user);
    } catch (e) {
      console.error('[ChatScreen] Lỗi tải tin nhắn:', JSON.stringify(e));
    }
  }, [conversationId]);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      const sock = await connectSocket();
      if (!mounted) return;

      socketRef.current = sock;
      sock.emit('join_conversation', conversationId);
      void markRead(conversationId).catch(() => null);

      if (recipientId) {
        sock.emit('check_online', recipientId, (res: { online: boolean }) => {
          setIsRecipientOnline(res.online);
        });
      }

      sock.on('user_online', ({ userId }: { userId: string }) => {
        if (userId === recipientId) setIsRecipientOnline(true);
      });

      sock.on('user_offline', ({ userId }: { userId: string }) => {
        if (userId === recipientId) setIsRecipientOnline(false);
      });

      sock.on('new_message', (msg: Message) => {
        const msgCid = typeof msg.conversationId === 'string'
          ? msg.conversationId
          : String((msg.conversationId as unknown as { toString(): string })?.toString?.() ?? '');

        if (msgCid === conversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
          scrollToBottom();
          void markRead(conversationId).catch(() => null);
        }
      });

      sock.on('user_typing', ({ conversationId: cid }: { conversationId: string }) => {
        if (cid === conversationId) setTyping(true);
      });

      sock.on('user_stop_typing', ({ conversationId: cid }: { conversationId: string }) => {
        if (cid === conversationId) setTyping(false);
      });
    };

    void setup();

    return () => {
      mounted = false;
      const sock = socketRef.current;
      if (sock) {
        sock.emit('leave_conversation', conversationId);
        sock.off('new_message');
        sock.off('user_typing');
        sock.off('user_stop_typing');
        sock.off('user_online');
        sock.off('user_offline');
      }
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [conversationId, scrollToBottom]);

  useEffect(() => {
    load().finally(() => {
      setLoading(false);
      scrollToBottom();
    });
  }, [load, scrollToBottom]);

  const sendMessage = async () => {
    const content = text.trim();
    if (!content) return;
    setText('');

    const sock = socketRef.current ?? (await connectSocket());
    sock.emit('send_message', { conversationId, content, type: 'text' });
    sock.emit('stop_typing', conversationId);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để đính kèm ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Lỗi', 'Không đọc được ảnh.');
      return;
    }

    setSendingImage(true);
    try {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      await sendImageMessage(conversationId, asset.base64, mimeType);
    } catch (e) {
      console.error('[ChatScreen] sendImage error:', e);
      Alert.alert('Lỗi', 'Không gửi được ảnh. Vui lòng thử lại.');
    } finally {
      setSendingImage(false);
    }
  };

  const handleTextChange = (val: string) => {
    setText(val);
    const sock = socketRef.current;
    if (sock) {
      sock.emit('typing', conversationId);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        sock.emit('stop_typing', conversationId);
      }, 1500);
    }
  };

  const myId = me?.id ?? me?._id ?? '';
  const chatItems = buildChatItems(messages);

  const renderItem = ({ item }: { item: ChatItem }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateSep}>
          <Text style={styles.dateSepText}>{item.label}</Text>
        </View>
      );
    }
    const isMine = extractSenderId(item.data.senderId) === myId;
    return <MessageBubble message={item.data} isMine={isMine} />;
  };

  const keyExtractor = (item: ChatItem) =>
    item.type === 'date' ? item.key : item.data._id;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#F9FAFB" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Avatar name={recipientName} size={38} online={isRecipientOnline} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{recipientName}</Text>
            <Text style={[styles.headerStatus, !isRecipientOnline && !typing && styles.headerStatusOffline]}>
              {typing ? 'Đang nhập...' : isRecipientOnline ? 'Online ngay bây giờ' : 'Offline'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="call-outline" size={22} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>

        {loading ? (
          <ActivityIndicator color="#C98A00" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            ref={flatRef}
            data={chatItems}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.msgList}
            onContentSizeChange={scrollToBottom}
            ListEmptyComponent={
              <Text style={styles.empty}>Hãy gửi tin nhắn đầu tiên!</Text>
            }
          />
        )}

        {/* Typing bubble */}
        {typing && (
          <View style={styles.typingRow}>
            <View style={styles.typingBubble}>
              <Text style={styles.typingDots}>● ● ●</Text>
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={pickImage}
            disabled={sendingImage}>
            {sendingImage
              ? <ActivityIndicator size="small" color="#C98A00" />
              : <Ionicons name="image-outline" size={22} color="#9CA3AF" />}
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#6B7280"
            value={text}
            onChangeText={handleTextChange}
            multiline
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!text.trim()}>
            <Ionicons name="send" size={18} color={text.trim() ? '#fff' : '#8A7243'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111827' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#1F2937',
    borderBottomWidth: 0.5,
    borderBottomColor: '#374151',
  },
  backBtn: { padding: 6 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  headerInfo: { marginLeft: 10 },
  headerName: { fontSize: 15, fontWeight: '700', color: '#F9FAFB' },
  headerStatus: { fontSize: 12, color: '#34D399', marginTop: 1 },
  headerStatusOffline: { color: '#6B7280' },
  headerRight: { flexDirection: 'row' },
  iconBtn: { padding: 8 },
  msgList: { paddingTop: 12, paddingBottom: 8 },
  dateSep: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateSepText: {
    fontSize: 12,
    color: '#9CA3AF',
    backgroundColor: '#1F2937',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  typingRow: { paddingHorizontal: 16, paddingBottom: 6 },
  typingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  typingDots: { color: '#9CA3AF', fontSize: 13, letterSpacing: 3 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#374151',
    backgroundColor: '#1F2937',
  },
  attachBtn: { padding: 8, marginBottom: 2 },
  input: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#F9FAFB',
    fontSize: 15,
    maxHeight: 120,
    marginHorizontal: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C98A00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: { backgroundColor: '#374151' },
  empty: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 40 },
});
