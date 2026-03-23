import { useState } from 'react';
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
import authService from '@/services/authService';

const COLORS = {
  bg: '#FFF8E7',
  card: '#FFFFFF',
  primary: '#92400E',
  primaryLight: '#F5E6D3',
  text: '#3F3F46',
  textLight: '#71717A',
  border: '#E4D5C3',
  error: '#DC2626',
  success: '#16A34A',
};

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearError = () => setErrorMsg('');

  const handleRegister = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMsg('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setErrorMsg('Mật khẩu phải có ít nhất 1 chữ hoa');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setErrorMsg('Mật khẩu phải có ít nhất 1 số');
      return;
    }

    setLoading(true);
    try {
      await authService.register(name.trim(), email.trim(), password, confirmPassword);
      setSuccessMsg('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View className="items-center mb-10">
            <Text className="text-4xl font-bold" style={{ color: COLORS.primary }}>
              Worksy
            </Text>
            <Text className="text-base mt-2" style={{ color: COLORS.textLight }}>
              Tạo tài khoản mới
            </Text>
          </View>

          {/* Form Card */}
          <View
            className="rounded-2xl p-6"
            style={{ backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border }}
          >
            {/* Error message */}
            {errorMsg ? (
              <View className="rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: '#FEE2E2' }}>
                <Text className="text-sm" style={{ color: COLORS.error }}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Success message */}
            {successMsg ? (
              <View className="rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: '#DCFCE7' }}>
                <Text className="text-sm" style={{ color: COLORS.success }}>{successMsg}</Text>
                <TouchableOpacity className="mt-2" onPress={() => navigation.navigate('Login')}>
                  <Text className="text-sm font-semibold" style={{ color: COLORS.primary }}>
                    ← Về trang đăng nhập
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Name */}
            <Text className="text-sm font-medium mb-2" style={{ color: COLORS.text }}>
              Họ và tên
            </Text>
            <TextInput
              className="rounded-xl px-4 py-3 text-base mb-4"
              style={{
                backgroundColor: COLORS.primaryLight,
                color: COLORS.text,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
              placeholder="Nhập họ và tên"
              placeholderTextColor={COLORS.textLight}
              value={name}
              onChangeText={(text) => { setName(text); clearError(); }}
            />

            {/* Email */}
            <Text className="text-sm font-medium mb-2" style={{ color: COLORS.text }}>
              Email
            </Text>
            <TextInput
              className="rounded-xl px-4 py-3 text-base mb-4"
              style={{
                backgroundColor: COLORS.primaryLight,
                color: COLORS.text,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
              placeholder="Nhập email của bạn"
              placeholderTextColor={COLORS.textLight}
              value={email}
              onChangeText={(text) => { setEmail(text); clearError(); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
            <Text className="text-sm font-medium mb-2" style={{ color: COLORS.text }}>
              Mật khẩu
            </Text>
            <View className="relative mb-4">
              <TextInput
                className="rounded-xl px-4 py-3 text-base pr-16"
                style={{
                  backgroundColor: COLORS.primaryLight,
                  color: COLORS.text,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
                placeholder="Tối thiểu 6 ký tự, có chữ hoa và số"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={(text) => { setPassword(text); clearError(); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                className="absolute right-3 top-3"
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text className="text-sm font-medium" style={{ color: COLORS.primary }}>
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <Text className="text-sm font-medium mb-2" style={{ color: COLORS.text }}>
              Xác nhận mật khẩu
            </Text>
            <View className="relative mb-6">
              <TextInput
                className="rounded-xl px-4 py-3 text-base pr-16"
                style={{
                  backgroundColor: COLORS.primaryLight,
                  color: COLORS.text,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor={COLORS.textLight}
                value={confirmPassword}
                onChangeText={(text) => { setConfirmPassword(text); clearError(); }}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                className="absolute right-3 top-3"
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text className="text-sm font-medium" style={{ color: COLORS.primary }}>
                  {showConfirmPassword ? 'Ẩn' : 'Hiện'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              className="rounded-xl py-4 items-center"
              style={{ backgroundColor: loading ? '#B45309' : COLORS.primary }}
              onPress={handleRegister}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-semibold">Đăng ký</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-sm" style={{ color: COLORS.textLight }}>
              Đã có tài khoản?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-sm font-semibold" style={{ color: COLORS.primary }}>
                Đăng nhập
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
