import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Pressable,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/navigation/types';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import * as jobApi from '@/api/jobApi';
import { COLORS } from '@/theme/colors';
import profileService from '@/services/profileService';
import UserBottomBar from '@/components/navigation/UserBottomBar';
import UserHeader from '@/components/navigation/UserHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const CARD_GAP = 10;
const FETCH_ALL_LIMIT = 500; // Số job tối đa fetch 1 lần (filter client-side)
const FETCH_DEBOUNCE_MS = 150;
/** Bán kính "Việc gần tôi": khoảng cách từ vị trí worker đến vị trí job < 20 km */
const NEAR_ME_RADIUS_KM = 20;
const PAD = 16;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - PAD * 2 - CARD_GAP) / 2);

const STATUS_OPTIONS: { id: string; label: string }[] = [
  { id: 'open', label: 'Đang tuyển' },
  { id: 'full', label: 'Đã đủ' },
];

const SORT_OPTIONS: { id: jobApi.BrowseJobsParams['sort']; label: string }[] = [
  { id: 'date_desc', label: 'Mới nhất' },
  { id: 'date_asc', label: 'Cũ nhất' },
  { id: 'price_asc', label: 'Giá tăng dần' },
  { id: 'price_desc', label: 'Giá giảm dần' },
  { id: 'distance', label: 'Gần nhất' },
];

const STATUS_LABELS: Record<string, string> = {
  open: 'Đang tuyển',
  full: 'Đã đủ',
  pending: 'Chờ duyệt',
  done: 'Hoàn thành',
};

const COMPLETION_SOURCE_LABELS: Record<string, string> = {
  manual: 'Khách hàng hoàn thành',
  auto: 'Tự động hoàn thành',
};

