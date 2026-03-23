import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import type { RootStackParamList } from '@/navigation/types';
import * as jobApi from '@/api/jobApi';
import { COLORS } from '@/theme/colors';
import UserBottomBar from '@/components/navigation/UserBottomBar';
import UserHeader from '@/components/navigation/UserHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ApplyFilter = 'all' | 'pending' | 'accepted' | 'rejected' | 'done';

const FILTERS: { id: ApplyFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Đang ứng tuyển' },
  { id: 'accepted', label: 'Được chọn' },
  { id: 'rejected', label: 'Bị từ chối' },
  { id: 'done', label: 'Đã hoàn thành' },
];

export default function WorkerAppliesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ApplyFilter>('all');
  const [rows, setRows] = useState<jobApi.Apply[]>([]);

  useFocusEffect(
    useCallback(() => {
      void SecureStore.getItemAsync('accessToken').then((token) => setAccessToken(token ?? ''));
    }, []),
  );

  const fetchData = useCallback(async () => {
    if (!accessToken.trim()) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const data = await jobApi.listMyApplies(accessToken.trim());
      setRows(data);
    } catch (err: unknown) {
      setRows([]);
      Alert.alert('Lỗi', jobApi.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const getJob = (row: jobApi.Apply) => (typeof row.jobId === 'string' ? null : row.jobId);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const job = getJob(row);
      const title = job?.title?.toLowerCase() ?? '';
      if (search.trim() && !title.includes(search.trim().toLowerCase())) return false;

      if (filter === 'all') return true;
      if (filter === 'done') return job?.status === 'done';
      return row.status === filter;
    });
  }, [rows, search, filter]);

  const formatDateTime = (iso?: string) => {
    if (!iso) return '--';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '--';
    return d.toLocaleString('vi-VN');
  };

  const statusLabel = (row: jobApi.Apply) => {
    const job = getJob(row);
    if (job?.status === 'done') return 'Đã hoàn thành';
    if (row.status === 'pending') return 'Đang ứng tuyển';
    if (row.status === 'accepted') return 'Được chọn';
    if (row.status === 'rejected') return 'Bị từ chối';
    return row.status;
  };

  const statusColor = (row: jobApi.Apply) => {
    const job = getJob(row);
    if (job?.status === 'done') return COLORS.textMuted;
    if (row.status === 'pending') return COLORS.warning;
    if (row.status === 'accepted') return COLORS.success;
    if (row.status === 'rejected') return COLORS.error;
    return COLORS.textMuted;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bg }]} edges={['top']}>
      <UserHeader
        title="Việc đã ứng tuyển"
        subtitle="Lịch sử và trạng thái công việc"
        leftIcon="menu"
        onLeftPress={() => navigation.navigate('Home')}
      />

      <View style={styles.searchCard}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên công việc..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[styles.filterChipText, filter === f.id && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 10) + 86 }]}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : filteredRows.length === 0 ? (
          <Text style={styles.empty}>Không có dữ liệu phù hợp.</Text>
        ) : (
          filteredRows.map((row) => {
            const job = getJob(row);
            return (
              <View key={row._id} style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.jobTitle}>{job?.title ?? 'Công việc'}</Text>
                  <View style={[styles.badge, { backgroundColor: `${statusColor(row)}22` }]}>
                    <Text style={[styles.badgeText, { color: statusColor(row) }]}>{statusLabel(row)}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>Giá: {(job?.price ?? 0).toLocaleString('vi-VN')} VNĐ</Text>
                <Text style={styles.meta}>Lịch làm: {formatDateTime(job?.scheduledAt)}</Text>
                <Text style={styles.meta}>Trạng thái job: {job?.status ?? '--'}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
      <UserBottomBar navigation={navigation} active="WorkerApplies" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  backText: { color: COLORS.primaryDark, fontSize: 18, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textMuted },
  searchCard: { backgroundColor: COLORS.card, marginHorizontal: 16, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.borderLight },
  searchInput: { backgroundColor: '#FAFAF9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
  filterRow: { gap: 8, paddingTop: 10 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#fff' },
  filterChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  filterChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: COLORS.primaryDark },
  content: { padding: 16, gap: 10 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 30 },
  card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.borderLight },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  jobTitle: { flex: 1, fontWeight: '700', color: COLORS.text, fontSize: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  meta: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 4 },
});

