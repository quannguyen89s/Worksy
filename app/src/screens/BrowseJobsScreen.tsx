import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Pressable,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import * as SecureStore from 'expo-secure-store';
import * as jobApi from '@/api/jobApi';
import { COLORS } from '@/theme/colors';

const CARD_GAP = 10;
const LIMIT_PER_PAGE = 10;
const DEBOUNCE_MS = 400;
const PAD = 16;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - PAD * 2 - CARD_GAP) / 2);

const STATUS_OPTIONS: { id: string; label: string }[] = [
  { id: 'open', label: 'Đang tuyển' },
  { id: 'partial', label: 'Một phần' },
  { id: 'full', label: 'Đã đủ' },
];

const SORT_OPTIONS: { id: jobApi.BrowseJobsParams['sort']; label: string }[] = [
  { id: 'date_desc', label: 'Mới nhất' },
  { id: 'date_asc', label: 'Cũ nhất' },
  { id: 'price_asc', label: 'Giá tăng dần' },
  { id: 'price_desc', label: 'Giá giảm dần' },
];

const STATUS_LABELS: Record<string, string> = {
  open: 'Đang tuyển',
  partial: 'Một phần',
  full: 'Đã đủ',
  pending: 'Chờ duyệt',
  done: 'Hoàn thành',
};

