import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, StyleSheet, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as jobApi from '@/api/jobApi';

const { getErrorMessage } = jobApi;

const COLORS = {
  primary: '#D97706',
  primaryLight: '#FEF3C7',
  background: '#FFFBEB',
  card: '#FFFFFF',
  text: '#1F2937',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
};

export default function MyJobsScreen() {
  const navigation = useNavigation();
  const [accessToken, setAccessToken] = useState('');
  const [myJobs, setMyJobs] = useState<jobApi.Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<jobApi.Job | null>(null);
  const editIdRef = useRef<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    requiredWorkers: '1',
    skillTags: '',
  });

  const fetchMyJobs = useCallback(async () => {
    if (!accessToken.trim()) {
      setMyJobs([]);
      return;
    }
    setLoading(true);
    try {
      const data = await jobApi.listMyJobs(accessToken.trim());
      setMyJobs(data);
    } catch {
      setMyJobs([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchMyJobs();
  }, [fetchMyJobs]);

  useEffect(() => {
    editIdRef.current = editId;
  }, [editId]);

  const handleCreate = async () => {
    if (!accessToken.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập Access Token');
      return;
    }
    const price = parseFloat(form.price);
    const requiredWorkers = parseInt(form.requiredWorkers, 10);
    if (!form.title.trim()) {
      Alert.alert('Lỗi', 'Nhập tiêu đề');
      return;
    }
    if (!form.description.trim()) {
      Alert.alert('Lỗi', 'Nhập mô tả');
      return;
    }
    if (isNaN(price) || price < 0) {
      Alert.alert('Lỗi', 'Giá không hợp lệ');
      return;
    }
    if (isNaN(requiredWorkers) || requiredWorkers < 1) {
      Alert.alert('Lỗi', 'Số worker tối thiểu là 1');
      return;
    }
    setLoading(true);
    try {
      await jobApi.createJob(accessToken.trim(), {
        title: form.title.trim(),
        description: form.description.trim(),
        price,
        location: { lat: 21.0285, lng: 105.8542 },
        requiredWorkers,
        skillTags: form.skillTags ? form.skillTags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      });
      setForm({ title: '', description: '', price: '', requiredWorkers: '1', skillTags: '' });
      setCreateMode(false);
      setEditId(null);
      editIdRef.current = null;
      fetchMyJobs();
      Alert.alert('Thành công', 'Đã tạo tin tuyển. Tin đang chờ admin duyệt.');
    } catch (err: unknown) {
      Alert.alert('Lỗi', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (jobId: string) => {
    if (!accessToken.trim()) return;
    const price = parseFloat(form.price);
    const requiredWorkers = parseInt(form.requiredWorkers, 10);
    if (!form.title.trim()) {
      Alert.alert('Lỗi', 'Nhập tiêu đề');
      return;
    }
    if (isNaN(price) || price < 0 || isNaN(requiredWorkers) || requiredWorkers < 1) {
      Alert.alert('Lỗi', 'Giá và số worker không hợp lệ');
      return;
    }
    setLoading(true);
    try {
      await jobApi.updateJob(accessToken.trim(), jobId, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        price,
        requiredWorkers,
        skillTags: form.skillTags ? form.skillTags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      });
      setEditId(null);
      editIdRef.current = null;
      setForm({ title: '', description: '', price: '', requiredWorkers: '1', skillTags: '' });
      fetchMyJobs();
      Alert.alert('Thành công', 'Đã cập nhật tin');
    } catch (err: unknown) {
      Alert.alert('Lỗi', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (jobId: string, title: string) => {
    Alert.alert('Xác nhận', `Xóa tin "${title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          if (!accessToken.trim()) return;
          setLoading(true);
          try {
            await jobApi.deleteJob(accessToken.trim(), jobId);
            fetchMyJobs();
            Alert.alert('Thành công', 'Đã xóa tin');
          } catch (err: unknown) {
            Alert.alert('Lỗi', getErrorMessage(err));
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const startEdit = (job: jobApi.Job) => {
    const id = job._id;
    if (!id) return;
    setEditId(id);
    setCreateMode(false);
    editIdRef.current = id;
    setForm({
      title: job.title,
      description: job.description,
      price: String(job.price),
      requiredWorkers: String(job.requiredWorkers),
      skillTags: (job.skillTags ?? []).join(', '),
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setCreateMode(false);
    editIdRef.current = null;
    setForm({ title: '', description: '', price: '', requiredWorkers: '1', skillTags: '' });
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = { pending: 'Chờ duyệt', open: 'Đang tuyển', partial: 'Một phần', full: 'Đã đủ', done: 'Hoàn thành' };
    return map[status] ?? status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = { pending: '#F59E0B', open: '#059669', partial: '#D97706', full: '#2563EB', done: '#6B7280' };
    return map[status] ?? '#6B7280';
  };

  const canEditDelete = (status: string) => status !== 'pending';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Tin của tôi</Text>
          <Text style={styles.headerSubtitle}>Quản lý tin tuyển dụng</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Token section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Xác thực</Text>
          <Text style={styles.cardHint}>Dán access token sau khi đăng nhập</Text>
          <TextInput
            placeholder="Bearer token..."
            value={accessToken}
            onChangeText={setAccessToken}
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />
          {loading && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              activeOpacity={0.8}
              onPress={() => { setCreateMode(true); setEditId(null); editIdRef.current = null; setForm({ title: '', description: '', price: '', requiredWorkers: '1', skillTags: '' }); }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.btnPrimaryText}>+ Đăng tin mới</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} activeOpacity={0.8} onPress={fetchMyJobs} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.btnSecondaryText}>Tải lại</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form */}
        {(createMode || editId) && (
          <View style={styles.card}>
            <Text style={styles.formTitle}>{editId ? 'Cập nhật tin' : 'Tạo tin mới'}</Text>
            <TextInput
              placeholder="Tiêu đề *"
              value={form.title}
              onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
            />
            <TextInput
              placeholder="Mô tả *"
              value={form.description}
              onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.inputMultiline]}
            />
            <View style={styles.row}>
              <TextInput
                placeholder="Giá (VNĐ)"
                value={form.price}
                onChangeText={(t) => setForm((f) => ({ ...f, price: t }))}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.input, { flex: 1, marginRight: 8 }]}
              />
              <TextInput
                placeholder="Số worker"
                value={form.requiredWorkers}
                onChangeText={(t) => setForm((f) => ({ ...f, requiredWorkers: t }))}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.input, { width: 90 }]}
              />
            </View>
            <TextInput
              placeholder="Kỹ năng (cách nhau bằng dấu phẩy)"
              value={form.skillTags}
              onChangeText={(t) => setForm((f) => ({ ...f, skillTags: t }))}
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
            />
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary, { flex: 1 }]}
                onPress={() => {
                  const id = editIdRef.current ?? editId;
                  if (id) handleUpdate(id);
                  else handleCreate();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.btnPrimaryText}>{editId ? 'Cập nhật' : 'Tạo tin'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={cancelEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.btnOutlineText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Job list */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Danh sách tin ({myJobs.length})</Text>
          {myJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chưa có tin nào</Text>
              <Text style={styles.emptyHint}>Nhập token và bấm "Đăng tin mới" để tạo</Text>
            </View>
          ) : (
            myJobs.map((job) => (
              <View key={job._id} style={styles.jobCard}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedJob(job)} style={{ flex: 1 }}>
                  <View style={styles.jobCardHeader}>
                    <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                      <Text style={[styles.statusBadgeText, { color: getStatusColor(job.status) }]}>
                        {getStatusLabel(job.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.jobDesc} numberOfLines={2}>{job.description}</Text>
                  <View style={styles.jobCardFooter}>
                    <Text style={styles.jobPrice}>{job.price.toLocaleString('vi-VN')} VNĐ</Text>
                    <Text style={styles.jobMetaText}>
                      {job.assignedWorkers}/{job.requiredWorkers} người
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.jobActions}>
                  <TouchableOpacity
                    style={[styles.jobBtnEdit, !canEditDelete(job.status) && styles.btnDisabled]}
                    onPress={() => canEditDelete(job.status) ? startEdit(job) : Alert.alert('Thông báo', 'Tin đang chờ admin duyệt. Chỉ sửa được sau khi duyệt.')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.jobBtnEditText, !canEditDelete(job.status) && { color: '#9CA3AF' }]}>Sửa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.jobBtnDelete, !canEditDelete(job.status) && styles.btnDisabled]}
                    onPress={() => canEditDelete(job.status) ? handleDelete(job._id, job.title) : Alert.alert('Thông báo', 'Tin đang chờ admin duyệt. Chỉ xóa được sau khi duyệt.')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.jobBtnDeleteText, !canEditDelete(job.status) && { color: '#9CA3AF' }]}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Job Detail Modal */}
      <Modal
        visible={!!selectedJob}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedJob(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedJob(null)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={() => {}}>
            {selectedJob && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedJob.title}</Text>
                  <TouchableOpacity onPress={() => setSelectedJob(null)} style={styles.modalCloseBtn}>
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Mô tả</Text>
                    <Text style={styles.detailValue}>{selectedJob.description}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Giá</Text>
                      <Text style={styles.detailValueHighlight}>{selectedJob.price.toLocaleString('vi-VN')} VNĐ</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Số lượng</Text>
                      <Text style={styles.detailValueHighlight}>{selectedJob.assignedWorkers}/{selectedJob.requiredWorkers} người</Text>
                    </View>
                  </View>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Trạng thái</Text>
                    <View style={[styles.statusBadge, styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedJob.status) + '25' }]}>
                      <Text style={[styles.statusBadgeText, { color: getStatusColor(selectedJob.status), fontSize: 15 }]}>
                        {getStatusLabel(selectedJob.status)}
                      </Text>
                    </View>
                  </View>
                  {(selectedJob.skillTags?.length ?? 0) > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Kỹ năng yêu cầu</Text>
                      <View style={styles.skillTags}>
                        {(selectedJob.skillTags ?? []).map((tag, i) => (
                          <View key={i} style={styles.skillTag}>
                            <Text style={styles.skillTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Vị trí</Text>
                    <Text style={styles.detailValue}>
                      {selectedJob.location?.lat?.toFixed(4)}, {selectedJob.location?.lng?.toFixed(4)}
                    </Text>
                  </View>
                </ScrollView>
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnPrimary, { flex: 1 }, !canEditDelete(selectedJob.status) && styles.btnDisabled]}
                    onPress={() => {
                      if (canEditDelete(selectedJob.status)) { startEdit(selectedJob); setSelectedJob(null); }
                      else Alert.alert('Thông báo', 'Tin đang chờ admin duyệt.');
                    }}
                  >
                    <Text style={[styles.btnPrimaryText, !canEditDelete(selectedJob.status) && { color: '#9CA3AF' }]}>Chỉnh sửa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.btnOutline, { flex: 1 }]} onPress={() => setSelectedJob(null)}>
                    <Text style={styles.btnOutlineText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backBtnText: { fontSize: 20, color: '#D97706', fontWeight: '600' },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
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
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  cardHint: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  btnRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 4 },
  btn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#D97706' },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  btnSecondary: { backgroundColor: '#F3F4F6' },
  btnSecondaryText: { color: '#374151', fontWeight: '600', fontSize: 15 },
  btnOutline: { borderWidth: 1, borderColor: '#E5E7EB' },
  btnOutlineText: { color: '#6B7280', fontWeight: '600', fontSize: 15 },
  formTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 16 },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6B7280', marginBottom: 4 },
  emptyHint: { fontSize: 14, color: '#9CA3AF' },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  jobCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  jobTitle: { fontSize: 17, fontWeight: '600', color: '#1F2937', flex: 1, marginRight: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  statusBadgeLarge: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 14 },
  jobDesc: { fontSize: 14, color: '#6B7280', marginBottom: 12, lineHeight: 22 },
  jobCardFooter: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  jobPrice: { fontSize: 15, fontWeight: '700', color: '#D97706', marginRight: 16 },
  jobMetaText: { fontSize: 13, color: '#6B7280' },
  jobActions: { flexDirection: 'row', gap: 10 },
  jobBtnEdit: { backgroundColor: '#FEF3C7', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, minHeight: 44, justifyContent: 'center' },
  jobBtnEditText: { color: '#D97706', fontWeight: '600', fontSize: 14 },
  jobBtnDelete: { backgroundColor: '#FEE2E2', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, minHeight: 44, justifyContent: 'center' },
  btnDisabled: { opacity: 0.6 },
  jobBtnDeleteText: { color: '#DC2626', fontWeight: '600', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: 0,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', flex: 1 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 18, color: '#6B7280', fontWeight: '600' },
  modalBody: { maxHeight: 400, padding: 20 },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  detailSection: { marginBottom: 20 },
  detailRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  detailValue: { fontSize: 15, color: '#1F2937', lineHeight: 22 },
  detailValueHighlight: { fontSize: 17, fontWeight: '700', color: '#D97706' },
  skillTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  skillTagText: { fontSize: 14, color: '#92400E', fontWeight: '500' },
});
