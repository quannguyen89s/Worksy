import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { AddressSuggestion } from '@/services/geocodeService';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as jobApi from '@/api/jobApi';
import { searchAddress } from '@/services/geocodeService';
import { COLORS } from '@/theme/colors';
import UserBottomBar from '@/components/navigation/UserBottomBar';
import UserHeader from '@/components/navigation/UserHeader';
import LocationMapPicker from '@/components/LocationMapPicker';
import type { RootStackParamList } from '@/navigation/types';

const { getErrorMessage } = jobApi;

function jobIdFromJob(job: jobApi.Job): string {
  const id = job._id as unknown;
  if (typeof id === 'string') return id;
  if (id && typeof id === 'object' && '$oid' in (id as object)) {
    return String((id as { $oid: string }).$oid);
  }
  return id != null ? String(id) : '';
}

function normalizeAssignedWorkers(job: jobApi.Job): { id: string; name: string }[] {
  const raw = job.assignedWorkerIds;
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((w) => {
      if (typeof w === 'string') return { id: w, name: 'Thợ' };
      const o = w as jobApi.AssignedWorkerRef;
      const id = o._id != null ? String(o._id) : '';
      return { id, name: (o.name && String(o.name).trim()) || 'Thợ' };
    })
    .filter((x) => x.id.length > 0);
}

