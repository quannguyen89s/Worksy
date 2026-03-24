import { useState, useCallback, type ComponentProps } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from '@/components/ToastProvider';
import profileService from '@/services/profileService';
import * as SecureStore from 'expo-secure-store';
import { ProfileUserAvatar, PROFILE_AVATAR_ACCENT } from '@/components/ProfileScreens/ProfileUserAvatar';

const ACCENT = PROFILE_AVATAR_ACCENT;
const SCREEN_BG = '#FFF8E7';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  isVerified: boolean;
  createdAt: string;
}

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const result = await profileService.getProfile();
      setProfile(result.result);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        title: 'Lỗi',
        message: error.response?.data?.message || 'Không tải được hồ sơ',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleLogout = async () => {
    try {
      const apiClient = (await import('@/services/apiClient')).default;
      await apiClient.post('/auth/logout');
    } catch {
      /* ignore */
    }
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    Toast.show({
      type: 'success',
      title: 'Đã đăng xuất',
      message: 'Bạn đã đăng xuất thành công',
    });
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  if (loading && !profile) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: SCREEN_BG }}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text className="mt-3 text-gray-500">Đang tải hồ sơ...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: SCREEN_BG }} edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} colors={[ACCENT]} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Header + avatar */}
        <View className="px-5 pt-2 pb-5">
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: '#FEF3C7' }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={22} color={ACCENT} />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-800">Hồ sơ</Text>
            <View className="h-11 w-11" />
          </View>

          <View className="items-center">
            <ProfileUserAvatar
              name={profile?.name ?? ''}
              avatarRaw={profile?.avatar}
              size={100}
              borderWidth={5}
            />
            <View className="mt-4 flex-row items-center">
              <Ionicons
                name={profile?.isVerified ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={profile?.isVerified ? '#16A34A' : '#DC2626'}
              />
              <Text
                className="ml-1.5 text-sm font-semibold"
                style={{ color: profile?.isVerified ? '#16A34A' : '#DC2626' }}
              >
                {profile?.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
              </Text>
            </View>
            <Text className="mt-2 text-xl font-bold text-gray-900">{profile?.name}</Text>
            <Text className="mt-1 text-sm text-gray-500">{profile?.email}</Text>
          </View>
        </View>

        {/* Thẻ menu */}
        <View className="px-5 pb-8">
          <View
            className="rounded-2xl bg-white px-2 py-1"
            style={{
              shadowColor: '#78350F',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <MenuItem
              emphasized
              icon="create-outline"
              label="Chỉnh sửa thông tin"
              subtitle="Tên, ảnh đại diện"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <MenuItem
              emphasized
              icon="lock-closed-outline"
              label="Đổi mật khẩu"
              subtitle="Bảo mật tài khoản"
              onPress={() => navigation.navigate('ChangePassword')}
            />
            <View className="mx-3 h-px bg-gray-100" />
            <MenuItem icon="mail-outline" label="Email" value={profile?.email} />
            <MenuItem
              icon="briefcase-outline"
              label="Vai trò"
              value={getRoleLabel(profile?.role ?? '')}
            />
            <MenuItem
              icon="calendar-outline"
              label="Ngày tham gia"
              value={profile?.createdAt ? formatDate(profile.createdAt) : '—'}
            />
            <MenuItem
              icon="shield-checkmark-outline"
              label="Trạng thái tài khoản"
              value={profile?.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
              valueColor={profile?.isVerified ? '#16A34A' : '#DC2626'}
            />
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            className="mt-5 flex-row items-center rounded-2xl bg-white px-4 py-4"
            style={{
              shadowColor: '#DC2626',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-red-50">
              <Ionicons name="log-out-outline" size={22} color="#DC2626" />
            </View>
            <Text className="flex-1 text-base font-bold text-red-600">Đăng xuất</Text>
            <Ionicons name="chevron-forward" size={20} color="#FCA5A5" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  subtitle,
  onPress,
  value,
  valueColor,
  emphasized,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  subtitle?: string;
  onPress?: () => void;
  value?: string;
  valueColor?: string;
  /** Hàng CTA: viền kem + nút mũi tên nổi bật */
  emphasized?: boolean;
}) {
  const Container = onPress ? TouchableOpacity : View;
  const row = (
    <Container
      {...(onPress ? { onPress, activeOpacity: 0.72 } : {})}
      className={`flex-row items-center px-3 ${emphasized ? 'py-4' : 'py-3.5'}`}
    >
      <View
        className="mr-3.5 h-11 w-11 items-center justify-center rounded-full"
        style={{
          backgroundColor: emphasized ? '#fff' : '#FFFBEB',
          borderWidth: emphasized ? 1 : 0,
          borderColor: '#FDE68A',
          shadowColor: emphasized ? '#92400E' : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: emphasized ? 0.12 : 0,
          shadowRadius: 4,
          elevation: emphasized ? 2 : 0,
        }}
      >
        <Ionicons name={icon} size={21} color={ACCENT} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className={`text-gray-900 ${emphasized ? 'text-base font-bold' : 'text-base font-semibold'}`}>
          {label}
        </Text>
        {subtitle ? (
          <Text
            className={`mt-0.5 text-xs ${emphasized ? '' : 'text-gray-400'}`}
            style={emphasized ? { color: 'rgba(120, 53, 15, 0.65)' } : undefined}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value !== undefined && value !== '' ? (
        <Text
          className="ml-2 max-w-[46%] text-right text-sm font-medium"
          style={{ color: valueColor || '#6B7280' }}
          numberOfLines={2}
        >
          {value}
        </Text>
      ) : emphasized ? (
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(146, 64, 14, 0.12)' }}
        >
          <Ionicons name="chevron-forward" size={18} color={ACCENT} />
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
      )}
    </Container>
  );

  if (emphasized && onPress) {
    return (
      <View
        className="mb-2 overflow-hidden rounded-2xl"
        style={{
          borderWidth: 1.5,
          borderColor: '#FCD34D',
          backgroundColor: '#FFFBEB',
          shadowColor: '#B45309',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {row}
      </View>
    );
  }

  return row;
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'admin':
      return 'Quản trị viên';
    case 'employer':
      return 'Nhà tuyển dụng';
    case 'customer':
      return 'Khách hàng';
    default:
      return role || '—';
  }
}
