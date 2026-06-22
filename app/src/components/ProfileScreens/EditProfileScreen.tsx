import { useState, useCallback, type ComponentProps } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from '@/components/ToastProvider';
import profileService from '@/services/profileService';
import * as ImagePicker from 'expo-image-picker';
import { ProfileUserAvatar, PROFILE_AVATAR_ACCENT } from '@/components/ProfileScreens/ProfileUserAvatar';
import { ProfilePrimaryButton } from '@/components/ProfileScreens/ProfilePrimaryButton';

const ACCENT = PROFILE_AVATAR_ACCENT;
const SCREEN_BG = '#FFF8E7';

export default function EditProfileScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [avatarRaw, setAvatarRaw] = useState<string | null>(null);
  const [avatarCacheBust, setAvatarCacheBust] = useState(0);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const result = await profileService.getProfile();
      const p = result.result;
      setName(p.name || '');
      setAvatarRaw(p.avatar ?? null);
      setEmail(p.email || '');
      setRole(p.role || '');
      setCreatedAt(p.createdAt || '');
      setIsVerified(Boolean(p.isVerified));
    } catch {
      Toast.show({ type: 'error', title: 'Lỗi', message: 'Không tải được hồ sơ' });
    } finally {
      setBootstrapped(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const pickImage = async () => {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Toast.show({
        type: 'error',
        title: 'Cần quyền truy cập',
        message: 'Vui lòng cho phép truy cập thư viện ảnh để đổi ảnh đại diện',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setUploading(true);
      try {
        const uploadResult = await profileService.uploadAvatar(uri);
        const path = uploadResult?.result?.avatar;
        if (path) {
          setAvatarRaw(path);
          setAvatarCacheBust((n) => n + 1);
        }
        Toast.show({ type: 'success', title: 'Thành công', message: 'Đã cập nhật ảnh đại diện' });
      } catch (error: any) {
        Toast.show({
          type: 'error',
          title: 'Lỗi tải ảnh',
          message: error.response?.data?.message || 'Không upload được ảnh. Thử lại sau.',
        });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', title: 'Thiếu thông tin', message: 'Họ tên không được để trống' });
      return;
    }
    setSaving(true);
    try {
      await profileService.updateProfile({ name: name.trim() });
      Toast.show({ type: 'success', title: 'Đã lưu', message: 'Cập nhật hồ sơ thành công' });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        title: 'Lỗi',
        message: error.response?.data?.message || 'Không lưu được hồ sơ',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!bootstrapped) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: SCREEN_BG }}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text className="mt-3 text-gray-500">Đang tải...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: SCREEN_BG }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10 pt-2"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6 flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-3 h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: '#FEF3C7' }}
            >
              <Ionicons name="arrow-back" size={22} color={ACCENT} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">Chỉnh sửa hồ sơ</Text>
              <Text className="text-xs text-gray-500">Cập nhật tên và ảnh đại diện</Text>
            </View>
          </View>

          <View className="mb-8 items-center">
            <ProfileUserAvatar
              name={name}
              avatarRaw={avatarRaw}
              size={110}
              borderWidth={5}
              editable
              uploading={uploading}
              onPress={pickImage}
              cacheBust={avatarCacheBust}
              badgeBorderColor={SCREEN_BG}
            />
            <Text className="mt-3 text-center text-xs text-gray-500">
              Chạm vào ảnh để đổi ảnh đại diện
            </Text>
          </View>

          <View
            className="mb-6 rounded-2xl bg-white p-5"
            style={{
              shadowColor: '#78350F',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="mb-6">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Họ và tên</Text>
              <View
                className="flex-row items-center gap-3 pb-2"
                style={{ borderBottomWidth: 1.5, borderBottomColor: nameFocused ? ACCENT : '#F3F4F6' }}
              >
                <Ionicons name="person-outline" size={20} color={nameFocused ? ACCENT : '#B0B0B0'} />
                <TextInput
                  className="flex-1 p-0 text-base text-gray-900"
                  placeholder="Nhập họ tên"
                  placeholderTextColor="#B0B0B0"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                />
              </View>
            </View>

            <ReadOnlyField icon="mail-outline" label="Email" value={email} />
            <ReadOnlyField icon="shield-outline" label="Vai trò" value={getRoleLabel(role)} />
            <ReadOnlyField icon="calendar-outline" label="Ngày tham gia" value={formatDate(createdAt)} />

            <View className="mb-1">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Trạng thái</Text>
              <View className="flex-row items-center gap-3 border-b border-gray-100 pb-2">
                <Ionicons
                  name={isVerified ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={isVerified ? '#16A34A' : '#DC2626'}
                />
                <Text
                  className="flex-1 text-base font-semibold"
                  style={{ color: isVerified ? '#16A34A' : '#DC2626' }}
                >
                  {isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-1">
            <ProfilePrimaryButton
              label="Lưu thay đổi"
              icon="checkmark-circle"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReadOnlyField({
  icon,
  label,
  value,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View className="mb-6">
      <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</Text>
      <View className="flex-row items-center gap-3 border-b border-gray-100 pb-2">
        <Ionicons name={icon} size={20} color="#B0B0B0" />
        <Text className="flex-1 text-base text-gray-600">{value || '—'}</Text>
        <Ionicons name="lock-closed" size={14} color="#D1D5DB" />
      </View>
    </View>
  );
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
