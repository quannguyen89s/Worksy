import { useState, type ComponentProps } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from '@/components/ToastProvider';
import profileService from '@/services/profileService';
import { PROFILE_AVATAR_ACCENT } from '@/components/ProfileScreens/ProfileUserAvatar';
import { ProfilePrimaryButton } from '@/components/ProfileScreens/ProfilePrimaryButton';

const ACCENT = PROFILE_AVATAR_ACCENT;
const SCREEN_BG = '#FFF8E7';

export default function ChangePasswordScreen({ navigation }: any) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentFocused, setCurrentFocused] = useState(false);
  const [newFocused, setNewFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Toast.show({ type: 'error', title: 'Thiếu thông tin', message: 'Nhập mật khẩu hiện tại' });
      return;
    }
    if (!newPassword) {
      Toast.show({ type: 'error', title: 'Thiếu thông tin', message: 'Nhập mật khẩu mới' });
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({ type: 'error', title: 'Mật khẩu yếu', message: 'Mật khẩu mới cần ít nhất 6 ký tự' });
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      Toast.show({
        type: 'error',
        title: 'Mật khẩu yếu',
        message: 'Cần ít nhất 1 chữ in hoa',
      });
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      Toast.show({
        type: 'error',
        title: 'Mật khẩu yếu',
        message: 'Cần ít nhất 1 chữ số',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', title: 'Không khớp', message: 'Xác nhận mật khẩu không trùng' });
      return;
    }

    setLoading(true);
    try {
      await profileService.changePassword(currentPassword, newPassword, confirmPassword);
      Toast.show({ type: 'success', title: 'Thành công', message: 'Đã đổi mật khẩu' });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        title: 'Lỗi',
        message: error.response?.data?.message || 'Không đổi được mật khẩu',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: SCREEN_BG }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-5 pb-10 pt-2"
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
              <Text className="text-lg font-bold text-gray-900">Đổi mật khẩu</Text>
              <Text className="text-xs text-gray-500">Bảo mật tài khoản của bạn</Text>
            </View>
          </View>

          <View className="mb-8 items-center">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-amber-50">
              <Ionicons name="lock-closed" size={36} color={ACCENT} />
            </View>
            <Text className="mt-3 text-center text-xs leading-5 text-gray-500">
              Tối thiểu 6 ký tự, gồm 1 chữ in hoa và 1 số
            </Text>
          </View>

          <View
            className="rounded-2xl bg-white p-5"
            style={{
              shadowColor: '#78350F',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <PasswordField
              label="Mật khẩu hiện tại"
              icon="key-outline"
              placeholder="Nhập mật khẩu hiện tại"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              focused={currentFocused}
              onFocus={() => setCurrentFocused(true)}
              onBlur={() => setCurrentFocused(false)}
              secure={!showCurrent}
              onToggleSecure={() => setShowCurrent(!showCurrent)}
              showSecure={showCurrent}
            />
            <PasswordField
              label="Mật khẩu mới"
              icon="lock-closed-outline"
              placeholder="Ít nhất 6 ký tự, 1 hoa, 1 số"
              value={newPassword}
              onChangeText={setNewPassword}
              focused={newFocused}
              onFocus={() => setNewFocused(true)}
              onBlur={() => setNewFocused(false)}
              secure={!showNew}
              onToggleSecure={() => setShowNew(!showNew)}
              showSecure={showNew}
            />
            <PasswordField
              label="Xác nhận mật khẩu"
              icon="lock-closed-outline"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              focused={confirmFocused}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              secure={!showConfirm}
              onToggleSecure={() => setShowConfirm(!showConfirm)}
              showSecure={showConfirm}
              isLast
            />
          </View>

          <View className="h-2" />

          <ProfilePrimaryButton
            label="Cập nhật mật khẩu"
            icon="shield-checkmark"
            onPress={handleChangePassword}
            loading={loading}
            disabled={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordField({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  focused,
  onFocus,
  onBlur,
  secure,
  onToggleSecure,
  showSecure,
  isLast,
}: {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  secure: boolean;
  onToggleSecure: () => void;
  showSecure: boolean;
  isLast?: boolean;
}) {
  return (
    <View className={isLast ? 'mb-0' : 'mb-7'}>
      <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</Text>
      <View
        className="flex-row items-center gap-3 pb-2.5"
        style={{ borderBottomWidth: 1.5, borderBottomColor: focused ? ACCENT : '#E5E7EB' }}
      >
        <Ionicons name={icon} size={20} color={focused ? ACCENT : '#B0B0B0'} />
        <TextInput
          className="flex-1 p-0 text-base text-gray-900"
          placeholder={placeholder}
          placeholderTextColor="#B0B0B0"
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          secureTextEntry={secure}
        />
        <TouchableOpacity
          onPress={onToggleSecure}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name={showSecure ? 'eye-off-outline' : 'eye-outline'} size={22} color="#B0B0B0" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
