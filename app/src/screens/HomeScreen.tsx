import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/theme/colors';
import type { RootStackParamList } from '@/navigation/types';
import * as SecureStore from 'expo-secure-store';
import AuthService from '@/services/authService';
import UserBottomBar from '@/components/navigation/UserBottomBar';
import UserHeader from '@/components/navigation/UserHeader';
import { decodeJwtRole, setAdminToken, syncAdminApiTokenFromAccessToken } from '@/api/adminApi';
import { fetchWorkers, type WorkerListItem } from '@/services/workersService';
import { API_BASE_URL } from '@/config/api';

type UserRole = 'customer' | 'worker' | 'admin' | 'guest';

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = 20;
const BANNER_W = SCREEN_W - H_PAD * 2;

const POPULAR_SERVICES: { id: string; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; tint: string }[] = [
  { id: '1', label: 'Dọn dẹp', icon: 'sparkles-outline', tint: COLORS.primaryLight },
  { id: '2', label: 'Điện nước', icon: 'flash-outline', tint: '#E0E7FF' },
  { id: '3', label: 'Sửa chữa', icon: 'construct-outline', tint: '#FCE7F3' },
  { id: '4', label: 'Giao hàng', icon: 'car-outline', tint: COLORS.primaryLight },
  { id: '5', label: 'Chăm sóc', icon: 'heart-outline', tint: '#DCFCE7' },
  { id: '6', label: 'IT / PC', icon: 'desktop-outline', tint: '#FEF3C7' },
  { id: '7', label: 'Dạy kèm', icon: 'school-outline', tint: '#E0E7FF' },
  { id: '8', label: 'Khác', icon: 'grid-outline', tint: COLORS.borderLight },
];

const PROMO_SLIDES = [
  {
    badge: 'ƯU ĐÃI THÁNG',
    title: 'Giảm 20% cho lần đầu đăng tin',
    sub: 'Đăng việc trên Worksy, kết nối thợ uy tín gần bạn.',
  },
  {
    badge: 'WORKSY',
    title: 'Tìm thợ nhanh, làm việc minh bạch',
    sub: 'Theo dõi tin nhắn, thông báo và tiến độ ngay trên app.',
  },
];

