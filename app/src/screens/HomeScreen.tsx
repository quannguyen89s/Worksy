import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getStoredUser } from '../services/authService';
import { User } from '../types';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getStoredUser().then(setUser);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()} 👋</Text>
            <Text style={styles.userName}>{user?.name ?? 'Bạn'}</Text>
          </View>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {(user?.name ?? 'W').charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="briefcase" size={32} color="#C87941" />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Worksy</Text>
            <Text style={styles.bannerSub}>Kết nối thợ &amp; khách hàng</Text>
          </View>
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>TRUY CẬP NHANH</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('ChatTab')}>
            <View style={[styles.quickIcon, { backgroundColor: '#F0E4D4' }]}>
              <Ionicons name="chatbubbles" size={26} color="#C87941" />
            </View>
            <Text style={styles.quickLabel}>Tin nhắn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('NotifTab')}>
            <View style={[styles.quickIcon, { backgroundColor: '#E4EDF0' }]}>
              <Ionicons name="notifications" size={26} color="#5A87C0" />
            </View>
            <Text style={styles.quickLabel}>Thông báo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard} activeOpacity={0.75}>
            <View style={[styles.quickIcon, { backgroundColor: '#E4F0E8' }]}>
              <Ionicons name="search" size={26} color="#5A9E7A" />
            </View>
            <Text style={styles.quickLabel}>Tìm việc</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard} activeOpacity={0.75}>
            <View style={[styles.quickIcon, { backgroundColor: '#F0EAE4' }]}>
              <Ionicons name="person" size={26} color="#8B6F5E" />
            </View>
            <Text style={styles.quickLabel}>Hồ sơ</Text>
          </TouchableOpacity>
        </View>

        {/* Info cards */}
        <Text style={styles.sectionTitle}>TÍNH NĂNG NỔI BẬT</Text>
        <View style={styles.infoList}>
          <View style={styles.infoCard}>
            <Ionicons name="flash" size={22} color="#C87941" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Chat realtime</Text>
              <Text style={styles.infoDesc}>Nhắn tin tức thì với thợ hoặc khách hàng</Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={22} color="#5A9E7A" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Uy tín &amp; an toàn</Text>
              <Text style={styles.infoDesc}>Đánh giá minh bạch, giao dịch bảo đảm</Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="location" size={22} color="#5A87C0" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Tìm thợ gần bạn</Text>
              <Text style={styles.infoDesc}>Kết nối đúng người, đúng việc, đúng nơi</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ChatTab')}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2EAE0' },
  scroll: { paddingBottom: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  greeting: {
    fontSize: 14,
    color: '#7A5C42',
    fontWeight: '600',
    marginBottom: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A0F0A',
    letterSpacing: -0.5,
  },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#C87941',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C87941',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#fff' },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#FBF7F3',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#8B6F5E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EDE3D8',
  },
  bannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F0E4D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: '#1A0F0A', letterSpacing: -0.3 },
  bannerSub: { fontSize: 13, color: '#7A5C42', marginTop: 3, fontWeight: '500' },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7A5C42',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 24,
  },
  quickCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: '#FBF7F3',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#8B6F5E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EDE3D8',
  },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickLabel: { fontSize: 13, fontWeight: '700', color: '#1A0F0A' },

  infoList: { paddingHorizontal: 16, gap: 10 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF7F3',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#8B6F5E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EDE3D8',
    gap: 14,
  },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#1A0F0A', marginBottom: 2 },
  infoDesc: { fontSize: 12, color: '#6B5040', lineHeight: 17 },

  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C87941',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C87941',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
});
