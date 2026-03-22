import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Props {
  onLoginPress: () => void;
}

export default function HomeScreen({ onLoginPress }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header logo */}
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Ionicons name="briefcase" size={36} color="#6C63FF" />
        </View>
        <Text style={styles.logoText}>Worksy</Text>
        <Text style={styles.tagline}>Kết nối thợ & khách hàng thông minh</Text>
      </View>

      {/* Feature cards */}
      <View style={styles.cards}>
        <View style={styles.card}>
          <Ionicons name="chatbubbles" size={28} color="#6C63FF" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Nhắn tin realtime</Text>
            <Text style={styles.cardDesc}>Chat trực tiếp, thông báo tức thì</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Ionicons name="search" size={28} color="#43B89C" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Tìm việc thông minh</Text>
            <Text style={styles.cardDesc}>Kết nối đúng thợ với đúng việc</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Ionicons name="shield-checkmark" size={28} color="#F9A825" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Uy tín & an toàn</Text>
            <Text style={styles.cardDesc}>Đánh giá minh bạch, giao dịch bảo đảm</Text>
          </View>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.loginBtn} onPress={onLoginPress} activeOpacity={0.85}>
          <Text style={styles.loginBtnText}>Đăng nhập</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          Chưa có tài khoản? Liên hệ quản trị viên để đăng ký.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },

  header: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#1a1a30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a40',
  },
  logoText: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 15, color: '#777', marginTop: 8, textAlign: 'center', lineHeight: 22 },

  cards: { paddingHorizontal: 24, gap: 12, marginBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#2a2a40',
    gap: 16,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#e8e8f0', marginBottom: 2 },
  cardDesc: { fontSize: 13, color: '#666', lineHeight: 18 },

  footer: { paddingHorizontal: 24, paddingBottom: 24, alignItems: 'center', gap: 14 },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 16,
    width: width - 48,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  loginBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  footerNote: { fontSize: 12, color: '#555', textAlign: 'center' },
});
