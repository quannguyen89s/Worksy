import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import type { RootStackParamList } from '@/navigation/types';
import {
  decodeJwtName,
  fetchOverview,
  fetchUsers,
  getAdminToken,
  setAdminToken,
  toErrMessage,
  type PendingApprovalRow,
  type RecentActivityRow,
  type UserRow,
} from '@/api/adminApi';
import authService from '@/services/authService';
import { adminTheme } from '@/constants/adminTheme';

type Props = StackScreenProps<RootStackParamList, 'AdminDashboard'>;

const T = adminTheme;

const TAB_H = 58;

const moneyFull = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);

function compactRevenue(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(3).replace(/\.?0+$/, '')}B VNĐ`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2).replace(/\.?0+$/, '')}M VNĐ`;
  return moneyFull(n);
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'U';
}

function roleLabel(role: string): string {
  if (role === 'worker') return 'NGƯỜI LAO ĐỘNG';
  if (role === 'customer') return 'KHÁCH HÀNG';
  return 'ADMIN';
}

function statusUser(u: UserRow): { text: string; color: string } {
  if (u.isVerified) return { text: 'Đã xác minh', color: T.trendGreen };
  return { text: 'Chưa xác minh', color: T.pendingOrange };
}

function nowLabel(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `Cập nhật lúc ${h}:${m} Hôm nay`;
}

function pendingVisual(row: PendingApprovalRow) {
  if (row.kind === 'user_verify') {
    return { icon: 'person' as const, tint: '#C48B9F' };
  }
  return { icon: 'briefcase-outline' as const, tint: T.brownMid };
}

function activityVisual(row: RecentActivityRow) {
  if (row.kind === 'job_done') {
    return { icon: 'checkmark-circle' as const, color: T.trendGreen };
  }
  if (row.kind === 'user_new') {
    return { icon: 'people' as const, color: T.brownMid };
  }
  return { icon: 'warning' as const, color: T.danger };
}

