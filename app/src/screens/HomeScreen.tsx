import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/theme/colors';
import type { RootStackParamList } from '@/navigation/types';
import * as SecureStore from 'expo-secure-store';
import AuthService from '@/services/authService';
import UserBottomBar from '@/components/navigation/UserBottomBar';
import UserHeader from '@/components/navigation/UserHeader';
import { decodeJwtRole, setAdminToken, syncAdminApiTokenFromAccessToken } from '@/api/adminApi';

type UserRole = 'customer' | 'worker' | 'admin' | 'guest';

export default function HomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [loggingOut, setLoggingOut] = useState(false);
  const [role, setRole] = useState<UserRole>('guest');

  useFocusEffect(
    useCallback(() => {
      void SecureStore.getItemAsync('accessToken').then(async (token) => {
        if (!token) {
          setRole('guest');
          return;
        }
        const decoded = decodeJwtRole(token);
        if (decoded === 'admin') {
          await syncAdminApiTokenFromAccessToken(token);
          navigation.reset({ index: 0, routes: [{ name: 'AdminDashboard' }] });
          return;
        }
        if (decoded === 'customer' || decoded === 'worker') {
          setRole(decoded);
        } else {
          setRole('guest');
        }
      });
    }, [navigation]),
  );
  const handleOpenMessages = () => navigation.navigate('Messages');

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      if (accessToken) {
        await AuthService.logout();
      }
    } catch {
      // Always clear local auth data even if server logout fails.
    } finally {
      await Promise.all([
        setAdminToken(null),
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
        subtitle={
          role === 'customer'
            ? 'Không gian khách hàng'
            : role === 'worker'
              ? 'Không gian người lao động'
              : 'Worksy'
        }
        leftIcon="menu"
        onLeftPress={() => {}}
        rightLabel={loggingOut ? 'Đang thoát...' : 'Đăng xuất'}
        onRightPress={handleLogout}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 10) + 92 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thao tác nhanh</Text>
          <View style={styles.actionRow}>
            {role === 'customer' ? (
              <>
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
                  onPress={() => navigation.navigate('Notifications')}
                >
                  <Ionicons name="notifications-outline" size={24} color={COLORS.primaryDark} />
                  <Text style={styles.actionBtnText}>Thông báo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.85}
                  onPress={handleOpenMessages}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.primaryDark} />
                  <Text style={styles.actionBtnText}>Tin nhắn</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
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
                  onPress={() => navigation.navigate('WorkerApplies')}
                >
                  <Ionicons name="document-text-outline" size={24} color={COLORS.primaryDark} />
                  <Text style={styles.actionBtnText}>Đã ứng tuyển</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.85}
                  onPress={handleOpenMessages}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.primaryDark} />
                  <Text style={styles.actionBtnText}>Tin nhắn</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Khu vực tin nhắn — placeholder, design lại sau */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, styles.cardTitleCompact]}>Tin nhắn</Text>
          <Text style={styles.cardHint}>
            Danh sách cuộc trò chuyện sẽ hiển thị tại đây. Tạm thời mở màn hội thoại để xem tin nhắn.
          </Text>
          <TouchableOpacity
            style={styles.messagesRow}
            activeOpacity={0.85}
            onPress={handleOpenMessages}
          >
            <View style={styles.messagesRowIcon}>
              <Ionicons name="chatbubbles-outline" size={26} color={COLORS.primaryDark} />
            </View>
            <View style={styles.messagesRowText}>
              <Text style={styles.messagesRowTitle}>Mở tin nhắn</Text>
              <Text style={styles.messagesRowSub}>Xem tất cả cuộc trò chuyện</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tổng quan</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>
                {role === 'customer' ? 'Tin đã đăng' : 'Đơn đã ứng tuyển'}
              </Text>
              <Text style={styles.statValue}>0</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>
                {role === 'customer' ? 'Tin đang mở' : 'Việc đang làm'}
              </Text>
              <Text style={styles.statValue}>0</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {role === 'customer' ? 'Tin mới nhất' : 'Danh sách ứng tuyển đã làm'}
          </Text>
          <View style={styles.emptyBox}>
            <Ionicons name="pricetag-outline" size={34} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {role === 'customer' ? 'Chưa có tin nào' : 'Chưa có lịch sử ứng tuyển'}
            </Text>
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
  cardTitleCompact: { marginBottom: 10 },
  cardHint: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 14,
  },
  messagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAFAF9',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  messagesRowIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesRowText: { flex: 1 },
  messagesRowTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  messagesRowSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
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
