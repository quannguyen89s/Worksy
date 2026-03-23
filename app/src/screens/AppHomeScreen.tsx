import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../services/auth.service';
import { disconnectSocket } from '../services/socket';
import { User } from '../types';

type AppTabParamList = {
  HomeTab: undefined;
  ChatTab: undefined;
  NotifTab: undefined;
};

interface Props {
  onLogout: () => void;
}

export default function AppHomeScreen({ onLogout }: Props) {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('user').then((raw) => {
      if (raw) setUser(JSON.parse(raw) as User);
    });
  }, []);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
          disconnectSocket();
          onLogout();
        },
      },
    ]);
  };

  const roleLabel = user?.role === 'worker' ? 'Thợ' : 'Khách hàng';
  const greeting = user?.name ? `Xin chào, ${user.name}!` : 'Xin chào!';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <View style={styles.roleBadge}>
            <Ionicons
              name={user?.role === 'worker' ? 'construct' : 'person'}
              size={12}
              color="#6C63FF"
            />
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#E57373" />
        </TouchableOpacity>
      </View>

      {/* App logo */}
      <View style={styles.logoSection}>
        <View style={styles.logoWrap}>
          <Ionicons name="briefcase" size={44} color="#6C63FF" />
        </View>
        <Text style={styles.appName}>Worksy</Text>
        <Text style={styles.tagline}>Smart Job Matching</Text>
      </View>

      {/* Quick action cards */}
      <View style={styles.cardsSection}>
        <Text style={styles.sectionTitle}>Truy cập nhanh</Text>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ChatTab')} activeOpacity={0.8}>
          <View style={[styles.cardIcon, { backgroundColor: '#1e1a4a' }]}>
            <Ionicons name="chatbubbles" size={28} color="#6C63FF" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Tin nhắn</Text>
            <Text style={styles.cardDesc}>Xem và trả lời các cuộc trò chuyện</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#555" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('NotifTab')} activeOpacity={0.8}>
          <View style={[styles.cardIcon, { backgroundColor: '#1a2a1e' }]}>
            <Ionicons name="notifications" size={28} color="#43B89C" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Thông báo</Text>
            <Text style={styles.cardDesc}>Cập nhật về công việc và ứng tuyển</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Info section */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#43B89C" />
          <Text style={styles.infoText}>Kết nối an toàn & bảo mật</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="flash-outline" size={16} color="#F9A825" />
          <Text style={styles.infoText}>Nhắn tin & thông báo realtime</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { fontSize: 18, fontWeight: '700', color: '#e8e8f0' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  roleText: { fontSize: 12, color: '#6C63FF', fontWeight: '600' },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a40',
  },

  logoSection: { alignItems: 'center', paddingVertical: 32 },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: '#1a1a30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2a2a45',
  },
  appName: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 14, color: '#666', marginTop: 6 },

  cardsSection: { paddingHorizontal: 24, flex: 1 },
  sectionTitle: { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 12, letterSpacing: 0.5 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13132a',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e1e38',
    gap: 14,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#e8e8f0', marginBottom: 3 },
  cardDesc: { fontSize: 12, color: '#666', lineHeight: 17 },

  infoSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: { fontSize: 12, color: '#444' },
});