export default function BrowseJobsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [jobs, setJobs] = useState<jobApi.Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedJob, setSelectedJob] = useState<jobApi.Job | null>(null);
  const [filters, setFilters] = useState({
    statusIds: ['open', 'partial', 'full'] as string[],
    minPrice: '',
    maxPrice: '',
    skillTags: '',
    sort: 'date_desc' as jobApi.BrowseJobsParams['sort'],
  });

  const loadToken = useCallback(async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    setAccessToken(token ?? '');
  }, []);

  const fetchJobs = useCallback(
    async (pageNum: number = 1) => {
      if (!accessToken.trim()) {
        setJobs([]);
        setTotal(0);
        return;
      }
      setLoading(true);
      try {
        const params: jobApi.BrowseJobsParams = {
          search: search.trim() || undefined,
          status: filters.statusIds.length ? filters.statusIds.join(',') : 'open,partial,full',
          sort: filters.sort,
          page: pageNum,
          limit: LIMIT_PER_PAGE,
        };
        if (filters.minPrice) params.minPrice = parseFloat(filters.minPrice);
        if (filters.maxPrice) params.maxPrice = parseFloat(filters.maxPrice);
        if (filters.skillTags.trim()) {
          params.skillTags = filters.skillTags.split(',').map((s) => s.trim()).filter(Boolean).join(',');
        }
        const result = await jobApi.browseJobs(accessToken, params);
        setJobs(result.data);
        setTotal(result.total);
        setPage(result.page);
      } catch {
        setJobs([]);
        setTotal(0);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, search, filters],
  );

  useFocusEffect(
    useCallback(() => {
      loadToken();
    }, [loadToken]),
  );

  // Realtime search: debounce fetch when search/filters change
  useEffect(() => {
    if (!accessToken) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      fetchJobs(1);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [accessToken, search, filters, fetchJobs]);

  const applyFilterAndClose = useCallback(() => {
    setShowFilter(false);
    fetchJobs(1);
  }, [fetchJobs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJobs(1);
  }, [fetchJobs]);

  const goToPage = useCallback(
    (newPage: number) => {
      const totalPages = Math.ceil(total / LIMIT_PER_PAGE) || 1;
      if (newPage < 1 || newPage > totalPages) return;
      fetchJobs(newPage);
    },
    [total, fetchJobs],
  );

  const totalPages = Math.ceil(total / LIMIT_PER_PAGE) || 1;
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Tìm việc làm</Text>
          <Text style={styles.headerSubtitle}>Các tin tuyển đang mở</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

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
            <Text style={styles.filterBtnText}>⚙️ Lọc</Text>
          </TouchableOpacity>
        </View>
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        )}
      </View>

      {/* Job list - Grid 2 cột (nhóm thủ công theo hàng) */}
      <FlatList
        data={(() => {
          const rows: jobApi.Job[][] = [];
          for (let i = 0; i < jobs.length; i += 2) {
            rows.push(jobs.slice(i, i + 2));
          }
          return rows;
        })()}
        keyExtractor={(row) => row.map((j) => j._id).join('-')}
        style={styles.list}
        contentContainerStyle={[styles.scrollContent, jobs.length === 0 && styles.emptyList]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>Chưa có tin nào phù hợp</Text>
              <Text style={styles.emptyHint}>Thử thay đổi từ khóa hoặc bộ lọc</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        renderItem={({ item: row }) => (
          <View style={styles.cardRow}>
            {row.map((job, idx) => (
              <TouchableOpacity
                key={job._id}
                style={[styles.jobCard, idx === 0 && row.length > 1 && styles.jobCardLeft]}
                activeOpacity={0.7}
                onPress={() => setSelectedJob(job)}
              >
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
                <Text style={styles.jobDesc} numberOfLines={2}>
                  {job.description}
                </Text>
                <View style={styles.jobCardFooter}>
                  <Text style={styles.jobPrice}>{job.price?.toLocaleString('vi-VN')}</Text>
                  <Text style={styles.jobMeta}>
                    {job.assignedWorkers}/{job.requiredWorkers} người
                  </Text>
                </View>
            {(job.skillTags?.length ?? 0) > 0 && (
              <View style={styles.skillRow}>
                {(job.skillTags ?? []).slice(0, 2).map((tag, i) => (
                  <View key={i} style={styles.skillTag}>
                    <Text style={styles.skillTagText} numberOfLines={1}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
            ))}
            {row.length === 1 && <View style={styles.cardSpacer} />}
          </View>
        )}
      />

      {/* Pagination */}
      {total > 0 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
            onPress={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            <Text style={[styles.pageBtnText, page <= 1 && styles.pageBtnTextDisabled]}>← Trước</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfo}>
            Trang {page}/{totalPages} ({total} tin)
          </Text>
          <TouchableOpacity
            style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
            onPress={() => goToPage(page + 1)}
            disabled={page >= totalPages}
          >
            <Text style={[styles.pageBtnText, page >= totalPages && styles.pageBtnTextDisabled]}>Sau →</Text>
          </TouchableOpacity>
        </View>
      )}

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
                    <Text style={styles.closeBtn}>✕</Text>
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
                    style={[styles.btn, styles.btnPrimary, { flex: 1 }]}
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
  filterBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.primaryDark },
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
  scrollContent: { padding: 16, paddingBottom: 90 },
  emptyList: { flexGrow: 1 },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginBottom: CARD_GAP,
  },
  cardSpacer: { width: CARD_GAP },
  jobCardLeft: { marginRight: CARD_GAP },
  emptyState: {
    paddingVertical: 72,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16, opacity: 0.6 },
  emptyText: { fontSize: 18, color: COLORS.textMuted, marginBottom: 8, fontWeight: '500' },
  emptyHint: { fontSize: 14, color: COLORS.textMuted, opacity: 0.8 },
  jobCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,

  },
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
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 80,
  },
  skillTagText: { fontSize: 10, color: COLORS.primaryDark, fontWeight: '600' },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  pageBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  pageBtnTextDisabled: { color: COLORS.textMuted },
  pageInfo: { fontSize: 13, color: COLORS.textMuted },
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
  closeBtn: { fontSize: 22, color: COLORS.textMuted, fontWeight: '600' },
  detailBody: { maxHeight: 400, padding: 22 },
  detailDesc: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 24, marginBottom: 20 },
  detailRow: { marginBottom: 16 },
  detailSection: { marginBottom: 16 },
  detailLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  detailFooter: {
    flexDirection: 'row',
    padding: 22,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});
