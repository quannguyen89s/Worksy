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
import * as SecureStore from 'expo-secure-store';
import { decodeJwtRole, setAdminToken } from '@/api/adminApi';

const COLORS = {
  bg: '#FFF8E7',
  card: '#FFFFFF',
  primary: '#92400E',
  primaryLight: '#F5E6D3',
  text: '#3F3F46',
  textLight: '#71717A',
  border: '#E4D5C3',
  error: '#DC2626',
};

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login(email.trim(), password);
      const accessToken = data?.result?.accessToken ?? data?.accessToken;
      const refreshToken = data?.result?.refreshToken ?? data?.refreshToken;
      if (!accessToken) {
        setErrorMsg(data?.result?.message ?? data?.message ?? 'Đăng nhập thất bại. Vui lòng thử lại.');
        return;
      }

      // Lưu token cho flow user hiện tại
      await SecureStore.setItemAsync('accessToken', accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync('refreshToken', refreshToken);
      } else {
        await SecureStore.deleteItemAsync('refreshToken');
      }

      // Nếu là admin thì vào dashboard admin ngay
      const role = decodeJwtRole(accessToken);
      if (role === 'admin') {
        await setAdminToken(accessToken);
        navigation.reset({ index: 0, routes: [{ name: 'AdminDashboard' }] });
      } else {
        await setAdminToken(null);
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
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
              Đăng nhập để tiếp tục
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
              onChangeText={(text) => { setEmail(text); setErrorMsg(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
            <Text className="text-sm font-medium mb-2" style={{ color: COLORS.text }}>
              Mật khẩu
            </Text>
            <View className="relative mb-2">
              <TextInput
                className="rounded-xl px-4 py-3 text-base pr-16"
                style={{
                  backgroundColor: COLORS.primaryLight,
                  color: COLORS.text,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={(text) => { setPassword(text); setErrorMsg(''); }}
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

            {/* Forgot Password */}
            <TouchableOpacity className="self-end mb-6">
              <Text className="text-sm font-medium" style={{ color: COLORS.primary }}>
                Quên mật khẩu?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              className="rounded-xl py-4 items-center"
              style={{ backgroundColor: loading ? '#B45309' : COLORS.primary }}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-semibold">Đăng nhập</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-5">
              <View className="flex-1 h-px" style={{ backgroundColor: COLORS.border }} />
              <Text className="mx-3 text-sm" style={{ color: COLORS.textLight }}>hoặc</Text>
              <View className="flex-1 h-px" style={{ backgroundColor: COLORS.border }} />
            </View>

            {/* Google Login */}
            <TouchableOpacity
              className="rounded-xl py-4 items-center flex-row justify-center"
              style={{ backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.border }}
              activeOpacity={0.8}
            >
              <Text className="text-lg mr-2">G</Text>
              <Text className="text-base font-medium" style={{ color: COLORS.text }}>
                Đăng nhập bằng Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-sm" style={{ color: COLORS.textLight }}>
              Chưa có tài khoản?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text className="text-sm font-semibold" style={{ color: COLORS.primary }}>
                Đăng ký ngay
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
