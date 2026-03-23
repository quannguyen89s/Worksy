import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '@/theme/colors';
import type { RootStackParamList } from '@/navigation/types';
import * as SecureStore from 'expo-secure-store';
import authService from '@/services/authService';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      if (accessToken) {
        await authService.logout(accessToken);
      }
    } catch {
      // Always clear local auth data even if server logout fails.
    } finally {
      await Promise.all([
        SecureStore.deleteItemAsync('accessToken'),
        SecureStore.deleteItemAsync('refreshToken'),
      ]);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bg }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>Worksy</Text>
          <Text style={styles.greeting}>Chào mừng bạn trở lại</Text>
        </View>
        <TouchableOpacity
          style={[styles.logoutBtn, loggingOut && styles.logoutBtnDisabled]}
          activeOpacity={0.85}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.logoutBtnText}>Đăng xuất</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thao tác nhanh</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('BrowseJobs')}
            >
              <Text style={styles.actionIcon}>🔍</Text>
              <Text style={styles.actionBtnText}>Tìm việc</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('MyJobs')}
            >
              <Text style={styles.actionIcon}>📝</Text>
              <Text style={styles.actionBtnText}>Đăng tin</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('MyJobs')}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionBtnText}>Tin của tôi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('WorkerApplies')}
            >
              <Text style={styles.actionIcon}>🧾</Text>
              <Text style={styles.actionBtnText}>Đã ứng tuyển</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tổng quan</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Việc đã xem</Text>
              <Text style={styles.statValue}>0</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Tin đã đăng</Text>
              <Text style={styles.statValue}>0</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Việc làm mới nhất</Text>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📌</Text>
            <Text style={styles.emptyText}>Chưa có việc làm nào</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 22,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutBtn: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnDisabled: { opacity: 0.8 },
  logoutBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  logo: { fontSize: 30, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  greeting: { fontSize: 15, color: COLORS.textMuted, marginTop: 6 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 44 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 18 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  actionBtn: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(180, 83, 9, 0.15)',
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionBtnText: { color: COLORS.primaryDark, fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 14 },
  statBox: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: { fontSize: 14, color: COLORS.textMuted },
  statValue: { fontSize: 26, fontWeight: '800', color: COLORS.primary, marginTop: 6 },
  emptyBox: {
    backgroundColor: '#FAFAF9',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyIcon: { fontSize: 40, marginBottom: 12, opacity: 0.5 },
  emptyText: { fontSize: 15, color: COLORS.textMuted },
});