export default function BrowseJobsScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [allJobs, setAllJobs] = useState<jobApi.Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedJob, setSelectedJob] = useState<jobApi.Job | null>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [appliedByJob, setAppliedByJob] = useState<Record<string, { applyId: string; status: jobApi.Apply['status'] }>>({});
  const [filters, setFilters] = useState({
    statusIds: ['open', 'partial', 'full'] as string[],
    minPrice: '',
    maxPrice: '',
    skillTags: '',
    sort: 'date_desc' as jobApi.BrowseJobsParams['sort'],
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [nearMeMode, setNearMeMode] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState<jobApi.Job[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);

  const activeLocation = userLocation || deviceLocation;

  const loadToken = useCallback(async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    setAccessToken(token ?? '');
  }, []);

  const loadUserLocation = useCallback(async () => {
    try {
      const res = await profileService.getProfile();
      const p = res?.result;
      if (p?.location?.lat != null && p?.location?.lng != null) {
        setUserLocation({ lat: p.location.lat, lng: p.location.lng });
      }
    } catch {
      setUserLocation(null);
    }
  }, []);

  const getDeviceLocation = useCallback(async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền', 'Cho phép truy cập vị trí để tìm việc gần bạn');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setDeviceLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setNearMeMode(true);
    } catch {
      Alert.alert('Lỗi', 'Không thể lấy vị trí');
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  /** Fetch tất cả job khi vào / refresh - không áp filter (filter ở client) */
  const fetchAllJobs = useCallback(
    async () => {
      if (!accessToken.trim()) {
        setAllJobs([]);
        return;
      }
      setLoading(true);
      try {
        const params: jobApi.BrowseJobsParams = {
          status: 'open,partial,full',
          sort: activeLocation ? 'distance' : 'date_desc',
          page: 1,
          limit: FETCH_ALL_LIMIT,
        };
        if (activeLocation) {
          params.lat = activeLocation.lat;
          params.lng = activeLocation.lng;
          params.radiusKm = 9999; // Lấy tất cả, filter "gần tôi" ở client
        }
        const result = await jobApi.browseJobs(accessToken, params);
        setAllJobs(result.data ?? []);
      } catch {
        setAllJobs([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, activeLocation],
  );

  /** Filter client-side theo search, status, price, skillTags, nearMeMode, sort */
  const filteredJobs = useMemo(() => {
    let list = [...allJobs];

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (j) =>
          (j.title ?? '').toLowerCase().includes(q) ||
          (j.description ?? '').toLowerCase().includes(q) ||
          (j.skillTags ?? []).some((t) => String(t).toLowerCase().includes(q)),
      );
    }

    // Status
    if (filters.statusIds.length > 0) {
      list = list.filter((j) => filters.statusIds.includes(j.status));
    }

    // Price
    const minP = filters.minPrice ? parseFloat(filters.minPrice) : NaN;
    const maxP = filters.maxPrice ? parseFloat(filters.maxPrice) : NaN;
    if (Number.isFinite(minP)) list = list.filter((j) => (j.price ?? 0) >= minP);
    if (Number.isFinite(maxP)) list = list.filter((j) => (j.price ?? 0) <= maxP);

    // Skill tags
    const tags = filters.skillTags.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (tags.length > 0) {
      list = list.filter((j) =>
        tags.some((t) => (j.skillTags ?? []).some((st) => String(st).toLowerCase().includes(t))),
      );
    }

    // Việc gần tôi (dưới 20km)
    if (nearMeMode) {
      list = list.filter((j) => j.distanceKm != null && j.distanceKm <= NEAR_ME_RADIUS_KM);
    }

    // Sort
    const sort = nearMeMode && activeLocation ? 'distance' : filters.sort;
    if (sort === 'price_asc') list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (sort === 'price_desc') list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sort === 'date_asc') list.sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
    else if (sort === 'date_desc') list.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    else if (sort === 'distance' && activeLocation) list.sort((a, b) => ((a.distanceKm ?? 999) - (b.distanceKm ?? 999)));

    return list;
  }, [allJobs, search, filters, nearMeMode, activeLocation]);

  const fetchRecommended = useCallback(async () => {
    if (!accessToken.trim() || !activeLocation) return;
    setLoadingRecommended(true);
    try {
      const data = await jobApi.listRecommendedJobs(accessToken, {
        lat: activeLocation.lat,
        lng: activeLocation.lng,
        limit: 8,
        radiusKm: NEAR_ME_RADIUS_KM,
      });
      setRecommendedJobs(data);
    } catch {
      setRecommendedJobs([]);
    } finally {
      setLoadingRecommended(false);
    }
  }, [accessToken, activeLocation]);

  const fetchMyApplies = useCallback(async () => {
    if (!accessToken.trim()) {
      setAppliedByJob({});
      return;
    }
    try {
      const applies = await jobApi.listMyApplies(accessToken.trim());
      const map: Record<string, { applyId: string; status: jobApi.Apply['status'] }> = {};
      for (const row of applies) {
        const jobId = typeof row.jobId === 'string' ? row.jobId : row.jobId?._id;
        if (!jobId) continue;
        if (row.status === 'pending' || row.status === 'accepted') {
          map[jobId] = { applyId: row._id, status: row.status };
        }
      }
      setAppliedByJob(map);
    } catch {
      setAppliedByJob({});
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadToken();
      loadUserLocation();
    }, [loadToken, loadUserLocation]),
  );

  // Fetch tất cả job khi vào / khi có location (filter client-side)
  useEffect(() => {
    if (!accessToken) return;
    void fetchMyApplies();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      fetchAllJobs();
    }, FETCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [accessToken, activeLocation, fetchAllJobs, fetchMyApplies]);

  // Fetch recommended when we have location
  useEffect(() => {
    if (accessToken && activeLocation) void fetchRecommended();
    else setRecommendedJobs([]);
  }, [accessToken, activeLocation, fetchRecommended]);

  const applyFilterAndClose = useCallback(() => {
    setShowFilter(false);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllJobs();
  }, [fetchAllJobs]);

  const toggleStatus = (id: string) => {
    setFilters((f) =>
      f.statusIds.includes(id) ? { ...f, statusIds: f.statusIds.filter((s) => s !== id) } : { ...f, statusIds: [...f.statusIds, id] },
    );
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }),
    );
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      open: COLORS.open,
      partial: COLORS.partial,
      full: COLORS.full,
      pending: '#F59E0B',
      done: '#6B7280',
    };
    return map[status] ?? '#6B7280';
  };

  const getApplyState = (jobId: string) => appliedByJob[jobId];
  const isApplied = (jobId: string) => Boolean(getApplyState(jobId));
  const canCancelApply = (jobId: string) => getApplyState(jobId)?.status === 'pending';
  const canApply = (job: jobApi.Job) =>
    (job.status === 'open' || job.status === 'partial') && !isApplied(job._id);

  const confirmApply = (job: jobApi.Job) => {
    Alert.alert(
      'Xác nhận ứng tuyển',
      `Bạn muốn ứng tuyển job "${job.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Ứng tuyển', onPress: () => void handleApply(job) },
      ],
    );
  };

  const handleApply = async (job: jobApi.Job) => {
    if (!accessToken.trim()) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để ứng tuyển.');
      return;
    }
    if (!canApply(job)) {
      Alert.alert('Thông báo', 'Công việc này hiện không thể ứng tuyển.');
      return;
    }
    setApplyingJobId(job._id);
    try {
      await jobApi.applyJob(accessToken.trim(), { jobId: job._id });
      Alert.alert('Thành công', 'Đã gửi đơn ứng tuyển.');
      await fetchMyApplies();
    } catch (err: unknown) {
      Alert.alert('Lỗi', jobApi.getErrorMessage(err));
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleCancelApply = (job: jobApi.Job) => {
    const applyState = getApplyState(job._id);
    if (!applyState || applyState.status !== 'pending') {
      Alert.alert('Thông báo', 'Đơn này không thể hủy.');
      return;
    }
    Alert.alert(
      'Xác nhận hủy ứng tuyển',
      `Bạn muốn hủy đơn ứng tuyển job "${job.title}"?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: async () => {
            setApplyingJobId(job._id);
            try {
              await jobApi.cancelApply(accessToken.trim(), applyState.applyId);
              Alert.alert('Thành công', 'Đã hủy đơn ứng tuyển.');
              await fetchMyApplies();
            } catch (err: unknown) {
              Alert.alert('Lỗi', jobApi.getErrorMessage(err));
            } finally {
              setApplyingJobId(null);
            }
          },
        },
      ],
    );
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString('vi-VN');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bg }]} edges={['top']}>
      <UserHeader
        title="Tìm việc làm"
        subtitle="Các tin tuyển đang mở"
        leftIcon="menu"
        onLeftPress={() => navigation.navigate('Home')}
        rightLabel="Đăng xuất"
        onRightPress={handleLogout}
      />

      {/* Search + Filter */}
      <View style={styles.searchCard}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tiêu đề, mô tả, kỹ năng... (realtime)"
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilter(true)}
          >
            <View style={styles.filterBtnInner}>
              <Ionicons name="options-outline" size={16} color={COLORS.primaryDark} />
              <Text style={styles.filterBtnText}>Lọc</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.nearMeRow}>
          {activeLocation ? (
            <TouchableOpacity
              style={[styles.nearMeChip, nearMeMode && styles.nearMeChipActive]}
              onPress={() => setNearMeMode(!nearMeMode)}
              activeOpacity={0.85}
            >
              <Ionicons name="location" size={16} color={nearMeMode ? '#fff' : COLORS.primary} />
              <Text style={[styles.nearMeChipText, nearMeMode && styles.nearMeChipTextActive]}>
                Việc gần tôi (dưới {NEAR_ME_RADIUS_KM} km)
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.getLocationBtn}
              onPress={getDeviceLocation}
              disabled={loadingLocation}
            >
              <Ionicons name="location-outline" size={16} color={COLORS.primary} />
              <Text style={styles.getLocationBtnText}>
                {loadingLocation ? 'Đang lấy...' : 'Lấy vị trí để tìm việc gần bạn'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.viewModeRow}>
          <TouchableOpacity
            style={[styles.viewModeBtn, viewMode === 'grid' && styles.viewModeBtnActive]}
            onPress={() => setViewMode('grid')}
            activeOpacity={0.85}
          >
            <Ionicons
              name="grid-outline"
              size={15}
              color={viewMode === 'grid' ? COLORS.primaryDark : COLORS.textMuted}
            />
            <Text style={[styles.viewModeText, viewMode === 'grid' && styles.viewModeTextActive]}>
              Lưới
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeBtn, viewMode === 'list' && styles.viewModeBtnActive]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.85}
          >
            <Ionicons
              name="list-outline"
              size={15}
              color={viewMode === 'list' ? COLORS.primaryDark : COLORS.textMuted}
            />
            <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
              List
            </Text>
          </TouchableOpacity>
        </View>
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        )}
      </View>

      {/* Job list */}
      <FlatList
        key={viewMode}
        data={filteredJobs}
        keyExtractor={(job) => job._id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        style={styles.list}
        contentContainerStyle={[styles.scrollContent, filteredJobs.length === 0 && recommendedJobs.length === 0 && styles.emptyList]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          recommendedJobs.length > 0 ? (
            <View style={styles.recommendedSection}>
              <Text style={styles.recommendedTitle}>Gợi ý cho bạn</Text>
              <Text style={styles.recommendedSubtitle}>
                Khoảng cách từ vị trí bạn đăng ký đến vị trí làm việc dưới {NEAR_ME_RADIUS_KM} km
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendedScroll}
              >
                {recommendedJobs.map((job) => (
                  <TouchableOpacity
                    key={job._id}
                    style={styles.recommendedCard}
                    activeOpacity={0.8}
                    onPress={() => setSelectedJob(job)}
                  >
                    <Text style={styles.recommendedCardTitle} numberOfLines={2}>{job.title}</Text>
                    <Text style={styles.recommendedCardPrice}>{job.price?.toLocaleString('vi-VN')} VNĐ</Text>
                    {(job.distanceKm != null || job.address) && (
                      <View style={styles.recommendedCardMeta}>
                        <Ionicons name="location" size={12} color={COLORS.textMuted} />
                        <Text style={styles.recommendedCardMetaText} numberOfLines={1}>
                          {job.distanceKm != null ? `~${job.distanceKm.toFixed(1)} km` : job.address}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={42} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Chưa có tin nào phù hợp</Text>
              <Text style={styles.emptyHint}>Thử thay đổi từ khóa hoặc bộ lọc</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        renderItem={({ item: job }) => (
          <TouchableOpacity
            style={[
              styles.jobCard,
              viewMode === 'grid' ? styles.jobCardGrid : styles.jobCardList,
            ]}
            activeOpacity={0.7}
            onPress={() => setSelectedJob(job)}
          >
            <View style={styles.jobCardContent}>
              <View style={styles.jobCardHeader}>
                <Text style={styles.jobTitle} numberOfLines={2}>
                  {job.title}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(job.status) + '20' },
                  ]}
                >
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(job.status) }]}>
                    {STATUS_LABELS[job.status] ?? job.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.jobDesc} numberOfLines={viewMode === 'grid' ? 2 : 3}>
                {job.description}
              </Text>
              <View style={styles.jobCardFooter}>
                <Text style={styles.jobPrice}>{job.price?.toLocaleString('vi-VN')}</Text>
                <Text style={styles.jobMeta}>
                  {job.assignedWorkers}/{job.requiredWorkers} người
                </Text>
              </View>
              {(job.address?.trim() || job.distanceKm != null) ? (
                <View style={styles.jobAddressRow}>
                  <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.jobAddressText} numberOfLines={1}>
                    {job.distanceKm != null ? `~${job.distanceKm.toFixed(1)} km` : job.address}
                  </Text>
                </View>
              ) : null}
              {job.scheduledAt ? (
                <Text style={styles.jobScheduleText}>Lịch: {formatDateTime(job.scheduledAt)}</Text>
              ) : null}
              {(job.skillTags?.length ?? 0) > 0 && (
                <View style={styles.skillRow}>
                  {(job.skillTags ?? []).slice(0, viewMode === 'grid' ? 2 : 4).map((tag, i) => (
                    <View key={i} style={styles.skillTag}>
                      <Text style={styles.skillTagText} numberOfLines={1}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.applyBtn,
                !canApply(job) && !canCancelApply(job._id) && styles.applyBtnDisabled,
              ]}
              activeOpacity={0.85}
              disabled={(!canApply(job) && !canCancelApply(job._id)) || applyingJobId === job._id}
              onPress={() => (canCancelApply(job._id) ? handleCancelApply(job) : confirmApply(job))}
            >
              <Text style={[styles.applyBtnText, !canApply(job) && !canCancelApply(job._id) && styles.applyBtnTextDisabled]}>
                {applyingJobId === job._id
                  ? 'Đang xử lý...'
                  : canCancelApply(job._id)
                    ? 'Hủy ứng tuyển'
                    : isApplied(job._id)
                      ? 'Đã được chọn'
                      : 'Ứng tuyển'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <UserBottomBar navigation={navigation} active="BrowseJobs" />

      {/* Filter Modal */}
      <Modal visible={showFilter} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilter(false)}>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            onStartShouldSetResponder={() => true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Bộ lọc</Text>

              <Text style={styles.filterLabel}>Trạng thái</Text>
              <View style={styles.statusOptions}>
                {STATUS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.statusChip,
                      filters.statusIds.includes(opt.id) && styles.statusChipActive,
                    ]}
                    onPress={() => toggleStatus(opt.id)}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        filters.statusIds.includes(opt.id) && styles.statusChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Khoảng giá (VNĐ)</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={[styles.filterInput, styles.filterInputHalf]}
                  placeholder="Từ"
                  placeholderTextColor={COLORS.textMuted}
                  value={filters.minPrice}
                  onChangeText={(t) => setFilters((f) => ({ ...f, minPrice: t }))}
                  keyboardType="numeric"
                />
                <Text style={styles.priceSeparator}>–</Text>
                <TextInput
                  style={[styles.filterInput, styles.filterInputHalf]}
                  placeholder="Đến"
                  placeholderTextColor={COLORS.textMuted}
                  value={filters.maxPrice}
                  onChangeText={(t) => setFilters((f) => ({ ...f, maxPrice: t }))}
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.filterLabel}>Kỹ năng (cách nhau bằng dấu phẩy)</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Ví dụ: Điện, Sửa chữa, Xây dựng"
                placeholderTextColor={COLORS.textMuted}
                value={filters.skillTags}
                onChangeText={(t) => setFilters((f) => ({ ...f, skillTags: t }))}
              />

              <Text style={styles.filterLabel}>Sắp xếp theo</Text>
              <View style={styles.sortRow}>
                {SORT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.sortBtn, filters.sort === opt.id && styles.sortBtnActive]}
                    onPress={() => setFilters((f) => ({ ...f, sort: opt.id }))}
                  >
                    <Text
                      style={[
                        styles.sortBtnText,
                        filters.sort === opt.id && styles.sortBtnTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnOutline]}
                  onPress={() =>
                    setFilters({
                      statusIds: ['open', 'partial', 'full'],
                      minPrice: '',
                      maxPrice: '',
                      skillTags: '',
                      sort: 'date_desc',
                    })
                  }
                >
                  <Text style={styles.btnOutlineText}>Xóa bộ lọc</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={applyFilterAndClose}
                >
                  <Text style={styles.btnPrimaryText}>Áp dụng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Modal>

      {/* Job Detail Modal */}
      <Modal
        visible={!!selectedJob}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedJob(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedJob(null)}>
          <View style={styles.detailModal} onStartShouldSetResponder={() => true}>
            {selectedJob && (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>{selectedJob.title}</Text>
                  <TouchableOpacity onPress={() => setSelectedJob(null)}>
                    <Ionicons name="close" size={22} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.detailBody}>
                  <View
                    style={[
                      styles.statusBadge,
                      styles.statusBadgeLarge,
                      { backgroundColor: getStatusColor(selectedJob.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: getStatusColor(selectedJob.status), fontSize: 14 },
                      ]}
                    >
                      {STATUS_LABELS[selectedJob.status] ?? selectedJob.status}
                    </Text>
                  </View>
                  <Text style={styles.detailDesc}>{selectedJob.description}</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Giá</Text>
                    <Text style={styles.detailValue}>
                      {selectedJob.price?.toLocaleString('vi-VN')} VNĐ
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Số lượng</Text>
                    <Text style={styles.detailValue}>
                      {selectedJob.assignedWorkers}/{selectedJob.requiredWorkers} người
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ngày giờ làm</Text>
                    <Text style={styles.detailValue}>
                      {formatDateTime(selectedJob.scheduledAt)}
                    </Text>
                  </View>
                  {(selectedJob.address?.trim()) ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Địa chỉ làm việc</Text>
                      <Text style={styles.detailValue}>{selectedJob.address}</Text>
                    </View>
                  ) : null}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Deadline auto done</Text>
                    <Text style={styles.detailValue}>
                      {formatDateTime(selectedJob.completionDueAt)}
                    </Text>
                  </View>
                  {selectedJob.status === 'done' && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Hoàn thành lúc</Text>
                        <Text style={styles.detailValue}>
                          {formatDateTime(selectedJob.completedAt)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Nguồn hoàn thành</Text>
                        <Text style={styles.detailValue}>
                          {COMPLETION_SOURCE_LABELS[selectedJob.completionSource ?? ''] ?? '--'}
                        </Text>
                      </View>
                    </>
                  )}
                  {(selectedJob.skillTags?.length ?? 0) > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Kỹ năng</Text>
                      <View style={styles.skillRow}>
                        {(selectedJob.skillTags ?? []).map((tag, i) => (
                          <View key={i} style={styles.skillTag}>
                            <Text style={styles.skillTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </ScrollView>
                <View style={styles.detailFooter}>
                  <TouchableOpacity
                    style={[
                      styles.btn,
                      styles.btnSecondary,
                      styles.detailActionBtn,
                      (!canApply(selectedJob) && !canCancelApply(selectedJob._id) || applyingJobId === selectedJob._id) && styles.pageBtnDisabled,
                    ]}
                    disabled={(!canApply(selectedJob) && !canCancelApply(selectedJob._id)) || applyingJobId === selectedJob._id}
                    onPress={() => (canCancelApply(selectedJob._id) ? handleCancelApply(selectedJob) : confirmApply(selectedJob))}
                  >
                    <Text style={styles.btnSecondaryText}>
                      {applyingJobId === selectedJob._id
                        ? 'Đang xử lý...'
                        : canCancelApply(selectedJob._id)
                          ? 'Hủy ứng tuyển'
                          : isApplied(selectedJob._id)
                            ? 'Đã được chọn'
                            : 'Ứng tuyển'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnPrimary, styles.detailActionBtn]}
                    onPress={() => setSelectedJob(null)}
                  >
                    <Text style={styles.btnPrimaryText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerLeft: {},
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  logoutBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.errorLight,
    borderRadius: 12,
  },
  logoutBtnText: { color: COLORS.error, fontWeight: '600', fontSize: 14 },
  searchCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchInput: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(180,83,9,0.2)',
  },
  filterBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.primaryDark },
  nearMeRow: { marginTop: 12, marginBottom: 4 },
  nearMeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  nearMeChipActive: {
    backgroundColor: COLORS.primary,
  },
  nearMeChipText: { fontSize: 14, fontWeight: '700', color: COLORS.primaryDark, marginLeft: 6 },
  nearMeChipTextActive: { color: '#fff' },
  getLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  getLocationBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.success, marginLeft: 8 },
  recommendedSection: { marginBottom: 20, paddingHorizontal: 4 },
  recommendedTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  recommendedSubtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12 },
  recommendedScroll: { paddingRight: 16 },
  recommendedCard: {
    width: 180,
    marginRight: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  recommendedCardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  recommendedCardPrice: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginBottom: 6 },
  recommendedCardMeta: { flexDirection: 'row', alignItems: 'center' },
  recommendedCardMetaText: { fontSize: 12, color: COLORS.textMuted, marginLeft: 4, flex: 1 },
  viewModeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  viewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewModeBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  viewModeText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  viewModeTextActive: { color: COLORS.primaryDark },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  loadingText: { fontSize: 13, color: COLORS.textMuted },
  btn: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  btnSecondary: { backgroundColor: '#FAFAF9', borderWidth: 1, borderColor: COLORS.border },
  btnSecondaryText: { color: COLORS.text, fontWeight: '600', fontSize: 15 },
  btnOutline: { borderWidth: 2, borderColor: COLORS.border },
  btnOutlineText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 15 },
  scroll: { flex: 1 },
  list: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 150 },
  emptyList: { flexGrow: 1 },
  gridRow: { gap: CARD_GAP },
  emptyState: {
    paddingVertical: 72,
    alignItems: 'center',
  },
  emptyText: { fontSize: 18, color: COLORS.textMuted, marginBottom: 8, fontWeight: '500' },
  emptyHint: { fontSize: 14, color: COLORS.textMuted, opacity: 0.8 },
  jobCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    minHeight: 210,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: CARD_GAP,
  },
  jobCardGrid: { width: CARD_WIDTH },
  jobCardList: { width: '100%' },
  jobCardContent: { flex: 1 },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusBadgeLarge: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 14 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  jobDesc: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, lineHeight: 18 },
  jobCardFooter: { flexDirection: 'column', marginBottom: 8, gap: 2 },
  jobPrice: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  jobMeta: { fontSize: 13, color: COLORS.textMuted },
  jobAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  jobAddressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  jobScheduleText: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 8 },
  applyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  applyBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  applyBtnTextDisabled: {
    color: COLORS.textMuted,
  },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 80,
  },
  skillTagText: { fontSize: 10, color: COLORS.primaryDark, fontWeight: '600' },
  pageBtnDisabled: { opacity: 0.4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalScroll: { maxHeight: '80%' },
  modalScrollContent: { paddingBottom: 40 },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 24 },
  filterLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 16 },
  filterInput: {
    backgroundColor: '#FAFAF9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterInputHalf: { flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceSeparator: { fontSize: 16, color: COLORS.textMuted, fontWeight: '600' },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  statusChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  statusChipText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  statusChipTextActive: { color: COLORS.primaryDark, fontWeight: '600' },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  sortBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortBtnActive: { backgroundColor: COLORS.primaryLight },
  sortBtnText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  sortBtnTextActive: { color: COLORS.primaryDark },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  detailModal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 22,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  detailTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, flex: 1 },
  detailBody: { maxHeight: 400, padding: 22 },
  detailDesc: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 24, marginBottom: 20 },
  detailRow: { marginBottom: 16 },
  detailSection: { marginBottom: 16 },
  detailLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  detailFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 22,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  detailActionBtn: {
    flexGrow: 1,
    minWidth: 130,
  },
});
