import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '@/navigation/types';
import { fetchOverview, toErrMessage, type PendingApprovalRow, type RecentActivityRow, type Overview } from '@/api/adminApi';
import { adminTheme } from '@/constants/adminTheme';
import AdminBottomBar from '@/screens/admin/AdminBottomBar';

type Props = StackScreenProps<RootStackParamList, 'AdminAlerts'>;

function pendingVisual(row: PendingApprovalRow) {
  if (row.kind === 'user_verify') {
    return { icon: 'person' as const, tint: '#C48B9F' };
  }
  return { icon: 'briefcase-outline' as const, tint: adminTheme.brownMid };
}

function activityVisual(row: RecentActivityRow) {
  if (row.kind === 'job_done') {
    return { icon: 'checkmark-circle' as const, color: adminTheme.trendGreen };
  }
  if (row.kind === 'user_new') {
    return { icon: 'people' as const, color: adminTheme.brownMid };
  }
  return { icon: 'warning' as const, color: adminTheme.danger };
}

export default function AdminAlertsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const o = await fetchOverview();
      setData(o);
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

  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alerts</Text>
        <View style={{ width: 40 }} />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={{ color: adminTheme.danger }}>{error}</Text>
        </View>
      ) : null}

      {loading && !data ? (
        <ActivityIndicator color={adminTheme.teal} size="large" style={{ marginTop: 30 }} />
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 90 }}>
        {data ? (
          <>
            <Text style={styles.sectionTitle}>Cần phê duyệt</Text>
            {data.pendingApprovals.length === 0 ? (
              <Text style={styles.emptyText}>Không có mục chờ xử lý.</Text>
            ) : (
              data.pendingApprovals.map((row) => {
                const pv = pendingVisual(row);
                const toScreen = row.kind === 'job_open' ? 'AdminJobs' : 'AdminUsers';
                return (
                  <TouchableOpacity
                    key={row.id}
                    style={styles.pendingCard}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate(toScreen as keyof RootStackParamList)}>
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

            <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Hoạt động gần đây</Text>
            <View style={styles.timelineCard}>
              {data.recentActivity.length === 0 ? (
                <Text style={[styles.emptyText, { padding: 12 }]}>Chưa có hoạt động gần đây.</Text>
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
          </>
        ) : null}
      </ScrollView>

      <AdminBottomBar navigation={navigation} active="AdminAlerts" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: adminTheme.bgPage },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: adminTheme.bgHeader,
    borderBottomWidth: 1,
    borderBottomColor: adminTheme.borderSoft,
  },
  backText: { color: adminTheme.brown, fontSize: 16, width: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: adminTheme.brown },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: adminTheme.brown, marginTop: 16, marginBottom: 10 },
  emptyText: { fontSize: 14, color: adminTheme.brownMuted, textAlign: 'center' },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminTheme.card,
    borderRadius: 22,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: adminTheme.borderSoft,
    gap: 14,
  },
  pendingIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: { fontSize: 16, fontWeight: '700', color: adminTheme.brown },
  pendingSub: { fontSize: 13, color: adminTheme.brownMuted, marginTop: 4 },
  timelineCard: {
    backgroundColor: adminTheme.timelineBg,
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: adminTheme.borderSoft,
  },
  timelineRow: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 12 },
  timelineRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(90,85,48,0.1)' },
  timelineTitle: { fontSize: 14, fontWeight: '700', color: adminTheme.brown },
  timelineSub: { fontSize: 12, color: adminTheme.brownMuted, marginTop: 4 },
});