function workerAvatarUri(avatar?: string): string | undefined {
  if (!avatar?.trim()) return undefined;
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return `${API_BASE_URL}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
}

export default function HomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [loggingOut, setLoggingOut] = useState(false);
  const [role, setRole] = useState<UserRole>('guest');
  const [locationCity, setLocationCity] = useState('Hà Nội');
  const [searchQuery, setSearchQuery] = useState('');
  const [bannerIndex, setBannerIndex] = useState(0);
  const [workers, setWorkers] = useState<WorkerListItem[]>([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [workersRefreshing, setWorkersRefreshing] = useState(false);
  const [workersError, setWorkersError] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<WorkerListItem | null>(null);

  const bottomContentPad = Math.max(insets.bottom, 10) + 92;

  const reloadWorkers = useCallback(async (opts?: { silent?: boolean }) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token || decodeJwtRole(token) !== 'customer') return;
    if (opts?.silent) setWorkersRefreshing(true);
    else setWorkersLoading(true);
    setWorkersError(null);
    try {
      const list = await fetchWorkers({
        limit: 30,
        search: searchQuery.trim() || undefined,
      });
      setWorkers(list);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setWorkersError(
        err?.response?.data?.message ?? err?.message ?? 'Không tải được danh sách thợ.',
      );
      setWorkers([]);
    } finally {
      setWorkersLoading(false);
      setWorkersRefreshing(false);
    }
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const token = await SecureStore.getItemAsync('accessToken');
        if (!token || decodeJwtRole(token) !== 'customer') return;
        void reloadWorkers();
      })();
    }, [reloadWorkers]),
  );

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
      // ignore
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

  const cities = useMemo(() => ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ'], []);

  const cycleLocation = () => {
    const i = cities.indexOf(locationCity);
    setLocationCity(cities[(i + 1) % cities.length]);
  };

  const onBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / SCREEN_W);
    if (i !== bannerIndex && i >= 0 && i < PROMO_SLIDES.length) setBannerIndex(i);
  };

  const submitSearch = () => {
    void reloadWorkers();
  };

  if (role === 'customer') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bg }]} edges={['top']}>
        {/* Header customer */}
        <View style={styles.custHeader}>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.85}
          >
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={22} color={COLORS.primaryDark} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.locationBlock} onPress={cycleLocation} activeOpacity={0.7}>
            <Text style={styles.locationLabel}>VỊ TRÍ</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationCity}>{locationCity}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconSquare}
              onPress={() => navigation.navigate('MyJobs')}
              activeOpacity={0.85}
            >
              <Ionicons name="search" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconSquare}
              onPress={handleLogout}
              disabled={loggingOut}
              activeOpacity={0.85}
            >
              <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: bottomContentPad }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={workersRefreshing}
              onRefresh={() => void reloadWorkers({ silent: true })}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* Search */}
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm thợ theo tên hoặc kỹ năng..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={submitSearch}
            />
          </View>

          {/* Banner carousel */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={SCREEN_W}
            snapToAlignment="start"
            onScroll={onBannerScroll}
            scrollEventThrottle={16}
          >
            {PROMO_SLIDES.map((slide, idx) => (
              <View key={idx} style={styles.bannerPage}>
                <LinearGradient
                  colors={[COLORS.primaryDark, COLORS.primary, '#C2410C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.bannerCard, { width: BANNER_W }]}
                >
                  <View style={styles.bannerDecor}>
                    <Ionicons name="construct" size={88} color="rgba(255,255,255,0.12)" />
                  </View>
                  <View style={styles.bannerBadge}>
                    <Text style={styles.bannerBadgeText}>{slide.badge}</Text>
                  </View>
                  <Text style={styles.bannerTitle}>{slide.title}</Text>
                  <Text style={styles.bannerSub}>{slide.sub}</Text>
                </LinearGradient>
              </View>
            ))}
          </ScrollView>
          <View style={styles.dotsRow}>
            {PROMO_SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === bannerIndex && styles.dotActive]} />
            ))}
          </View>

          {/* Dịch vụ phổ biến */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dịch vụ phổ biến</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyJobs')} activeOpacity={0.7}>
              <Text style={styles.sectionLink}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.serviceGrid}>
            {POPULAR_SERVICES.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.serviceCell}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('MyJobs')}
              >
                <View style={[styles.serviceIconBox, { backgroundColor: s.tint }]}>
                  <Ionicons name={s.icon} size={26} color={COLORS.primaryDark} />
                </View>
                <Text style={styles.serviceLabel} numberOfLines={2}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Thợ nổi bật — từ API /users/workers */}
          <View style={styles.workersSectionHeader}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Thợ nổi bật</Text>
            {workersLoading && !workersRefreshing ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : null}
          </View>
          {workersError ? (
            <Text style={styles.workersError}>{workersError}</Text>
          ) : null}
          {!workersLoading && workers.length === 0 && !workersError ? (
            <Text style={styles.workersEmpty}>Chưa có thợ. Chạy seed:{'\n'}cd backend → npm run seed:workers</Text>
          ) : null}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.workersRow}
          >
            {workers.map((w) => {
              const uri = workerAvatarUri(w.avatar);
              return (
                <View key={w._id} style={styles.workerCard}>
                  <View style={styles.workerCardBody}>
                    <View style={styles.workerAvatar}>
                      {uri ? (
                        <Image source={{ uri }} style={styles.workerAvatarImg} />
                      ) : (
                        <Ionicons name="person" size={36} color={COLORS.primaryDark} />
                      )}
                    </View>
                    <Text style={styles.workerName} numberOfLines={1}>
                      {w.name}
                    </Text>
                    <View style={styles.workerRatingRow}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.workerRatingText}>
                        {Number(w.rating).toFixed(1)} ({w.completedJobs}+)
                      </Text>
                    </View>
                    <View style={styles.workerTags}>
                      {(w.skills ?? []).slice(0, 3).map((t) => (
                        <View key={t} style={styles.workerTag}>
                          <Text style={styles.workerTagText} numberOfLines={1}>
                            {t}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.workerBtn}
                    activeOpacity={0.9}
                    onPress={() => setSelectedWorker(w)}
                  >
                    <Text style={styles.workerBtnText}>Xem hồ sơ</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          <Modal
            visible={selectedWorker !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedWorker(null)}
          >
            <Pressable style={styles.modalBackdrop} onPress={() => setSelectedWorker(null)}>
              <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                {selectedWorker ? (
                  <>
                    <View style={styles.modalAvatarWrap}>
                      {workerAvatarUri(selectedWorker.avatar) ? (
                        <Image
                          source={{ uri: workerAvatarUri(selectedWorker.avatar)! }}
                          style={styles.modalAvatarImg}
                        />
                      ) : (
                        <Ionicons name="person" size={48} color={COLORS.primaryDark} />
                      )}
                    </View>
                    <Text style={styles.modalName}>{selectedWorker.name}</Text>
                    <View style={styles.workerRatingRow}>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text style={styles.modalMeta}>
                        {Number(selectedWorker.rating).toFixed(1)} · {selectedWorker.completedJobs} việc đã làm
                      </Text>
                    </View>
                    <Text style={styles.modalSkillsTitle}>Kỹ năng</Text>
                    <View style={styles.modalTags}>
                      {(selectedWorker.skills ?? []).map((t) => (
                        <View key={t} style={styles.workerTag}>
                          <Text style={styles.workerTagText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={styles.modalCloseBtn}
                      onPress={() => setSelectedWorker(null)}
                    >
                      <Text style={styles.modalCloseBtnText}>Đóng</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.workerBtn, { marginTop: 10 }]}
                      onPress={() => {
                        setSelectedWorker(null);
                        navigation.navigate('Messages');
                      }}
                    >
                      <Text style={styles.workerBtnText}>Mở tin nhắn</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </Pressable>
            </Pressable>
          </Modal>

          {/* CTA gấp */}
          <LinearGradient
            colors={[COLORS.primaryDark, '#7C2D12']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaCard}
          >
            <View style={styles.ctaBolt}>
              <Ionicons name="flash" size={120} color="rgba(255,255,255,0.08)" />
            </View>
            <Text style={styles.ctaTitle}>Cần thợ ngay lập tức?</Text>
            <Text style={styles.ctaSub}>
              Đăng tin việc trên Worksy — kết nối thợ phù hợp, theo dõi tin nhắn trong vài phút.
            </Text>
            <TouchableOpacity
              style={styles.ctaBtn}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('MyJobs')}
            >
              <Text style={styles.ctaBtnText}>Đặt dịch vụ ngay</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.primaryDark} />
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>

        <UserBottomBar navigation={navigation} active="Home" />
      </SafeAreaView>
    );
  }

  if (role === 'worker') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.listScreen }]} edges={['top']}>
        <UserHeader
          title="Worksy"
          subtitle="Không gian người lao động"
          hideLeftButton
          rightSlot={
            <TouchableOpacity
              style={styles.workerHeaderAvatar}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Profile')}
            >
              <LinearGradient
                colors={[COLORS.primaryLight, '#FDE68A']}
                style={styles.workerHeaderAvatarInner}
              >
                <Ionicons name="person" size={19} color={COLORS.primaryDark} />
              </LinearGradient>
            </TouchableOpacity>
          }
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, styles.workerScrollContent, { paddingBottom: bottomContentPad }]}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[COLORS.primaryDark, COLORS.primary, '#C2410C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.workerHero}
          >
            <Ionicons name="briefcase-outline" size={80} color="rgba(255,255,255,0.15)" style={styles.workerHeroIconDecor} />
            <Text style={styles.workerHeroBadge}>WORKER DASHBOARD</Text>
            <Text style={styles.workerHeroTitle}>Sẵn sàng nhận việc hôm nay?</Text>
            <Text style={styles.workerHeroSub}>
              Theo dõi công việc mới, quản lý đơn ứng tuyển và chat với khách hàng tại một nơi.
            </Text>
            <View style={styles.workerHeroActionRow}>
              <TouchableOpacity
                style={styles.workerHeroPrimaryBtn}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('BrowseJobs')}
              >
                <Text style={styles.workerHeroPrimaryBtnText}>Tìm việc ngay</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.primaryDark} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.workerHeroGhostBtn}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('WorkerApplies')}
              >
                <Ionicons name="document-text-outline" size={16} color="#fff" />
                <Text style={styles.workerHeroGhostBtnText}>Đơn của tôi</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={styles.workerQuickGrid}>
            <TouchableOpacity
              style={styles.workerQuickCard}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('BrowseJobs')}
            >
              <View style={styles.workerQuickIconBox}>
                <Ionicons name="search-outline" size={22} color={COLORS.primaryDark} />
              </View>
              <Text style={styles.workerQuickTitle}>Tìm việc</Text>
              <Text style={styles.workerQuickDesc}>Danh sách việc phù hợp quanh bạn</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.workerQuickCard}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('WorkerApplies')}
            >
              <View style={styles.workerQuickIconBox}>
                <Ionicons name="checkmark-done-outline" size={22} color={COLORS.primaryDark} />
              </View>
              <Text style={styles.workerQuickTitle}>Đã ứng tuyển</Text>
              <Text style={styles.workerQuickDesc}>Xem trạng thái đơn và cập nhật</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.workerQuickCard} activeOpacity={0.88} onPress={handleOpenMessages}>
              <View style={styles.workerQuickIconBox}>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={COLORS.primaryDark} />
              </View>
              <Text style={styles.workerQuickTitle}>Tin nhắn</Text>
              <Text style={styles.workerQuickDesc}>Trao đổi nhanh với khách hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.workerQuickCard}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={styles.workerQuickIconBox}>
                <Ionicons name="person-circle-outline" size={22} color={COLORS.primaryDark} />
              </View>
              <Text style={styles.workerQuickTitle}>Hồ sơ</Text>
              <Text style={styles.workerQuickDesc}>Cập nhật thông tin và ảnh đại diện</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.workerStatsRow}>
            <View style={styles.workerStatCard}>
              <Text style={styles.workerStatLabel}>Đơn chờ xử lý</Text>
              <Text style={styles.workerStatValue}>--</Text>
            </View>
            <View style={styles.workerStatCard}>
              <Text style={styles.workerStatLabel}>Việc đang làm</Text>
              <Text style={styles.workerStatValue}>--</Text>
            </View>
          </View>

          <View style={styles.workerInfoCard}>
            <View style={styles.workerInfoIcon}>
              <Ionicons name="sparkles-outline" size={22} color={COLORS.primaryDark} />
            </View>
            <View style={styles.workerInfoTextWrap}>
              <Text style={styles.workerInfoTitle}>Mẹo tăng tỉ lệ nhận việc</Text>
              <Text style={styles.workerInfoSub}>
                Hoàn thiện hồ sơ, thêm kỹ năng rõ ràng và phản hồi tin nhắn nhanh để được ưu tiên.
              </Text>
            </View>
          </View>
        </ScrollView>
        <UserBottomBar navigation={navigation} active="Home" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bg }]} edges={['top']}>
      <UserHeader
        title="Worksy"
        subtitle="Đăng nhập để bắt đầu"
        leftIcon="menu"
        onLeftPress={() => {}}
        rightLabel={loggingOut ? 'Đang thoát...' : 'Đăng xuất'}
        onRightPress={handleLogout}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomContentPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bạn chưa đăng nhập</Text>
          <Text style={styles.cardHint}>
            Đăng nhập để tìm việc, quản lý đơn ứng tuyển và nhắn tin với khách hàng.
          </Text>
        </View>
      </ScrollView>
      <UserBottomBar navigation={navigation} active="Home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 44 },

  /* Customer header */
  custHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  avatarBtn: {},
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  locationBlock: { flex: 1, alignItems: 'center' },
  locationLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationCity: { fontSize: 17, fontWeight: '800', color: COLORS.primary },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: H_PAD,
    marginBottom: 16,
    backgroundColor: COLORS.borderLight,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },

  bannerPage: {
    width: SCREEN_W,
    alignItems: 'center',
  },
  bannerCard: {
    borderRadius: 20,
    padding: 20,
    minHeight: 160,
    overflow: 'hidden',
  },
  bannerDecor: {
    position: 'absolute',
    right: -8,
    bottom: -12,
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  bannerBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    maxWidth: '88%',
    lineHeight: 24,
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 8,
    maxWidth: '95%',
    lineHeight: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 22,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: COLORS.primary,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  sectionTitleStandalone: { paddingHorizontal: H_PAD, marginBottom: 14 },
  sectionLink: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: H_PAD - 4,
    marginBottom: 24,
  },
  serviceCell: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  serviceIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  workersRow: {
    paddingHorizontal: H_PAD,
    gap: 14,
    paddingBottom: 8,
    alignItems: 'stretch',
  },
  /** Chiều cao cố định + nút dính đáy — mọi thẻ đồng bộ */
  workerCard: {
    width: 200,
    height: 292,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  workerCardBody: {
    flexShrink: 1,
  },
  workerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  workerAvatarImg: { width: 64, height: 64, borderRadius: 32 },
  workersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    marginBottom: 10,
  },
  workersError: {
    color: COLORS.error,
    fontSize: 13,
    paddingHorizontal: H_PAD,
    marginBottom: 8,
  },
  workersEmpty: {
    color: COLORS.textMuted,
    fontSize: 13,
    paddingHorizontal: H_PAD,
    marginBottom: 12,
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modalAvatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryLight,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  modalAvatarImg: { width: 88, height: 88, borderRadius: 44 },
  modalName: { fontSize: 20, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  modalMeta: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  modalSkillsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 14,
    marginBottom: 8,
  },
  modalTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalActions: {
    marginTop: 18,
    gap: 10,
    width: '100%',
  },
  modalCloseBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.borderLight,
    width: '100%',
  },
  modalCloseBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  workerName: { fontSize: 16, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  workerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
  },
  workerRatingText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  workerTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 54,
    alignContent: 'flex-start',
  },
  workerTag: {
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  workerTagText: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary },
  workerBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primaryDark,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  workerBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  ctaCard: {
    marginHorizontal: H_PAD,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 20,
    padding: 22,
    overflow: 'hidden',
  },
  ctaBolt: { position: 'absolute', right: -20, top: -10 },
  ctaTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  ctaSub: { color: 'rgba(255,255,255,0.88)', fontSize: 14, marginTop: 10, lineHeight: 20 },
  ctaBtn: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
  },
  ctaBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.primaryDark },

  /* Worker Home */
  workerScrollContent: { paddingHorizontal: 16, paddingTop: 12 },
  workerHeaderAvatar: {},
  workerHeaderAvatarInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.card,
  },
  workerHero: {
    borderRadius: 18,
    padding: 18,
    overflow: 'hidden',
    marginBottom: 14,
  },
  workerHeroIconDecor: { position: 'absolute', right: -8, top: -10 },
  workerHeroBadge: {
    alignSelf: 'flex-start',
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(0,0,0,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  workerHeroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    maxWidth: '86%',
  },
  workerHeroSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: '92%',
  },
  workerHeroActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  workerHeroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flex: 1,
  },
  workerHeroPrimaryBtnText: { color: COLORS.primaryDark, fontSize: 14, fontWeight: '800' },
  workerHeroGhostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    paddingVertical: 11,
    paddingHorizontal: 12,
    minWidth: 118,
  },
  workerHeroGhostBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  workerQuickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  workerQuickCard: {
    width: '48.5%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 14,
    minHeight: 136,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  workerQuickIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    marginBottom: 10,
  },
  workerQuickTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  workerQuickDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
    marginTop: 6,
  },
  workerStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  workerStatCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 14,
  },
  workerStatLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  workerStatValue: { fontSize: 24, color: COLORS.primaryDark, fontWeight: '800', marginTop: 4 },
  workerInfoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  workerInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerInfoTextWrap: { flex: 1 },
  workerInfoTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  workerInfoSub: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginTop: 4 },

  /* Legacy cards */
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 22,
    marginBottom: 18,
    marginHorizontal: 20,
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
