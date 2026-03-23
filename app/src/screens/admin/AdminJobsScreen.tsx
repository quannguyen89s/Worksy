import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@/navigation/types';
import { deleteJob, fetchJobs, patchJob, toErrMessage, type JobRow } from '@/api/adminApi';
import { adminTheme } from '@/constants/adminTheme';
import AdminBottomBar from '@/screens/admin/AdminBottomBar';

type Props = StackScreenProps<RootStackParamList, 'AdminJobs'>;

const STATUSES = ['open', 'partial', 'full', 'done'] as const;
const STATUS_LABEL: Record<string, string> = {
  open: 'Đang mở',
  partial: 'Một phần',
  full: 'Đủ người',
  done: 'Hoàn thành',
};

const money = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);

export default function AdminJobsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const TAB_H = 58;
  const bottomPad = Math.max(insets.bottom, 10);
  const bottomBarHeight = TAB_H + bottomPad;

  const [items, setItems] = useState<JobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 12;
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<JobRow | null>(null);
  const [deleting, setDeleting] = useState<JobRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStatus, setEditStatus] = useState<string>('open');

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetchJobs({
        page,
        limit,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(toErrMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  function openEdit(job: JobRow) {
    setEditing(job);
    setEditTitle(job.title);
    setEditDesc(job.description);
    setEditPrice(String(job.price));
    setEditStatus(job.status);
  }

  async function saveEdit() {
    if (!editing) return;
    const price = Number(editPrice);
    if (!Number.isFinite(price) || price < 0) {
      setError('Giá không hợp lệ');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await patchJob(editing._id, {
        title: editTitle.trim(),
        description: editDesc,
        price,
        status: editStatus,
      });
      setEditing(null);
      await load();
    } catch (e) {
      setError(toErrMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setSaving(true);
    setError(null);
    try {
      await deleteJob(deleting._id);
      setDeleting(null);
      await load();
    } catch (e) {
      setError(toErrMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: adminTheme.bgPage }}>
      <View
        className="flex-row items-center px-4 py-3"
        style={{
          backgroundColor: adminTheme.bgHeader,
          borderBottomWidth: 1,
          borderBottomColor: adminTheme.borderSoft,
        }}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={{ color: adminTheme.brown, fontSize: 16 }}>←</Text>
        </TouchableOpacity>
        <Text
          className="mr-6 flex-1 text-center text-lg font-bold"
          style={{ color: adminTheme.brown }}>
          Việc làm
        </Text>
      </View>

      <View className="px-4 pt-3">
        {error ? (
          <View className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
            <Text style={{ color: adminTheme.danger, fontSize: 13 }}>{error}</Text>
          </View>
        ) : null}
        <Text className="mb-1 text-xs font-semibold" style={{ color: adminTheme.brownMuted }}>
          Trạng thái
        </Text>
        <View className="mb-3 flex-row flex-wrap gap-2">
          <TouchableOpacity
            className="rounded-full px-3 py-1.5"
            style={{
              backgroundColor: statusFilter === '' ? adminTheme.brown : adminTheme.pillBg,
            }}
            onPress={() => {
              setPage(1);
              setStatusFilter('');
            }}>
            <Text
              style={{
                color: statusFilter === '' ? '#fff' : adminTheme.brown,
                fontWeight: '600',
                fontSize: 12,
              }}>
              Tất cả
            </Text>
          </TouchableOpacity>
          {STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              className="rounded-full px-3 py-1.5"
              style={{
                backgroundColor: statusFilter === s ? adminTheme.brown : adminTheme.pillBg,
              }}
              onPress={() => {
                setPage(1);
                setStatusFilter(s);
              }}>
              <Text
                style={{
                  color: statusFilter === s ? '#fff' : adminTheme.brown,
                  fontWeight: '600',
                  fontSize: 12,
                }}>
                {STATUS_LABEL[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View className="mb-3 flex-row gap-2">
          <TextInput
            className="flex-1 rounded-xl px-3 py-2 text-sm"
            style={{
              backgroundColor: adminTheme.card,
              borderWidth: 1,
              borderColor: adminTheme.borderSoft,
              color: adminTheme.brownMid,
            }}
            placeholder="Tìm tiêu đề / mô tả…"
            placeholderTextColor={adminTheme.brownMuted}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={() => {
              setPage(1);
              setSearch(searchInput.trim());
            }}
          />
          <TouchableOpacity
            className="justify-center rounded-xl px-4 py-2"
            style={{ backgroundColor: adminTheme.pillBg }}
            onPress={() => {
              setPage(1);
              setSearch(searchInput.trim());
            }}>
            <Text className="font-semibold" style={{ color: adminTheme.brown }}>
              Tìm
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && items.length === 0 ? (
        <ActivityIndicator color={adminTheme.teal} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(j) => j._id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: bottomBarHeight + 70,
          }}
          refreshing={loading}
          onRefresh={() => void load()}
          ListEmptyComponent={
            <Text className="py-8 text-center" style={{ color: adminTheme.brownMuted }}>
              Không có việc làm.
            </Text>
          }
          renderItem={({ item: job }) => (
            <View
              className="mb-3 rounded-2xl p-4"
              style={{
                backgroundColor: adminTheme.card,
                borderWidth: 1,
                borderColor: adminTheme.borderSoft,
              }}>
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-base font-bold" style={{ color: adminTheme.brown }}>
                  {job.title}
                </Text>
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor:
                      job.status === 'done' ? 'rgba(0,137,123,0.15)' : adminTheme.pillBg,
                  }}>
                  <Text
                    className="text-xs font-bold"
                    style={{
                      color: job.status === 'done' ? adminTheme.teal : adminTheme.brown,
                    }}>
                    {STATUS_LABEL[job.status] ?? job.status}
                  </Text>
                </View>
              </View>
              <Text
                className="mt-1 text-sm"
                numberOfLines={2}
                style={{ color: adminTheme.brownMuted }}>
                {job.description}
              </Text>
              <Text className="mt-2 text-lg font-bold" style={{ color: adminTheme.teal }}>
                {money(job.price)}
              </Text>
              <Text className="mt-1 text-xs" style={{ color: adminTheme.brownMuted }}>
                Người đăng: {job.createdBy?.name ?? job.createdBy?.email ?? '—'} · Slot{' '}
                {job.assignedWorkers}/{job.requiredWorkers}
              </Text>
              {job.skillTags?.length ? (
                <View className="mt-2 flex-row flex-wrap gap-1">
                  {job.skillTags.slice(0, 5).map((t) => (
                    <View
                      key={t}
                      className="rounded-lg px-2 py-0.5"
                      style={{ backgroundColor: adminTheme.pillBg }}>
                      <Text className="text-xs" style={{ color: adminTheme.brown }}>
                        {t}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <View className="mt-3 flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 items-center rounded-xl py-2.5"
                  style={{ backgroundColor: adminTheme.pillBg }}
                  onPress={() => openEdit(job)}>
                  <Text className="font-semibold" style={{ color: adminTheme.brown }}>
                    Sửa
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 items-center rounded-xl py-2.5"
                  style={{ backgroundColor: adminTheme.danger }}
                  onPress={() => setDeleting(job)}>
                  <Text className="font-semibold text-white">Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <View
        className="absolute left-0 right-0 flex-row items-center justify-center gap-4 border-t py-3"
        style={{
          borderTopColor: adminTheme.borderSoft,
          backgroundColor: adminTheme.card,
          bottom: bottomBarHeight,
        }}>
        <TouchableOpacity
          disabled={page <= 1}
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1">
          <Text style={{ color: page <= 1 ? adminTheme.brownMuted : adminTheme.brown }}>Trước</Text>
        </TouchableOpacity>
        <Text className="text-sm" style={{ color: adminTheme.brownMuted }}>
          {page}/{pages} · {total} việc
        </Text>
        <TouchableOpacity
          disabled={page >= pages}
          onPress={() => setPage((p) => p + 1)}
          className="px-3 py-1">
          <Text style={{ color: page >= pages ? adminTheme.brownMuted : adminTheme.brown }}>
            Sau
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!editing} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View
            className="max-h-[88%] rounded-t-3xl"
            style={{ backgroundColor: adminTheme.bgPage }}>
            <ScrollView className="p-5" keyboardShouldPersistTaps="handled">
              <Text className="mb-3 text-lg font-bold" style={{ color: adminTheme.brown }}>
                Chỉnh sửa việc làm
              </Text>
              <Text className="mb-1 text-xs font-semibold" style={{ color: adminTheme.brown }}>
                Tiêu đề
              </Text>
              <TextInput
                className="mb-3 rounded-xl px-3 py-2"
                style={{
                  backgroundColor: adminTheme.card,
                  borderWidth: 1,
                  borderColor: adminTheme.borderSoft,
                  color: adminTheme.brownMid,
                }}
                value={editTitle}
                onChangeText={setEditTitle}
              />
              <Text className="mb-1 text-xs font-semibold" style={{ color: adminTheme.brown }}>
                Mô tả
              </Text>
              <TextInput
                className="mb-3 min-h-[100px] rounded-xl px-3 py-2"
                style={{
                  backgroundColor: adminTheme.card,
                  borderWidth: 1,
                  borderColor: adminTheme.borderSoft,
                  color: adminTheme.brownMid,
                  textAlignVertical: 'top',
                }}
                multiline
                value={editDesc}
                onChangeText={setEditDesc}
              />
              <Text className="mb-1 text-xs font-semibold" style={{ color: adminTheme.brown }}>
                Giá (VND)
              </Text>
              <TextInput
                className="mb-3 rounded-xl px-3 py-2"
                keyboardType="numeric"
                style={{
                  backgroundColor: adminTheme.card,
                  borderWidth: 1,
                  borderColor: adminTheme.borderSoft,
                  color: adminTheme.brownMid,
                }}
                value={editPrice}
                onChangeText={setEditPrice}
              />
              <Text className="mb-1 text-xs font-semibold" style={{ color: adminTheme.brown }}>
                Trạng thái
              </Text>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    className="rounded-full px-3 py-1.5"
                    style={{
                      backgroundColor: editStatus === s ? adminTheme.brown : adminTheme.pillBg,
                    }}
                    onPress={() => setEditStatus(s)}>
                    <Text
                      style={{
                        color: editStatus === s ? '#fff' : adminTheme.brown,
                        fontSize: 12,
                        fontWeight: '600',
                      }}>
                      {STATUS_LABEL[s]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View className="flex-row gap-2 pb-6">
                <TouchableOpacity
                  className="flex-1 items-center rounded-xl border py-3"
                  style={{ borderColor: adminTheme.borderSoft }}
                  onPress={() => setEditing(null)}
                  disabled={saving}>
                  <Text style={{ color: adminTheme.brown }}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 items-center rounded-xl py-3"
                  style={{ backgroundColor: adminTheme.brown }}
                  onPress={() => void saveEdit()}
                  disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="font-semibold text-white">Lưu</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!deleting} animationType="fade" transparent>
        <View
          className="flex-1 justify-center px-6"
          style={{ backgroundColor: 'rgba(62,39,35,0.4)' }}>
          <View
            className="rounded-2xl p-5"
            style={{
              backgroundColor: adminTheme.card,
              borderWidth: 1,
              borderColor: adminTheme.borderSoft,
            }}>
            <Text className="text-lg font-bold" style={{ color: adminTheme.brown }}>
              Xóa việc làm?
            </Text>
            <Text className="mt-2 text-sm" style={{ color: adminTheme.brownMuted }}>
              {deleting?.title} — không hoàn tác. Đơn ứng tuyển liên quan cũng bị xóa.
            </Text>
            <View className="mt-5 flex-row gap-2">
              <TouchableOpacity
                className="flex-1 items-center rounded-xl border py-3"
                style={{ borderColor: adminTheme.borderSoft }}
                onPress={() => setDeleting(null)}
                disabled={saving}>
                <Text style={{ color: adminTheme.brown }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 items-center rounded-xl py-3"
                style={{ backgroundColor: adminTheme.danger }}
                onPress={() => void confirmDelete()}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-semibold text-white">Xóa</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AdminBottomBar navigation={navigation} active="AdminJobs" />
    </SafeAreaView>
  );
}
