import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  primary: '#D97706',
  primaryLight: '#FEF3C7',
  background: '#FFFBEB',
  card: '#FFFFFF',
  text: '#1F2937',
  textMuted: '#6B7280',
};

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Worksy</Text>
        <Text style={styles.greeting}>Chào mừng bạn trở lại</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thao tác nhanh</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>🔍 Tìm việc</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>📝 Đăng tin</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.8}
              onPress={() => (navigation as { navigate: (name: string) => void }).navigate('MyJobs')}
            >
              <Text style={styles.actionBtnText}>📋 Tin của tôi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
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

        {/* Recent */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Việc làm mới nhất</Text>
          <View style={styles.emptyBox}>
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logo: { fontSize: 28, fontWeight: '800', color: '#1F2937' },
  greeting: { fontSize: 15, color: '#6B7280', marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1F2937', marginBottom: 16 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionBtn: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  actionBtnText: { color: '#92400E', fontWeight: '600', fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statLabel: { fontSize: 14, color: '#6B7280' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginTop: 4 },
  emptyBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
});
