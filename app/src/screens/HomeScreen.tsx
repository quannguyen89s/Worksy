import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/theme/colors';
import type { RootStackParamList } from '@/navigation/types';
import * as SecureStore from 'expo-secure-store';
import authService from '@/services/authService';
import UserBottomBar from '@/components/navigation/UserBottomBar';
import UserHeader from '@/components/navigation/UserHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
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
      <UserHeader
        title="Worksy"
        subtitle="Chào mừng bạn trở lại"
        leftIcon="menu"
        onLeftPress={() => {}}
        rightLabel={loggingOut ? 'Đang thoát...' : 'Đăng xuất'}
        onRightPress={handleLogout}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 10) + 92 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thao tác nhanh</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('BrowseJobs')}
            >
              <Ionicons name="search-outline" size={24} color={COLORS.primaryDark} />
              <Text style={styles.actionBtnText}>Tìm việc</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('MyJobs')}
            >
              <Ionicons name="create-outline" size={24} color={COLORS.primaryDark} />
              <Text style={styles.actionBtnText}>Đăng tin</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('MyJobs')}
            >
              <Ionicons name="briefcase-outline" size={24} color={COLORS.primaryDark} />
              <Text style={styles.actionBtnText}>Tin của tôi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('WorkerApplies')}
            >
              <Ionicons name="document-text-outline" size={24} color={COLORS.primaryDark} />
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
            <Ionicons name="pricetag-outline" size={34} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Chưa có việc làm nào</Text>
          </View>
        </View>
      </ScrollView>
      <UserBottomBar navigation={navigation} active="Home" />
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
  emptyText: { fontSize: 15, color: COLORS.textMuted },
});
