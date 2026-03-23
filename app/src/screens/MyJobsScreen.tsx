import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as jobApi from '@/api/jobApi';
import { COLORS } from '@/theme/colors';
import UserBottomBar from '@/components/navigation/UserBottomBar';
import UserHeader from '@/components/navigation/UserHeader';
import type { RootStackParamList } from '@/navigation/types';

const { getErrorMessage } = jobApi;

export default function MyJobsScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [accessToken, setAccessToken] = useState('');
  const [myJobs, setMyJobs] = useState<jobApi.Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<jobApi.Job | null>(null);
  const [applicantsJob, setApplicantsJob] = useState<jobApi.Job | null>(null);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [applicants, setApplicants] = useState<jobApi.RankedApplicant[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const editIdRef = useRef<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    requiredWorkers: '1',
    workDate: '',
    workTime: '',
    skillTags: '',
  });
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [pickerValue, setPickerValue] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      SecureStore.getItemAsync('accessToken').then((token) => {
        setAccessToken(token ?? '');
      });
    }, []),
  );

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

  const toIsoSchedule = (dateText: string, timeText: string) => {
    const date = dateText.trim();
    const time = timeText.trim();
    if (!date || !time) return null;
    const iso = `${date}T${time}:00`;
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  };

  const splitSchedule = (iso?: string) => {
    if (!iso) return { workDate: '', workTime: '' };
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { workDate: '', workTime: '' };
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const dd = `${d.getDate()}`.padStart(2, '0');
    const hh = `${d.getHours()}`.padStart(2, '0');
    const mm = `${d.getMinutes()}`.padStart(2, '0');
    return { workDate: `${y}-${m}-${dd}`, workTime: `${hh}:${mm}` };
  };

  const formatDateInput = (date: Date) => {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatTimeInput = (date: Date) => {
    const hh = `${date.getHours()}`.padStart(2, '0');
    const mm = `${date.getMinutes()}`.padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const currentFormDate = () => {
    const iso = toIsoSchedule(form.workDate, form.workTime);
    if (iso) return new Date(iso);
    return new Date();
  };

  const openPicker = (mode: 'date' | 'time') => {
    setPickerMode(mode);
    setPickerValue(currentFormDate());
    setShowDateTimePicker(true);
  };

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed' || !selected) {
      return;
    }
    setPickerValue(selected);
  };

  const confirmPickerValue = () => {
    if (pickerMode === 'date') {
      setForm((f) => ({ ...f, workDate: formatDateInput(pickerValue) }));
    } else {
      setForm((f) => ({ ...f, workTime: formatTimeInput(pickerValue) }));
    }
    setShowDateTimePicker(false);
  };

  const cancelPickerValue = () => {
    setShowDateTimePicker(false);
  };

  const handleCreate = async () => {
    if (!accessToken.trim()) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để đăng tin');
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
    const scheduledAt = toIsoSchedule(form.workDate, form.workTime);
    if (!scheduledAt) {
      Alert.alert('Lỗi', 'Vui lòng nhập đúng ngày và giờ làm (YYYY-MM-DD, HH:mm)');
      return;
    }
    setLoading(true);
    try {
      await jobApi.createJob(accessToken.trim(), {
        title: form.title.trim(),
        description: form.description.trim(),
        price,
        location: { lat: 21.0285, lng: 105.8542 },
        scheduledAt,
        requiredWorkers,
        skillTags: form.skillTags ? form.skillTags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      });
      setForm({ title: '', description: '', price: '', requiredWorkers: '1', workDate: '', workTime: '', skillTags: '' });
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
    const scheduledAt = toIsoSchedule(form.workDate, form.workTime);
    if (!scheduledAt) {
      Alert.alert('Lỗi', 'Vui lòng nhập đúng ngày và giờ làm (YYYY-MM-DD, HH:mm)');
      return;
    }
    setLoading(true);
    try {
      await jobApi.updateJob(accessToken.trim(), jobId, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        price,
        scheduledAt,
        requiredWorkers,
        skillTags: form.skillTags ? form.skillTags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      });
      setEditId(null);
      editIdRef.current = null;
      setForm({ title: '', description: '', price: '', requiredWorkers: '1', workDate: '', workTime: '', skillTags: '' });
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
      ...splitSchedule(job.scheduledAt),
      skillTags: (job.skillTags ?? []).join(', '),
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setCreateMode(false);
    editIdRef.current = null;
    setForm({ title: '', description: '', price: '', requiredWorkers: '1', workDate: '', workTime: '', skillTags: '' });
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = { pending: 'Chờ duyệt', open: 'Đang tuyển', partial: 'Một phần', full: 'Đã đủ', done: 'Hoàn thành' };
    return map[status] ?? status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: COLORS.warning,
      open: COLORS.success,
      partial: COLORS.primary,
      full: '#2563EB',
      done: COLORS.textMuted,
    };
    return map[status] ?? COLORS.textMuted;
  };

  const canEditDelete = (status: string) => status === 'open';
  const canComplete = (job: jobApi.Job) =>
    job.status !== 'done' && job.status !== 'pending' && (job.assignedWorkers ?? 0) > 0;

  const formatDateTime = (value?: string | null) => {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString('vi-VN');
  };

  const getCompletionSourceLabel = (source?: 'manual' | 'auto' | null) => {
    if (source === 'manual') return 'Khách hàng hoàn thành';
    if (source === 'auto') return 'Tự động hoàn thành';
    return 'Chưa xác định';
  };

  const handleComplete = (job: jobApi.Job) => {
    Alert.alert(
      'Xác nhận hoàn thành',
      `Đánh dấu job "${job.title}" là hoàn thành?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Set done',
          style: 'default',
          onPress: async () => {
            if (!accessToken.trim()) return;
            setLoading(true);
            try {
              await jobApi.completeJob(accessToken.trim(), job._id);
              await fetchMyJobs();
              Alert.alert('Thành công', 'Đã đánh dấu hoàn thành.');
            } catch (err: unknown) {
              Alert.alert('Lỗi', getErrorMessage(err));
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const canReviewApplicants = (job: jobApi.Job) => job.status === 'open' || job.status === 'partial';

  const loadApplicants = useCallback(async (jobId: string) => {
    if (!accessToken.trim()) return;
    setLoadingApplicants(true);
    try {
      const rows = await jobApi.listApplicants(accessToken.trim(), jobId);
      if (__DEV__) {
        console.log('[MyJobs] applicants payload:', rows.map((r) => ({
          applyId: r.apply?._id,
          workerId: r.apply?.workerId,
          score: r.score,
          rating: r.worker?.rating,
        })));
      }
      setApplicants(rows);
      setSelectedWorkerIds([]);
    } catch (err: unknown) {
      setApplicants([]);
      Alert.alert('Lỗi', getErrorMessage(err));
    } finally {
      setLoadingApplicants(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!showApplicantsModal || !applicantsJob) {
      setApplicants([]);
      setSelectedWorkerIds([]);
      return;
    }
    void loadApplicants(applicantsJob._id);
  }, [showApplicantsModal, applicantsJob, loadApplicants]);

  const toggleWorker = (workerId: string) => {
    setSelectedWorkerIds((prev) =>
      prev.includes(workerId) ? prev.filter((id) => id !== workerId) : [...prev, workerId],
    );
  };

  const normalizeScore = (value: unknown) => {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, n);
  };

  const handleSelectWorkers = async () => {
    if (!applicantsJob || !accessToken.trim()) return;
    if (selectedWorkerIds.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 ứng viên.');
      return;
    }
    Alert.alert(
      'Xác nhận chọn ứng viên',
      `Bạn muốn chốt ${selectedWorkerIds.length} ứng viên cho job này?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setLoading(true);
            try {
              await jobApi.selectWorkers(accessToken.trim(), applicantsJob._id, selectedWorkerIds);
              Alert.alert('Thành công', 'Đã chọn ứng viên.');
              await fetchMyJobs();
              await loadApplicants(applicantsJob._id);
            } catch (err: unknown) {
              Alert.alert('Lỗi', getErrorMessage(err));
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bg }]} edges={['top']}>
      <UserHeader
        title="Tin của tôi"
        subtitle="Quản lý tin tuyển dụng"
        leftIcon="menu"
        onLeftPress={() => navigation.navigate('Home' as never)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {loading && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              activeOpacity={0.8}
              onPress={() => { setCreateMode(true); setEditId(null); editIdRef.current = null; setForm({ title: '', description: '', price: '', requiredWorkers: '1', workDate: '', workTime: '', skillTags: '' }); }}
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
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.input, styles.pickerInput, { flex: 1, marginRight: 8 }]}
                onPress={() => openPicker('date')}
                activeOpacity={0.8}
              >
                <Text style={form.workDate ? styles.pickerValue : styles.pickerPlaceholder}>
                  {form.workDate || 'Chọn ngày làm'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.input, styles.pickerInput, { width: 110 }]}
                onPress={() => openPicker('time')}
                activeOpacity={0.8}
              >
                <Text style={form.workTime ? styles.pickerValue : styles.pickerPlaceholder}>
                  {form.workTime || 'Chọn giờ'}
                </Text>
              </TouchableOpacity>
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
              <Text style={styles.emptyHint}>Bấm Đăng tin mới để tạo tin tuyển dụng</Text>
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
                    style={[styles.jobBtnAction, !canReviewApplicants(job) && styles.btnDisabled]}
                    onPress={() => {
                      if (!canReviewApplicants(job)) {
                        Alert.alert('Thông báo', 'Chỉ xem ứng viên khi job đang tuyển.');
                        return;
                      }
                      setApplicantsJob(job);
                      setShowApplicantsModal(true);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.jobBtnActionText, !canReviewApplicants(job) && { color: '#9CA3AF' }]}>
                      Ứng viên
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.jobBtnAction, !canComplete(job) && styles.btnDisabled]}
                    onPress={() =>
                      canComplete(job)
                        ? handleComplete(job)
                        : Alert.alert(
                            'Thông báo',
                            job.status === 'done'
                              ? 'Job đã hoàn thành.'
                              : 'Cần có worker được gán trước khi set done.',
                          )
                    }
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.jobBtnActionText, !canComplete(job) && { color: '#9CA3AF' }]}>
                      Set done
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.jobBtnAction, !canEditDelete(job.status) && styles.btnDisabled]}
                    onPress={() => canEditDelete(job.status) ? startEdit(job) : Alert.alert('Thông báo', 'Chỉ chỉnh sửa khi job đang ở trạng thái đang tuyển.')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.jobBtnActionText, !canEditDelete(job.status) && { color: '#9CA3AF' }]}>Sửa</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.deleteInlineBtn, !canEditDelete(job.status) && styles.btnDisabled]}
                  onPress={() => canEditDelete(job.status) ? handleDelete(job._id, job.title) : Alert.alert('Thông báo', 'Chỉ xóa khi job đang ở trạng thái đang tuyển.')}
                >
                  <Text style={[styles.deleteInlineBtnText, !canEditDelete(job.status) && { color: '#9CA3AF' }]}>Xóa</Text>
                </TouchableOpacity>
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
          <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={() => { }}>
            {selectedJob && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedJob.title}</Text>
                  <TouchableOpacity onPress={() => setSelectedJob(null)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={18} color={COLORS.textMuted} />
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
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Deadline tự động hoàn thành</Text>
                    <Text style={styles.detailValue}>{formatDateTime(selectedJob.completionDueAt)}</Text>
                  </View>
                  {selectedJob.status === 'done' && (
                    <>
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Thời điểm hoàn thành</Text>
                        <Text style={styles.detailValue}>{formatDateTime(selectedJob.completedAt)}</Text>
                      </View>
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Nguồn hoàn thành</Text>
                        <Text style={styles.detailValue}>
                          {getCompletionSourceLabel(selectedJob.completionSource)}
                        </Text>
                      </View>
                    </>
                  )}
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
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Ngày giờ làm</Text>
                    <Text style={styles.detailValue}>{formatDateTime(selectedJob.scheduledAt ?? null)}</Text>
                  </View>
                </ScrollView>
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnPrimary, styles.modalActionBtn, !canEditDelete(selectedJob.status) && styles.btnDisabled]}
                    onPress={() => {
                      if (canEditDelete(selectedJob.status)) { startEdit(selectedJob); setSelectedJob(null); }
                      else Alert.alert('Thông báo', 'Chỉ chỉnh sửa khi job đang ở trạng thái đang tuyển.');
                    }}
                  >
                    <Text style={[styles.btnPrimaryText, !canEditDelete(selectedJob.status) && { color: '#9CA3AF' }]}>Chỉnh sửa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.btnOutline, styles.modalActionBtn]} onPress={() => setSelectedJob(null)}>
                    <Text style={styles.btnOutlineText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </Pressable>
      </Modal>

      <Modal
        visible={showApplicantsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowApplicantsModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowApplicantsModal(false)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ứng viên theo điểm</Text>
              <TouchableOpacity onPress={() => setShowApplicantsModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.applicantHeader}>
                <Text style={styles.detailLabel}>
                  {applicantsJob?.title ?? 'Job'} - {applicants.length} ứng viên
                </Text>
                {applicantsJob && (
                  <TouchableOpacity
                    style={styles.applicantRefreshBtn}
                    onPress={() => loadApplicants(applicantsJob._id)}
                  >
                    <Text style={styles.applicantRefreshText}>Tải lại</Text>
                  </TouchableOpacity>
                )}
              </View>
              {loadingApplicants ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 14 }} />
              ) : applicants.length === 0 ? (
                <Text style={styles.detailValue}>
                  Chưa có ứng viên pending. Kiểm tra worker đã apply chưa và job còn open/partial.
                </Text>
              ) : (
                [...applicants]
                  .sort((a, b) => {
                    const scoreA = normalizeScore(a.score);
                    const scoreB = normalizeScore(b.score);
                    if (scoreB !== scoreA) return scoreB - scoreA;
                    return (b.worker?.rating ?? 0) - (a.worker?.rating ?? 0);
                  })
                  .map((row, idx) => {
                    const workerId = row.apply.workerId;
                    const checked = selectedWorkerIds.includes(workerId);
                    const displayScore = normalizeScore(row.score);
                    return (
                      <TouchableOpacity
                        key={row.apply._id}
                        style={[styles.applicantRow, checked && styles.applicantRowSelected]}
                        onPress={() => toggleWorker(workerId)}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.applicantName}>
                            #{idx + 1} {row.worker?.name ?? 'Worker'}
                          </Text>
                          <Text style={styles.applicantMeta}>
                            Score: {displayScore.toFixed(2)} | Rating: {(row.worker?.rating ?? 0).toFixed(1)} | Jobs: {row.worker?.completedJobs ?? 0}
                          </Text>
                        </View>
                        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                          <Text style={[styles.checkboxText, checked && styles.checkboxTextChecked]}>
                            {checked ? '✓' : ''}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary, styles.modalActionBtn]}
                onPress={handleSelectWorkers}
              >
                <Text style={styles.btnSecondaryText}>Chọn ứng viên</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnOutline, styles.modalActionBtn]}
                onPress={() => setShowApplicantsModal(false)}
              >
                <Text style={styles.btnOutlineText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Pressable>
      </Modal>

      <Modal
        visible={showDateTimePicker}
        animationType="fade"
        transparent
        onRequestClose={cancelPickerValue}
      >
        <Pressable style={styles.modalOverlay} onPress={cancelPickerValue}>
          <TouchableOpacity style={styles.pickerModalContent} activeOpacity={1} onPress={() => {}}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>
                {pickerMode === 'date' ? 'Chọn ngày làm' : 'Chọn giờ làm'}
              </Text>
            </View>
            <DateTimePicker
              value={pickerValue}
              mode={pickerMode}
              is24Hour
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handlePickerChange}
            />
            <View style={styles.pickerModalFooter}>
              <TouchableOpacity style={[styles.btn, styles.btnOutline, styles.modalActionBtn]} onPress={cancelPickerValue}>
                <Text style={styles.btnOutlineText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary, styles.modalActionBtn]} onPress={confirmPickerValue}>
                <Text style={styles.btnPrimaryText}>OK</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Pressable>
      </Modal>
      <UserBottomBar navigation={navigation} active="MyJobs" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
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
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  backBtnText: { fontSize: 22, color: COLORS.primary, fontWeight: '600' },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  headerSubtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 150 },
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
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  cardHint: { fontSize: 13, color: COLORS.textMuted, marginBottom: 14 },
  input: {
    backgroundColor: '#FAFAF9',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  pickerInput: { justifyContent: 'center' },
  pickerValue: { color: COLORS.text, fontSize: 16 },
  pickerPlaceholder: { color: COLORS.textMuted, fontSize: 16 },
  pickerModalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    marginHorizontal: 22,
    padding: 14,
  },
  pickerModalHeader: { paddingHorizontal: 6, paddingBottom: 6 },
  pickerModalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  pickerModalFooter: { flexDirection: 'row', gap: 10, marginTop: 8 },
  row: { flexDirection: 'row' },
  btnRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 4 },
  btn: { paddingVertical: 16, paddingHorizontal: 22, borderRadius: 14, alignItems: 'center' },
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
  formTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 18 },
  emptyState: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { fontSize: 17, color: COLORS.textMuted, marginBottom: 6, fontWeight: '500' },
  emptyHint: { fontSize: 14, color: COLORS.textMuted, opacity: 0.85 },
  jobCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  jobCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  jobTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  statusBadgeLarge: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 14 },
  jobDesc: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 14, lineHeight: 22 },
  jobCardFooter: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  jobPrice: { fontSize: 17, fontWeight: '800', color: COLORS.primary, marginRight: 18 },
  jobMetaText: { fontSize: 13, color: COLORS.textMuted },
  jobActions: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  jobBtnAction: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 9,
    borderRadius: 10,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  jobBtnActionText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 13 },
  deleteInlineBtn: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.errorLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteInlineBtnText: { color: COLORS.error, fontSize: 12, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  jobBtnDeleteText: { color: COLORS.error, fontWeight: '700', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: 0,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 22,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, flex: 1 },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAFAF9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalBody: { maxHeight: 400, padding: 20 },
  modalFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    padding: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  modalActionBtn: {
    flexGrow: 1,
    minWidth: 120,
  },
  detailSection: { marginBottom: 20 },
  applicantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  applicantRefreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
  },
  applicantRefreshText: { color: COLORS.primaryDark, fontWeight: '600', fontSize: 12 },
  applicantRow: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAFAF9',
  },
  applicantRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  applicantName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  applicantMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkboxText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '700' },
  checkboxTextChecked: { color: '#FFFFFF' },
  detailRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  detailValue: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22 },
  detailValueHighlight: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  skillTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skillTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  skillTagText: { fontSize: 14, color: COLORS.primaryDark, fontWeight: '600' },
});