export default function AdminDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchOverview>> | null>(null);
  const [userPreview, setUserPreview] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [headerInitials, setHeaderInitials] = useState('AD');

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const tok = await getAdminToken();
      const nm = tok ? decodeJwtName(tok) : null;
      setHeaderInitials(initials(nm || 'Admin'));

      const [o, u] = await Promise.all([
        fetchOverview(),
        fetchUsers({ page: 1, limit: 4 }),
      ]);
      setData(o);
      setUserPreview(u.items);
    } catch (e: unknown) {
      setError(toErrMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filteredUsers = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return userPreview;
    return userPreview.filter(
      (u) =>
        u.name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s),
    );
  }, [userPreview, search]);

  const pendingJobsOnly = useMemo(
    () => (data?.pendingApprovals ?? []).filter((row) => row.kind === 'job_open'),
    [data],
  );

  async function logout() {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      if (accessToken) {
        await authService.logout(accessToken);
      }
    } catch {
      // Ignore API logout failures; local token cleanup still proceeds.
    } finally {
      await Promise.all([
        setAdminToken(null),
        SecureStore.deleteItemAsync('accessToken'),
        SecureStore.deleteItemAsync('refreshToken'),
      ]);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }

  function openMenu() {
    Alert.alert('Menu', undefined, [
      { text: 'Đăng xuất', style: 'destructive', onPress: () => void logout() },
      { text: 'Hủy', style: 'cancel' },
    ]);
  }

  const jobsRunning = data
    ? data.jobsOpen + data.jobsPartial + data.jobsFull
    : 0;
  const goalPct = data ? data.completionRate : 0;

  const bottomInset = Math.max(insets.bottom, 10) + TAB_H + 20;

  function revenueTrendBlock() {
    if (!data) return null;
    const { revenueTrendPercent, revenueCurrentPeriod, revenuePreviousPeriod, revenueTrendPeriodLabel } =
      data;
    let main: string;
    let positive: boolean | null = null;
    if (revenueTrendPercent !== null) {
      positive = revenueTrendPercent >= 0;
      const arrow = positive ? '↑' : '↓';
      main = `${arrow} ${Math.abs(revenueTrendPercent)}%`;
    } else if (revenueCurrentPeriod > 0 && revenuePreviousPeriod === 0) {
      main = 'Doanh thu mới trong kỳ';
      positive = null;
    } else if (revenueCurrentPeriod === 0 && revenuePreviousPeriod === 0) {
      main = 'Chưa có doanh thu (7 ngày)';
      positive = null;
    } else {
      main = '—';
      positive = null;
    }
    return { main, positive, hint: revenueTrendPeriodLabel };
  }
  const trend = revenueTrendBlock();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={openMenu}
          style={styles.headerSide}
          hitSlop={10}
          activeOpacity={0.7}>
          <Ionicons name="menu" size={26} color={T.brown} />
        </TouchableOpacity>
        <Text style={styles.headerBrand}>Worksy Admin</Text>
        <TouchableOpacity style={styles.avatarAu} activeOpacity={0.8} onPress={openMenu}>
          <Text style={styles.avatarAuText}>{headerInitials}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset }]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Tổng quan hệ thống</Text>
        <Text style={styles.pageTime}>{nowLabel()}</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading && !data ? (
          <ActivityIndicator size="large" color={T.gold} style={{ marginVertical: 32 }} />
        ) : null}

        {data ? (
          <>
            {/* Doanh thu */}
            <View style={styles.cardWhite}>
              <Text style={styles.kpiCaption}>TỔNG DOANH THU</Text>
              <Text style={styles.revenueHuge}>{compactRevenue(data.revenueDone)}</Text>
              {trend ? (
                <View style={styles.trendRow}>
                  <Text
                    style={[
                      styles.trendMain,
                      trend.positive === true && { color: T.trendGreen },
                      trend.positive === false && { color: T.danger },
                    ]}>
                    {trend.main}
                  </Text>
                  <Text style={styles.trendHint}>{trend.hint}</Text>
                </View>
              ) : null}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${goalPct}%` }]} />
              </View>
              <Text style={styles.goalText}>
                {data.totalJobs > 0
                  ? `${goalPct}% việc đã hoàn thành (done / tổng)`
                  : 'Chưa có việc trên hệ thống'}
              </Text>
            </View>

            {/* Người dùng — nền vàng */}
            <View style={styles.cardGold}>
              <View style={styles.cardGoldTop}>
                <Ionicons name="person-add-outline" size={28} color={T.brown} />
              </View>
              <Text style={styles.usersBig}>
                {new Intl.NumberFormat('vi-VN').format(data.totalUsers)} Người dùng
              </Text>
              <Text style={styles.usersSub}>Tổng đăng ký trên hệ thống</Text>
              <View style={styles.avatarStack}>
                {(data.recentUserInitials.length > 0
                  ? data.recentUserInitials
                  : ['—']
                ).map((ab, i) => (
                  <View key={`${ab}-${i}`} style={[styles.miniAv, { marginLeft: i === 0 ? 0 : -10 }]}>
                    <Text style={styles.miniAvText}>{ab}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Việc đang chạy */}
            <View style={styles.cardBeige}>
              <View style={styles.cardBeigeRow}>
                <Ionicons name="briefcase-outline" size={26} color={T.brownMid} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.jobsBig}>
                    {new Intl.NumberFormat('vi-VN').format(jobsRunning)} Công việc đang chạy
                  </Text>
                  <Text style={styles.jobsSub}>Mở + đang xử lý + đủ người</Text>
                </View>
              </View>
              <View style={styles.badgeStrong}>
                <Text style={styles.badgeStrongText}>{data.jobMomentumLabel}</Text>
              </View>
            </View>

            {/* Cần phê duyệt */}
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Cần phê duyệt</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AdminJobs')}>
                <Text style={styles.viewAll}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            {pendingJobsOnly.length === 0 ? (
              <Text style={styles.emptySection}>Không có mục chờ xử lý.</Text>
            ) : (
              pendingJobsOnly.map((row) => {
                const pv = pendingVisual(row);
                return (
                  <TouchableOpacity
                    key={row.id}
                    style={styles.pendingCard}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('AdminJobs')}>
                    <View style={[styles.pendingIcon, { backgroundColor: `${pv.tint}33` }]}>
                      <Ionicons name={pv.icon} size={22} color={pv.tint} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pendingTitle}>{row.title}</Text>
                      <Text style={styles.pendingSub}>{row.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {/* Hoạt động gần đây */}
            <Text style={[styles.sectionTitle, { marginTop: 22, marginBottom: 12 }]}>
              Hoạt động gần đây
            </Text>
            <View style={styles.timelineCard}>
              {data.recentActivity.length === 0 ? (
                <Text style={[styles.emptySection, { paddingHorizontal: 12, paddingVertical: 16 }]}>
                  Chưa có hoạt động gần đây.
                </Text>
              ) : (
                data.recentActivity.map((a, idx) => {
                  const av = activityVisual(a);
                  return (
                    <View
                      key={a.id}
                      style={[styles.timelineRow, idx > 0 && styles.timelineRowBorder]}>
                      <Ionicons name={av.icon} size={22} color={av.color} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.timelineTitle}>{a.title}</Text>
                        <Text style={styles.timelineSub}>{a.subtitle}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Quản lý người dùng */}
            <Text style={[styles.sectionTitle, { marginTop: 22, marginBottom: 12 }]}>
              Quản lý người dùng
            </Text>
            <View style={styles.mgmtCard}>
              <View style={styles.searchWrap}>
                <Ionicons name="search" size={20} color={T.brownMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm kiếm tên, email…"
                  placeholderTextColor={T.brownMuted}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              <View style={styles.tableHead}>
                <Text style={[styles.th, { flex: 1.2 }]}>NGƯỜI DÙNG</Text>
                <Text style={[styles.th, { flex: 0.9 }]}>VAI TRÒ</Text>
                <Text style={[styles.th, { flex: 0.75 }]}>TRẠNG THÁI</Text>
              </View>
              {filteredUsers.length === 0 ? (
                <Text style={styles.emptyUsers}>Không có dữ liệu hoặc chưa khớp tìm kiếm.</Text>
              ) : (
                filteredUsers.map((u) => {
                  const st = statusUser(u);
                  return (
                    <TouchableOpacity
                      key={u._id}
                      style={styles.tableRow}
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate('AdminUsers')}>
                      <View style={[styles.td, { flex: 1.2, flexDirection: 'row', alignItems: 'center' }]}>
                        <View style={styles.rowAv}>
                          <Text style={styles.rowAvText}>{initials(u.name)}</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.rowName} numberOfLines={1}>
                            {u.name}
                          </Text>
                          <Text style={styles.rowEmail} numberOfLines={1}>
                            {u.email}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.td, { flex: 0.9 }]}>
                        <View style={styles.rolePill}>
                          <Text style={styles.rolePillText} numberOfLines={1}>
                            {roleLabel(u.role)}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.td, { flex: 0.75 }]}>
                        <Text style={[styles.stText, { color: st.color }]}>{st.text}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
              <TouchableOpacity
                style={styles.fullListBtn}
                onPress={() => navigation.navigate('AdminUsers')}>
                <Text style={styles.fullListBtnText}>Mở danh sách đầy đủ</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.tabBar,
          {
            height: TAB_H + Math.max(insets.bottom, 10),
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('AdminDashboard')}
          activeOpacity={0.85}>
          <View style={[styles.tabIconBox, styles.tabIconBoxActive]}>
            <Ionicons name="stats-chart-outline" size={22} color={T.brown} />
          </View>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>DASHBOARD</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('AdminUsers')}
          activeOpacity={0.85}>
          <View style={styles.tabIconBox}>
            <Ionicons name="people" size={22} color={T.brownMuted} />
          </View>
          <Text style={styles.tabLabel}>USERS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('AdminJobs')}
          activeOpacity={0.85}>
          <View style={styles.tabIconBox}>
            <Ionicons name="briefcase-outline" size={22} color={T.brownMuted} />
          </View>
          <Text style={styles.tabLabel}>JOBS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('AdminAlerts')}
          activeOpacity={0.85}>
          <View style={styles.tabIconBox}>
            <Ionicons name="notifications-outline" size={22} color={T.brownMuted} />
          </View>
          <Text style={styles.tabLabel}>ALERTS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.pageTint },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.bgHeader,
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  headerSide: { width: 44, height: 44, justifyContent: 'center' },
  headerBrand: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: T.brown,
    letterSpacing: -0.3,
  },
  avatarAu: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: T.card,
  },
  avatarAuText: { fontSize: 13, fontWeight: '800', color: T.brown },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 20 },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: T.brown,
    letterSpacing: -0.5,
  },
  pageTime: { fontSize: 13, color: T.brownMuted, marginTop: 6, marginBottom: 20 },
  errorBox: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginBottom: 16,
  },
  errorText: { color: T.danger, fontSize: 14 },
  cardWhite: {
    backgroundColor: T.card,
    borderRadius: 28,
    padding: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: T.borderSoft,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 6,
  },
  kpiCaption: {
    fontSize: 11,
    fontWeight: '800',
    color: T.brownMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  revenueHuge: {
    fontSize: 28,
    fontWeight: '800',
    color: T.brown,
    letterSpacing: -0.5,
  },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 8 },
  trendMain: { fontSize: 15, fontWeight: '800', color: T.brownMid },
  trendHint: { fontSize: 12, color: T.brownMuted, flex: 1 },
  emptySection: { fontSize: 14, color: T.brownMuted, marginBottom: 10 },
  progressTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: T.creamCard,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: T.brown,
  },
  goalText: { fontSize: 12, color: T.brownMuted, marginTop: 8, fontWeight: '600' },
  cardGold: {
    backgroundColor: T.goldCard,
    borderRadius: 28,
    padding: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(74, 55, 7, 0.12)',
  },
  cardGoldTop: { marginBottom: 12 },
  usersBig: {
    fontSize: 22,
    fontWeight: '800',
    color: T.brown,
  },
  usersSub: { fontSize: 13, color: T.brownMid, marginTop: 4 },
  avatarStack: { flexDirection: 'row', marginTop: 16, alignItems: 'center' },
  miniAv: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.brownMid,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: T.goldCard,
  },
  miniAvText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  cardBeige: {
    backgroundColor: T.creamCard,
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  cardBeigeRow: { flexDirection: 'row', alignItems: 'center' },
  jobsBig: { fontSize: 18, fontWeight: '800', color: T.brown },
  jobsSub: { fontSize: 12, color: T.brownMuted, marginTop: 4 },
  badgeStrong: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(201, 162, 39, 0.45)',
  },
  badgeStrongText: { fontSize: 10, fontWeight: '900', color: T.brown, letterSpacing: 0.5 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: T.brown },
  viewAll: { fontSize: 14, fontWeight: '700', color: T.gold },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    borderRadius: 22,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.borderSoft,
    gap: 14,
  },
  pendingIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: { fontSize: 16, fontWeight: '700', color: T.brown },
  pendingSub: { fontSize: 13, color: T.brownMuted, marginTop: 4 },
  timelineCard: {
    backgroundColor: T.timelineBg,
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  timelineRow: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 12 },
  timelineRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(90,85,48,0.1)' },
  timelineTitle: { fontSize: 14, fontWeight: '700', color: T.brown },
  timelineSub: { fontSize: 12, color: T.brownMuted, marginTop: 4 },
  mgmtCard: {
    backgroundColor: T.card,
    borderRadius: 28,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.creamCard,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  searchInput: { flex: 1, fontSize: 15, color: T.brown, paddingVertical: 0 },
  tableHead: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  th: { fontSize: 9, fontWeight: '800', color: T.brownMuted, letterSpacing: 0.4 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.borderSoft,
  },
  td: { justifyContent: 'center' },
  rowAv: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowAvText: { fontSize: 11, fontWeight: '800', color: T.brown },
  rowName: { fontSize: 14, fontWeight: '700', color: T.brown },
  rowEmail: { fontSize: 11, color: T.brownMuted, marginTop: 2 },
  rolePill: {
    backgroundColor: T.pillBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  rolePillText: { fontSize: 8, fontWeight: '800', color: T.brown },
  stText: { fontSize: 11, fontWeight: '700' },
  emptyUsers: { paddingVertical: 20, textAlign: 'center', color: T.brownMuted, fontSize: 14 },
  fullListBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  fullListBtnText: { fontSize: 14, fontWeight: '700', color: T.gold },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: T.card,
    paddingTop: 8,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: T.borderSoft,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
    zIndex: 10,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabIconBox: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tabIconBoxActive: { backgroundColor: T.gold },
  tabLabel: { fontSize: 9, fontWeight: '800', color: T.brownMuted, letterSpacing: 0.3 },
  tabLabelActive: { color: T.brown },
});