export default function MyJobsScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
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
    address: '',
    skillTags: '',
  });
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [pickerValue, setPickerValue] = useState(new Date());
  const [formLocation, setFormLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [loadingAddressSuggestions, setLoadingAddressSuggestions] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const DEFAULT_LOCATION = { lat: 21.0285, lng: 105.8542 };

  const [feedbackJob, setFeedbackJob] = useState<jobApi.Job | null>(null);
  const [feedbackReviews, setFeedbackReviews] = useState<jobApi.JobReviewRow[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSaving, setFeedbackSaving] = useState<string | null>(null);
  const [draftRating, setDraftRating] = useState<Record<string, number>>({});
  const [draftComment, setDraftComment] = useState<Record<string, string>>({});

  type StatusFilter = 'all' | 'pending' | 'open' | 'partial' | 'full' | 'done';
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'open', label: 'Đang tuyển' },
    { value: 'partial', label: 'Một phần' },
    { value: 'full', label: 'Đã đủ' },
    { value: 'done', label: 'Hoàn thành' },
  ];

  const filteredJobs = useMemo(() => {
    if (statusFilter === 'all') return myJobs;
    return myJobs.filter((j) => j.status === statusFilter);
  }, [myJobs, statusFilter]);

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
    let jobLocation = formLocation ?? DEFAULT_LOCATION;
    if (!formLocation && form.address.trim().length >= 2) {
      const suggestions = await searchAddress(form.address.trim());
      if (suggestions.length > 0) {
        jobLocation = { lat: suggestions[0].lat, lng: suggestions[0].lng };
      }
    }
    setLoading(true);
    try {
      await jobApi.createJob(accessToken.trim(), {
        title: form.title.trim(),
        description: form.description.trim(),
        price,
        location: jobLocation,
        scheduledAt,
        requiredWorkers,
        ...(form.address.trim() ? { address: form.address.trim() } : {}),
        skillTags: form.skillTags ? form.skillTags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      });
      setForm({ title: '', description: '', price: '', requiredWorkers: '1', workDate: '', workTime: '', address: '', skillTags: '' });
      setFormLocation(null);
      setAddressSuggestions([]);
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
    let jobLocation = formLocation;
    if (!formLocation && form.address.trim().length >= 2) {
      const suggestions = await searchAddress(form.address.trim());
      if (suggestions.length > 0) {
        jobLocation = { lat: suggestions[0].lat, lng: suggestions[0].lng };
      }
    }
    setLoading(true);
    try {
      await jobApi.updateJob(accessToken.trim(), jobId, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        price,
        ...(jobLocation ? { location: jobLocation } : {}),
        scheduledAt,
        requiredWorkers,
        ...(form.address.trim() ? { address: form.address.trim() } : {}),
        skillTags: form.skillTags ? form.skillTags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      });
      setEditId(null);
      editIdRef.current = null;
      setForm({ title: '', description: '', price: '', requiredWorkers: '1', workDate: '', workTime: '', address: '', skillTags: '' });
      setFormLocation(null);
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
      address: job.address ?? '',
      skillTags: (job.skillTags ?? []).join(', '),
    });
    setFormLocation(
      job.location?.lat != null && job.location?.lng != null
        ? { lat: job.location.lat, lng: job.location.lng }
        : null,
    );
  };

  const cancelEdit = () => {
    setEditId(null);
    setCreateMode(false);
    editIdRef.current = null;
    setForm({ title: '', description: '', price: '', requiredWorkers: '1', workDate: '', workTime: '', address: '', skillTags: '' });
    setFormLocation(null);
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
  };

  const fetchAddressSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setAddressSuggestions([]);
      return;
    }
    setLoadingAddressSuggestions(true);
    try {
      const results = await searchAddress(query);
      setAddressSuggestions(results);
      setShowAddressSuggestions(results.length > 0);
    } catch {
      setAddressSuggestions([]);
    } finally {
      setLoadingAddressSuggestions(false);
    }
  }, []);

  const handleAddressChange = useCallback((text: string) => {
    setForm((f) => ({ ...f, address: text }));
    setShowAddressSuggestions(false);
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    if (text.trim().length < 2) {
      setAddressSuggestions([]);
      return;
    }
    addressDebounceRef.current = setTimeout(() => {
      addressDebounceRef.current = null;
      fetchAddressSuggestions(text);
    }, 400);
  }, [fetchAddressSuggestions]);

  const selectAddressSuggestion = useCallback((suggestion: AddressSuggestion) => {
    setForm((f) => ({ ...f, address: suggestion.displayName }));
    setFormLocation({ lat: suggestion.lat, lng: suggestion.lng });
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
  }, []);

  useEffect(() => {
    return () => {
      if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    };
  }, []);

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền', 'Cho phép truy cập vị trí để đặt địa điểm công việc');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setFormLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      Alert.alert('Thành công', 'Đã lấy vị trí hiện tại');
    } catch {
      Alert.alert('Lỗi', 'Không thể lấy vị trí');
    } finally {
      setLoadingLocation(false);
    }
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

  const canGiveFeedback = (job: jobApi.Job) =>
    job.status === 'done' && normalizeAssignedWorkers(job).length > 0;

  /** Nút Đánh giá sáng: job done + có thợ + (API) còn thợ chưa được đánh giá. */
  const isFeedbackButtonBright = (job: jobApi.Job) => {
    if (!canGiveFeedback(job)) return false;
    if (typeof job.feedbackActionable === 'boolean') return job.feedbackActionable;
    return true;
  };

  const feedbackButtonLabel = (job: jobApi.Job) =>
    canGiveFeedback(job) && !isFeedbackButtonBright(job) ? 'Đã đánh giá' : 'Đánh giá';

  const feedbackDetailButtonLabel = (job: jobApi.Job) =>
    canGiveFeedback(job) && !isFeedbackButtonBright(job) ? 'Đã đánh giá' : 'Đánh giá thợ đã làm việc';

  const feedbackModalTitle = (job: jobApi.Job | null) => {
    if (!job) return 'Đánh giá thợ';
    const head =
      canGiveFeedback(job) && !isFeedbackButtonBright(job) ? 'Đã đánh giá' : 'Đánh giá thợ';
    return `${head} · ${job.title}`;
  };

  const openFeedbackModal = useCallback(
    async (job: jobApi.Job) => {
      const token = accessToken.trim();
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập');
        return;
      }
      setFeedbackJob(job);
      setFeedbackLoading(true);
      setDraftComment({});
      const jid = jobIdFromJob(job);
      if (!jid) {
        setFeedbackLoading(false);
        Alert.alert('Lỗi', 'Không xác định được mã job.');
        return;
      }
      try {
        const rev = await jobApi.listJobReviews(token, jid);
        setFeedbackReviews(rev);
        const workers = normalizeAssignedWorkers(job);
        const initR: Record<string, number> = {};
        workers.forEach((w) => {
          initR[w.id] = 5;
        });
        setDraftRating(initR);
      } catch (e) {
        setFeedbackReviews([]);
        Alert.alert('Lỗi', getErrorMessage(e));
      } finally {
        setFeedbackLoading(false);
      }
    },
    [accessToken],
  );

  const submitWorkerReview = useCallback(
    async (workerId: string) => {
      const token = accessToken.trim();
      if (!token || !feedbackJob) return;
      const jid = jobIdFromJob(feedbackJob);
      if (!jid) {
        Alert.alert('Lỗi', 'Không xác định được mã job.');
        return;
      }
      const rating = draftRating[workerId] ?? 5;
      if (rating < 1 || rating > 5) {
        Alert.alert('Lỗi', 'Chọn từ 1 đến 5 sao');
        return;
      }
      const comment = draftComment[workerId]?.trim();
      setFeedbackSaving(workerId);
      try {
        await jobApi.createJobReview(token, {
          jobId: jid,
          workerId,
          rating,
          ...(comment ? { comment } : {}),
        });
        const rev = await jobApi.listJobReviews(token, jid);
        setFeedbackReviews(rev);
        await fetchMyJobs();
        Alert.alert('Thành công', 'Đã gửi đánh giá.');
      } catch (e) {
        Alert.alert('Lỗi', getErrorMessage(e));
      } finally {
        setFeedbackSaving(null);
      }
    },
    [accessToken, feedbackJob, draftRating, draftComment, fetchMyJobs],
  );

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
          text: 'Hoàn thành',
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Action card với gradient */}
        <View style={styles.actionCardWrap}>
          <LinearGradient
            colors={[COLORS.primaryLight, '#FFFBEB']}
            style={styles.actionCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {loading && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary, styles.btnCreate]}
                activeOpacity={0.85}
                onPress={() => { setCreateMode(true); setEditId(null); editIdRef.current = null; setForm({ title: '', description: '', price: '', requiredWorkers: '1', workDate: '', workTime: '', address: '', skillTags: '' }); setFormLocation(null); }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.btnIconWrap}>
                  <Ionicons name="add" size={22} color="#fff" />
                </View>
                <Text style={styles.btnPrimaryText}>Đăng tin mới</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary, styles.btnRefresh]}
                activeOpacity={0.85}
                onPress={fetchMyJobs}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.btnIconWrapSecondary}>
                  <Ionicons name="refresh" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.btnSecondaryText}>Tải lại</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Filter theo trạng thái */}
        <View style={styles.filterCard}>
          <View style={styles.filterHeader}>
            <Ionicons name="filter" size={18} color={COLORS.primary} />
            <Text style={styles.filterLabel}>Lọc theo trạng thái</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {STATUS_FILTERS.map(({ value, label }) => {
              const isActive = statusFilter === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setStatusFilter(value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {label}
                  </Text>
                  {value !== 'all' && (
                    <View style={[styles.filterChipBadge, isActive && styles.filterChipBadgeActive]}>
                      <Text style={[styles.filterChipBadgeText, isActive && styles.filterChipBadgeTextActive]}>
                        {myJobs.filter((j) => j.status === value).length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Form */}
        {(createMode || editId) && (
          <View style={[styles.card, styles.formCard]}>
            <View style={styles.formTitleRow}>
              <Ionicons name={editId ? 'pencil' : 'add-circle'} size={22} color={COLORS.primary} style={{ marginRight: 10 }} />
              <Text style={styles.formTitle}>{editId ? 'Cập nhật tin' : 'Tạo tin mới'}</Text>
            </View>
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
            <View style={styles.addressInputWrap}>
              <TextInput
                placeholder="Nhập địa chỉ làm việc (gợi ý khi nhập 2+ ký tự)"
                value={form.address}
                onChangeText={handleAddressChange}
                onFocus={() => addressSuggestions.length > 0 && setShowAddressSuggestions(true)}
                onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />
              {loadingAddressSuggestions && (
                <View style={styles.addressSuggestLoading}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              )}
              {showAddressSuggestions && addressSuggestions.length > 0 && (
                <View style={styles.addressSuggestList}>
                  {addressSuggestions.map((s) => (
                    <TouchableOpacity
                      key={s.placeId}
                      style={styles.addressSuggestItem}
                      onPress={() => selectAddressSuggestion(s)}
                    >
                      <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.addressSuggestText} numberOfLines={2}>{s.displayName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Vị trí (tọa độ)</Text>
              <View style={styles.locationBtnRow}>
                <TouchableOpacity
                  style={[styles.locationBtn, formLocation && styles.locationBtnActive]}
                  onPress={getCurrentLocation}
                  disabled={loadingLocation}
                >
                  <Ionicons name="location" size={18} color={formLocation ? COLORS.success : COLORS.textMuted} />
                  <Text style={[styles.locationBtnText, formLocation && styles.locationBtnTextActive]} numberOfLines={1}>
                    {loadingLocation ? 'Đang lấy...' : formLocation ? `${formLocation.lat.toFixed(4)}, ${formLocation.lng.toFixed(4)}` : 'Vị trí hiện tại'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.locationBtn, formLocation && styles.locationBtnActive]}
                  onPress={() => setShowMapPicker(true)}
                >
                  <Ionicons name="map" size={18} color={formLocation ? COLORS.success : COLORS.textMuted} />
                  <Text style={[styles.locationBtnText, formLocation && styles.locationBtnTextActive]}>Chọn trên bản đồ</Text>
                </TouchableOpacity>
              </View>
            </View>
            <LocationMapPicker
              visible={showMapPicker}
              onClose={() => setShowMapPicker(false)}
              initialLocation={formLocation}
              onConfirm={(r) => {
                setFormLocation({ lat: r.lat, lng: r.lng });
                setForm((f) => ({ ...f, address: r.address }));
                setShowMapPicker(false);
              }}
            />
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
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleLeft}>
              <View style={styles.cardTitleIconWrap}>
                <Ionicons name="list" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Danh sách tin</Text>
            </View>
            <View style={styles.cardTitleBadge}>
              <Text style={styles.cardTitleBadgeText}>
                {filteredJobs.length}{statusFilter !== 'all' ? ` / ${myJobs.length}` : ''}
              </Text>
            </View>
          </View>
          {myJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="briefcase-outline" size={44} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyText}>Chưa có tin nào</Text>
              <Text style={styles.emptyHint}>Bấm Đăng tin mới để tạo tin tuyển dụng</Text>
            </View>
          ) : filteredJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, styles.emptyIconWrapMuted]}>
                <Ionicons name="filter-outline" size={40} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyText}>Không có tin với trạng thái này</Text>
              <Text style={styles.emptyHint}>Thử chọn bộ lọc khác</Text>
            </View>
          ) : (
            filteredJobs.map((job) => (
              <View key={job._id} style={[styles.jobCard, { borderLeftColor: getStatusColor(job.status) }]}>
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
                    <View style={styles.jobMetaItem}>
                      <Ionicons name="cash-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.jobPrice}>{job.price.toLocaleString('vi-VN')} VNĐ</Text>
                    </View>
                    <View style={styles.jobMetaItem}>
                      <Ionicons name="people-outline" size={16} color={COLORS.textMuted} />
                      <Text style={styles.jobMetaText}>
                        {job.assignedWorkers}/{job.requiredWorkers} người
                      </Text>
                    </View>
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
                    <Ionicons name="people" size={14} color={canReviewApplicants(job) ? COLORS.primary : '#9CA3AF'} style={{ marginRight: 4 }} />
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
                    <Ionicons name="checkmark-done" size={14} color={canComplete(job) ? COLORS.success : '#9CA3AF'} style={{ marginRight: 4 }} />
                    <Text style={[styles.jobBtnActionText, !canComplete(job) && { color: '#9CA3AF' }]}>
                      Hoàn thành
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.jobBtnAction, !canEditDelete(job.status) && styles.btnDisabled]}
                    onPress={() => canEditDelete(job.status) ? startEdit(job) : Alert.alert('Thông báo', 'Chỉ chỉnh sửa khi job đang ở trạng thái đang tuyển.')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil" size={14} color={canEditDelete(job.status) ? COLORS.text : '#9CA3AF'} style={{ marginRight: 4 }} />
                    <Text style={[styles.jobBtnActionText, !canEditDelete(job.status) && { color: '#9CA3AF' }]}>Sửa</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.jobBottomRow}>
                  <TouchableOpacity
                    style={[
                      styles.feedbackInlineBtn,
                      !canGiveFeedback(job) && styles.feedbackInlineBtnDim,
                    ]}
                    onPress={() => {
                      if (!canGiveFeedback(job)) {
                        Alert.alert(
                          'Thông báo',
                          job.status !== 'done'
                            ? 'Chỉ đánh giá sau khi job đã hoàn thành và có thợ được gán.'
                            : 'Chưa có thợ được gán để đánh giá.',
                        );
                        return;
                      }
                      void openFeedbackModal(job);
                    }}
                    activeOpacity={0.85}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <Ionicons
                      name="star"
                      size={14}
                      color={canGiveFeedback(job) ? COLORS.warning : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.feedbackInlineBtnText,
                        !canGiveFeedback(job) && styles.feedbackInlineBtnTextDim,
                      ]}>
                      {feedbackButtonLabel(job)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteInlineBtn, !canEditDelete(job.status) && styles.btnDisabled]}
                    onPress={() => canEditDelete(job.status) ? handleDelete(job._id, job.title) : Alert.alert('Thông báo', 'Chỉ xóa khi job đang ở trạng thái đang tuyển.')}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <Text style={[styles.deleteInlineBtnText, !canEditDelete(job.status) && { color: '#9CA3AF' }]}>Xóa</Text>
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
                  {selectedJob.status === 'done' ? (
                    <View style={styles.detailSection}>
                      <TouchableOpacity
                        style={[
                          styles.feedbackDetailBtn,
                          !canGiveFeedback(selectedJob) && styles.feedbackDetailBtnDim,
                        ]}
                        onPress={() => {
                          if (!canGiveFeedback(selectedJob)) {
                            Alert.alert(
                              'Thông báo',
                              normalizeAssignedWorkers(selectedJob).length === 0
                                ? 'Chưa có thợ được gán để đánh giá.'
                                : 'Không thể mở đánh giá lúc này.',
                            );
                            return;
                          }
                          const j = selectedJob;
                          setSelectedJob(null);
                          void openFeedbackModal(j);
                        }}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="star"
                          size={22}
                          color={
                            canGiveFeedback(selectedJob) ? COLORS.warning : COLORS.textMuted
                          }
                        />
                        <Text
                          style={[
                            styles.feedbackDetailBtnText,
                            !canGiveFeedback(selectedJob) && styles.feedbackInlineBtnTextDim,
                          ]}>
                          {feedbackDetailButtonLabel(selectedJob)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
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
                    <Text style={styles.detailLabel}>Địa chỉ làm việc</Text>
                    <Text style={styles.detailValue}>
                      {selectedJob.address?.trim() || `Tọa độ: ${selectedJob.location?.lat?.toFixed(4)}, ${selectedJob.location?.lng?.toFixed(4)}`}
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
                      if (canEditDelete(selectedJob.status)) {
                        startEdit(selectedJob);
                        setSelectedJob(null);
                      } else {
                        Alert.alert('Thông báo', 'Chỉ chỉnh sửa khi job đang ở trạng thái đang tuyển.');
                      }
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

      <Modal
        visible={!!feedbackJob}
        animationType="slide"
        transparent
        onRequestClose={() => setFeedbackJob(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFeedbackJob(null)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {feedbackModalTitle(feedbackJob)}
              </Text>
              <TouchableOpacity onPress={() => setFeedbackJob(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {feedbackLoading ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 24 }} />
              ) : feedbackJob && normalizeAssignedWorkers(feedbackJob).length === 0 ? (
                <Text style={styles.detailValue}>
                  Job đã hoàn thành nhưng chưa có thợ được gán để đánh giá.
                </Text>
              ) : (
                feedbackJob &&
                normalizeAssignedWorkers(feedbackJob).map((worker) => {
                  const existing = feedbackReviews.find((r) => String(r.workerId) === worker.id);
                  return (
                    <View key={worker.id} style={styles.feedbackWorkerCard}>
                      <Text style={styles.applicantName}>{worker.name}</Text>
                      {existing ? (
                        <View style={{ marginTop: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Ionicons
                                key={n}
                                name={n <= existing.rating ? 'star' : 'star-outline'}
                                size={18}
                                color={COLORS.warning}
                              />
                            ))}
                            <Text style={[styles.detailValue, { marginLeft: 4 }]}>Đã gửi</Text>
                          </View>
                          {existing.comment ? (
                            <Text style={[styles.detailValue, { marginTop: 8 }]}>{existing.comment}</Text>
                          ) : null}
                        </View>
                      ) : (
                        <View style={{ marginTop: 10 }}>
                          <Text style={[styles.detailLabel, { marginBottom: 6 }]}>Số sao (1–5)</Text>
                          <View style={styles.feedbackStarsRow}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <TouchableOpacity
                                key={n}
                                onPress={() =>
                                  setDraftRating((prev) => ({ ...prev, [worker.id]: n }))
                                }
                                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                              >
                                <Ionicons
                                  name={n <= (draftRating[worker.id] ?? 5) ? 'star' : 'star-outline'}
                                  size={30}
                                  color={COLORS.warning}
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                          <TextInput
                            placeholder="Nhận xét (không bắt buộc)"
                            placeholderTextColor={COLORS.textMuted}
                            value={draftComment[worker.id] ?? ''}
                            onChangeText={(t) =>
                              setDraftComment((prev) => ({ ...prev, [worker.id]: t }))
                            }
                            style={[styles.input, styles.inputMultiline, { marginTop: 10, minHeight: 72 }]}
                            multiline
                          />
                          <TouchableOpacity
                            style={[styles.btn, styles.btnPrimary, { marginTop: 12 }]}
                            disabled={feedbackSaving === worker.id}
                            onPress={() => void submitWorkerReview(worker.id)}
                          >
                            {feedbackSaving === worker.id ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <Text style={styles.btnPrimaryText}>Gửi đánh giá</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.btn, styles.btnOutline, styles.modalActionBtn]}
                onPress={() => setFeedbackJob(null)}
              >
                <Text style={styles.btnOutlineText}>Đóng</Text>
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
  scrollContent: { padding: 20 },
  actionCardWrap: { marginBottom: 18 },
  actionCard: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(180, 83, 9, 0.15)',
    overflow: 'hidden',
  },
  btnIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  btnIconWrapSecondary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  btnCreate: { flex: 1 },
  btnRefresh: { flex: 0.4, minWidth: 120 },
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
  filterCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  filterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  filterLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginLeft: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterScroll: { paddingRight: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 28,
    backgroundColor: '#FAFAF9',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  filterChipText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  filterChipTextActive: { color: COLORS.primaryDark },
  filterChipBadge: {
    marginLeft: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterChipBadgeActive: { backgroundColor: COLORS.primary },
  filterChipBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  filterChipBadgeTextActive: { color: '#fff' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  cardTitleLeft: { flexDirection: 'row', alignItems: 'center' },
  cardTitleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cardTitleBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(180, 83, 9, 0.2)',
  },
  cardTitleBadgeText: { fontSize: 13, fontWeight: '700', color: COLORS.primaryDark },
  cardHint: { fontSize: 13, color: COLORS.textMuted, marginBottom: 14 },
  input: {
    backgroundColor: '#FAFAF9',
    borderRadius: 16,
    paddingHorizontal: 20,
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
  addressInputWrap: { position: 'relative', marginBottom: 14 },
  addressSuggestLoading: { position: 'absolute', right: 16, top: 18 },
  addressSuggestList: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    marginTop: 4,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 200,
    zIndex: 10,
  },
  addressSuggestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  addressSuggestText: { flex: 1, fontSize: 14, color: COLORS.text, marginLeft: 10 },
  locationRow: { marginBottom: 14 },
  locationLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase' },
  locationBtnRow: { flexDirection: 'row', gap: 10 },
  locationBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationBtnActive: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success,
  },
  locationBtnText: { fontSize: 15, color: COLORS.textMuted, marginLeft: 10 },
  locationBtnTextActive: { color: COLORS.success, fontWeight: '600' },
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
  btn: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 22, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
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
  formCard: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  formTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  formTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyState: { paddingVertical: 48, paddingHorizontal: 24, alignItems: 'center', marginTop: 8 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconWrapMuted: { backgroundColor: COLORS.borderLight },
  emptyText: { fontSize: 17, color: COLORS.textMuted, marginBottom: 6, fontWeight: '500' },
  emptyHint: { fontSize: 14, color: COLORS.textMuted, opacity: 0.85 },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
    overflow: 'hidden',
  },
  jobCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  jobTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 22 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  statusBadgeLarge: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 14 },
  jobDesc: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 14, lineHeight: 22 },
  jobCardFooter: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  jobMetaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  jobPrice: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginLeft: 6 },
  jobMetaText: { fontSize: 13, color: COLORS.textMuted, marginLeft: 6 },
  jobActions: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  jobBtnAction: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  jobBtnActionText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 13 },
  jobBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  feedbackInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.warningLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  feedbackInlineBtnDim: {
    opacity: 0.5,
    backgroundColor: COLORS.borderLight,
    borderColor: COLORS.border,
  },
  feedbackInlineBtnText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  feedbackInlineBtnTextDim: {
    color: COLORS.textMuted,
  },
  deleteInlineBtn: {
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 0,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '88%',
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 24,
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
  modalBody: { maxHeight: 480, padding: 20 },
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
  feedbackWorkerCard: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#FAFAF9',
  },
  feedbackStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedbackDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.warningLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feedbackDetailBtnDim: {
    opacity: 0.55,
    backgroundColor: COLORS.borderLight,
    borderColor: COLORS.border,
  },
  feedbackDetailBtnText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
});
