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
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@/navigation/types';
import AuthService from '@/services/authService';
import * as SecureStore from 'expo-secure-store';
import { decodeJwtRole, setAdminToken } from '@/api/adminApi';

type Props = StackScreenProps<RootStackParamList, 'Login'>;

const COLORS = {
  bg: '#FFF8E7',
  card: '#FFFFFF',
  primary: '#92400E',
  primaryLight: '#F5E6D3',
  text: '#3F3F46',
  textLight: '#71717A',
  textMuted: '#78716C',
  textSecondary: '#57534E',
  border: '#E4D5C3',
  borderLight: '#F1E7DA',
  error: '#DC2626',
  errorLight: '#FEE2E2',
};

export default function LoginScreen({ navigation }: Props) {
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
      const data = await AuthService.login(email.trim(), password);
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero / Logo */}
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <Text style={styles.logo}>Worksy</Text>
              <View style={styles.logoUnderline} />
            </View>
            <Text style={styles.subtitle}>Kết nối việc làm — Tạo giá trị</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Đăng nhập</Text>
            <Text style={styles.cardHint}>Chào mừng bạn trở lại</Text>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={(t) => { setEmail(t); setErrorMsg(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.inputPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={(t) => { setPassword(t); setErrorMsg(''); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.togglePass}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.togglePassText}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnPrimaryDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.btnGoogle} activeOpacity={0.85}>
              <Text style={styles.btnGoogleIcon}>G</Text>
              <Text style={styles.btnGoogleText}>Đăng nhập bằng Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  flex1: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32, paddingBottom: 48 },
  hero: { alignItems: 'center', marginBottom: 32 },
  logoWrap: { position: 'relative', marginBottom: 8 },
  logo: { fontSize: 42, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  logoUnderline: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 2,
    opacity: 0.8,
  },
  subtitle: { fontSize: 15, color: COLORS.textSecondary },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  cardHint: { fontSize: 14, color: COLORS.textMuted, marginBottom: 20 },
  errorBox: {
    backgroundColor: COLORS.errorLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorText: { fontSize: 14, color: COLORS.error, fontWeight: '500' },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: {
    backgroundColor: '#FAFAF9',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  passwordWrap: { position: 'relative', marginBottom: 12 },
  inputPassword: {
    backgroundColor: '#FAFAF9',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    paddingRight: 72,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  togglePass: { position: 'absolute', right: 16, top: 14 },
  togglePassText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryDisabled: { opacity: 0.85 },
  btnPrimaryText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: 16, fontSize: 13, color: COLORS.textMuted },
  btnGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: '#FAFAF9',
  },
  btnGoogleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 10,
  },
  btnGoogleText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  registerText: { fontSize: 15, color: COLORS.textMuted },
  registerLink: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
});
