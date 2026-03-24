import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@/navigation/types';
import {
  createUser,
  fetchUsers,
  patchUser,
  toErrMessage,
  type UserRow,
} from '@/api/adminApi';
import { adminTheme } from '@/constants/adminTheme';
import AdminBottomBar from '@/screens/admin/AdminBottomBar';

type Props = StackScreenProps<RootStackParamList, 'AdminUsers'>;

const ROLES = ['customer', 'worker', 'admin'] as const;
const ROLE_LABEL: Record<string, string> = {
  customer: 'Khách',
  worker: 'Thợ',
  admin: 'Admin',
};

export default function AdminUsersScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const TAB_H = 58;
  const bottomPad = Math.max(insets.bottom, 10);
  const bottomBarHeight = TAB_H + bottomPad;

  const [items, setItems] = useState<UserRow[]>([]);
  const limit = 500;
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addConfirm, setAddConfirm] = useState('');
  const [addRole, setAddRole] = useState<string>('customer');
  const [addIsVerified, setAddIsVerified] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<string>('customer');
  const [editIsVerified, setEditIsVerified] = useState(false);
  const [editIsDeleted, setEditIsDeleted] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetchUsers({
        page: 1,
        limit,
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(search ? { search } : {}),
      });
      setItems(res.items);
    } catch (e) {
      setError(toErrMessage(e));
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search, limit]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function updateRow(
    id: string,
    body: { role?: string; isVerified?: boolean; isDeleted?: boolean }
  ) {
    setBusyId(id);
    setError(null);
    try {
      await patchUser(id, body);
      await load();
    } catch (e) {
      setError(toErrMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  function openEditUser(u: UserRow) {
    setEditError(null);
    setEditing(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditIsVerified(Boolean(u.isVerified));
    setEditIsDeleted(Boolean(u.isDeleted));
  }

  async function saveEditUser() {
    if (!editing) return;
    setEditBusy(true);
    setEditError(null);
    try {
      await patchUser(editing._id, {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        isVerified: editIsVerified,
        isDeleted: editIsDeleted,
      });
      setEditing(null);
      await load();
    } catch (e) {
      setEditError(toErrMessage(e));
    } finally {
      setEditBusy(false);
    }
  }

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
          Người dùng
        </Text>
      </View>

      <View className="px-4 pt-3">
        {error ? (
          <View className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
            <Text style={{ color: adminTheme.danger, fontSize: 13 }}>{error}</Text>
          </View>
        ) : null}
        <Text className="mb-1 text-xs font-semibold" style={{ color: adminTheme.brownMuted }}>
          Lọc vai trò
        </Text>
        <View className="mb-3 flex-row flex-wrap gap-2">
          <TouchableOpacity
            className="rounded-full px-3 py-1.5"
            style={{
              backgroundColor: roleFilter === '' ? adminTheme.brown : adminTheme.pillBg,
            }}
            onPress={() => {
              setRoleFilter('');
            }}>
            <Text
              style={{
                color: roleFilter === '' ? '#fff' : adminTheme.brown,
                fontWeight: '600',
                fontSize: 12,
              }}>
              Tất cả
            </Text>
          </TouchableOpacity>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r}
              className="rounded-full px-3 py-1.5"
              style={{
                backgroundColor: roleFilter === r ? adminTheme.brown : adminTheme.pillBg,
              }}
              onPress={() => {
                setRoleFilter(r);
              }}>
              <Text
                style={{
                  color: roleFilter === r ? '#fff' : adminTheme.brown,
                  fontWeight: '600',
                  fontSize: 12,
                }}>
                {ROLE_LABEL[r]}
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
            placeholder="Tìm tên hoặc email…"
            placeholderTextColor={adminTheme.brownMuted}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={() => {
              setSearch(searchInput.trim());
            }}
          />
          <TouchableOpacity
            className="justify-center rounded-xl px-4 py-2"
            style={{ backgroundColor: adminTheme.pillBg }}
            onPress={() => {
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
          keyExtractor={(u) => u._id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: bottomBarHeight + 24,
          }}
          refreshing={loading}
          onRefresh={() => void load()}
          ListEmptyComponent={
            <Text className="py-8 text-center" style={{ color: adminTheme.brownMuted }}>
              Không có bản ghi.
            </Text>
          }
          renderItem={({ item: u }) => (
            <View
              className="mb-3 rounded-2xl p-4"
              style={{
                backgroundColor: adminTheme.card,
                borderWidth: 1,
                borderColor: adminTheme.borderSoft,
              }}>
              <Text className="text-base font-bold" style={{ color: adminTheme.brown }}>
                {u.name}
              </Text>
              <Text className="mt-0.5 text-sm" style={{ color: adminTheme.brownMuted }}>
                {u.email}
              </Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    disabled={busyId === u._id}
                    className="rounded-lg px-2.5 py-1"
                    style={{
                      backgroundColor: u.role === r ? adminTheme.brown : adminTheme.pillBg,
                      opacity: busyId === u._id ? 0.5 : 1,
                    }}
                    onPress={() => void updateRow(u._id, { role: r })}>
                    <Text
                      style={{
                        color: u.role === r ? '#fff' : adminTheme.brown,
                        fontSize: 11,
                        fontWeight: '700',
                      }}>
                      {ROLE_LABEL[r]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                className="mt-3 self-start rounded-xl px-3 py-1.5"
                style={{ backgroundColor: adminTheme.pillBg }}
                disabled={busyId === u._id}
                onPress={() => void updateRow(u._id, { isVerified: !u.isVerified })}>
                <Text className="text-xs font-semibold" style={{ color: adminTheme.brown }}>
                  {u.isVerified ? 'Đã xác minh · Chạm để tắt' : 'Chưa xác minh · Bật'}
                </Text>
              </TouchableOpacity>
              <View className="mt-3">
                <Text className="text-xs" style={{ color: adminTheme.brownMuted }}>
                  Đánh giá {u.rating?.toFixed(1) ?? '—'} · Việc xong {u.completedJobs ?? 0}
                  {u.isDeleted ? ' · Đã xóa' : ''}
                </Text>
              </View>
              <View className="mt-3 flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center rounded-xl px-3 py-2.5"
                  style={{
                    backgroundColor: adminTheme.brownMid,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    opacity: busyId === u._id ? 0.6 : 1,
                  }}
                  disabled={busyId === u._id}
                  onPress={() => openEditUser(u)}>
                  <Ionicons name="create-outline" size={14} color="#fff" />
                  <Text className="text-xs font-semibold" style={{ color: '#fff' }}>
                    Chỉnh sửa
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center rounded-xl px-3 py-2.5"
                  style={{
                    backgroundColor: u.isDeleted ? '#DCFCE7' : '#FEE2E2',
                    borderWidth: 1,
                    borderColor: u.isDeleted ? '#86EFAC' : '#FCA5A5',
                    gap: 6,
                    opacity: busyId === u._id ? 0.6 : 1,
                  }}
                  disabled={busyId === u._id}
                  onPress={() => void updateRow(u._id, { isDeleted: !Boolean(u.isDeleted) })}>
                  <Ionicons
                    name={u.isDeleted ? 'refresh-outline' : 'trash-outline'}
                    size={14}
                    color={u.isDeleted ? adminTheme.teal : adminTheme.danger}
                  />
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: u.isDeleted ? adminTheme.teal : adminTheme.danger }}>
                    {u.isDeleted ? 'Khôi phục' : 'Xóa'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={{
          position: 'absolute',
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: adminTheme.brown,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: adminTheme.brown,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 10,
          borderWidth: 4,
          borderColor: adminTheme.bgPage,
          bottom: bottomBarHeight + 8,
          zIndex: 20,
        }}
        activeOpacity={0.9}
        onPress={() => {
          setAddError(null);
          setAddOpen(true);
        }}
        disabled={addBusy}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <AdminBottomBar navigation={navigation} active="AdminUsers" />

      <Modal visible={addOpen} animationType="slide" transparent>
        <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: adminTheme.bgPage,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 16,
              paddingBottom: 24,
              minHeight: 240,
            }}>
            <ScrollView
              contentContainerStyle={{ paddingBottom: bottomBarHeight + 20 }}
              keyboardShouldPersistTaps="handled">
              <View className="flex-row items-center justify-between">
                <Text style={{ fontSize: 18, fontWeight: '900', color: adminTheme.brown }}>
                  Thêm người dùng
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (addBusy) return;
                    setAddOpen(false);
                  }}
                  hitSlop={10}>
                  <Text style={{ color: adminTheme.brownMuted, fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              </View>

              {addError ? (
                <View className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                  <Text style={{ color: adminTheme.danger, fontSize: 13 }}>{addError}</Text>
                </View>
              ) : null}

              <View className="mt-4 gap-3">
                <View>
                  <Text style={{ color: adminTheme.brown, fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
                    Tên
                  </Text>
                  <TextInput
                    value={addName}
                    onChangeText={setAddName}
                    placeholder="Tên đầy đủ"
                    placeholderTextColor={adminTheme.brownMuted}
                    style={{
                      backgroundColor: adminTheme.card,
                      borderWidth: 1,
                      borderColor: adminTheme.borderSoft,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: adminTheme.brownMid,
                    }}
                  />
                </View>

                <View>
                  <Text style={{ color: adminTheme.brown, fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
                    Email
                  </Text>
                  <TextInput
                    value={addEmail}
                    onChangeText={setAddEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="you@email.com"
                    placeholderTextColor={adminTheme.brownMuted}
                    style={{
                      backgroundColor: adminTheme.card,
                      borderWidth: 1,
                      borderColor: adminTheme.borderSoft,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: adminTheme.brownMid,
                    }}
                  />
                </View>

                <View className="flex-row gap-3">
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: adminTheme.brown, fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
                      Mật khẩu
                    </Text>
                    <TextInput
                      value={addPassword}
                      onChangeText={setAddPassword}
                      secureTextEntry
                      placeholder="••••••••"
                      placeholderTextColor={adminTheme.brownMuted}
                      style={{
                        backgroundColor: adminTheme.card,
                        borderWidth: 1,
                        borderColor: adminTheme.borderSoft,
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        color: adminTheme.brownMid,
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: adminTheme.brown, fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
                      Xác nhận
                    </Text>
                    <TextInput
                      value={addConfirm}
                      onChangeText={setAddConfirm}
                      secureTextEntry
                      placeholder="••••••••"
                      placeholderTextColor={adminTheme.brownMuted}
                      style={{
                        backgroundColor: adminTheme.card,
                        borderWidth: 1,
                        borderColor: adminTheme.borderSoft,
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        color: adminTheme.brownMid,
                      }}
                    />
                  </View>
                </View>

                <View>
                  <Text style={{ color: adminTheme.brown, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>
                    Vai trò
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {ROLES.map((r) => (
                      <TouchableOpacity
                        key={r}
                        onPress={() => setAddRole(r)}
                        disabled={addBusy}
                        className="rounded-full px-3 py-1.5"
                        style={{
                          backgroundColor: addRole === r ? adminTheme.brown : adminTheme.pillBg,
                        }}>
                        <Text
                          style={{
                            color: addRole === r ? '#fff' : adminTheme.brown,
                            fontWeight: '700',
                            fontSize: 12,
                          }}>
                          {ROLE_LABEL[r]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text style={{ color: adminTheme.brown, fontSize: 13, fontWeight: '700' }}>
                    Xác minh
                  </Text>
                  <TouchableOpacity
                    disabled={addBusy}
                    onPress={() => setAddIsVerified((v) => !v)}
                    style={{
                      backgroundColor: addIsVerified ? adminTheme.teal : adminTheme.pillBg,
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                      {addIsVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text style={{ color: adminTheme.brown, fontSize: 13, fontWeight: '700' }}>
                    Xóa
                  </Text>
                  <TouchableOpacity
                    disabled={editBusy}
                    onPress={() => setEditIsDeleted((v) => !v)}
                    style={{
                      backgroundColor: editIsDeleted ? adminTheme.danger : adminTheme.pillBg,
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                      {editIsDeleted ? 'Đã xóa' : 'Đang hoạt động'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-3 mt-2">
                  <TouchableOpacity
                    className="flex-1 items-center rounded-xl py-3"
                    style={{ backgroundColor: adminTheme.brownMid, opacity: addBusy ? 0.7 : 1 }}
                    disabled={addBusy}
                    onPress={async () => {
                      setAddError(null);
                      setAddBusy(true);
                      try {
                        await createUser({
                          name: addName.trim(),
                          email: addEmail.trim(),
                          password: addPassword,
                          confirm_password: addConfirm,
                          role: addRole,
                          isVerified: addIsVerified,
                        });
                        setAddOpen(false);
                        setAddName('');
                        setAddEmail('');
                        setAddPassword('');
                        setAddConfirm('');
                        setAddRole('customer');
                        setAddIsVerified(false);
                        await load();
                      } catch (e) {
                        setAddError(toErrMessage(e));
                      } finally {
                        setAddBusy(false);
                      }
                    }}>
                    {addBusy ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ color: '#fff', fontWeight: '900' }}>Tạo</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  className="items-center rounded-xl py-3"
                  style={{ backgroundColor: adminTheme.card, borderWidth: 1, borderColor: adminTheme.borderSoft, marginTop: 10 }}
                  disabled={addBusy}
                  onPress={() => setAddOpen(false)}>
                  <Text style={{ color: adminTheme.brownMuted, fontWeight: '800' }}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!editing} animationType="slide" transparent>
        <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: adminTheme.bgPage,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 16,
              paddingBottom: 24,
              minHeight: 240,
            }}>
            <ScrollView contentContainerStyle={{ paddingBottom: bottomBarHeight + 20 }} keyboardShouldPersistTaps="handled">
              <View className="flex-row items-center justify-between">
                <Text style={{ fontSize: 18, fontWeight: '900', color: adminTheme.brown }}>
                  Chỉnh sửa người dùng
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (editBusy) return;
                    setEditing(null);
                  }}
                  hitSlop={10}>
                  <Text style={{ color: adminTheme.brownMuted, fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              </View>

              {editError ? (
                <View className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                  <Text style={{ color: adminTheme.danger, fontSize: 13 }}>{editError}</Text>
                </View>
              ) : null}

              <View className="mt-4 gap-3">
                <View>
                  <Text style={{ color: adminTheme.brown, fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
                    Tên
                  </Text>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Tên đầy đủ"
                    placeholderTextColor={adminTheme.brownMuted}
                    style={{
                      backgroundColor: adminTheme.card,
                      borderWidth: 1,
                      borderColor: adminTheme.borderSoft,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: adminTheme.brownMid,
                    }}
                  />
                </View>

                <View>
                  <Text style={{ color: adminTheme.brown, fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
                    Email
                  </Text>
                  <TextInput
                    value={editEmail}
                    onChangeText={setEditEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="you@email.com"
                    placeholderTextColor={adminTheme.brownMuted}
                    style={{
                      backgroundColor: adminTheme.card,
                      borderWidth: 1,
                      borderColor: adminTheme.borderSoft,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: adminTheme.brownMid,
                    }}
                  />
                </View>

                <View>
                  <Text style={{ color: adminTheme.brown, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>
                    Vai trò
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {ROLES.map((r) => (
                      <TouchableOpacity
                        key={r}
                        onPress={() => setEditRole(r)}
                        disabled={editBusy}
                        className="rounded-full px-3 py-1.5"
                        style={{
                          backgroundColor: editRole === r ? adminTheme.brown : adminTheme.pillBg,
                        }}>
                        <Text
                          style={{
                            color: editRole === r ? '#fff' : adminTheme.brown,
                            fontWeight: '700',
                            fontSize: 12,
                          }}>
                          {ROLE_LABEL[r]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text style={{ color: adminTheme.brown, fontSize: 13, fontWeight: '700' }}>
                    Xác minh
                  </Text>
                  <TouchableOpacity
                    disabled={editBusy}
                    onPress={() => setEditIsVerified((v) => !v)}
                    style={{
                      backgroundColor: editIsVerified ? adminTheme.teal : adminTheme.pillBg,
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                      {editIsVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-3 mt-2">
                  <TouchableOpacity
                    className="flex-1 items-center rounded-xl py-3"
                    style={{ backgroundColor: adminTheme.brownMid, opacity: editBusy ? 0.7 : 1 }}
                    disabled={editBusy}
                    onPress={() => void saveEditUser()}>
                    {editBusy ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ color: '#fff', fontWeight: '900' }}>Lưu thay đổi</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
