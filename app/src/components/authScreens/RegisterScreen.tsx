import React, { useState } from 'react';
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
import authService from '@/services/authService';
import { COLORS } from '@/theme/colors';
import type { RootStackParamList } from '@/navigation/types';

type Props = StackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clear = () => setErrorMsg('');

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
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message ?? 'Đăng ký thất bại. Vui lòng thử lại.');
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
          <View style={styles.hero}>
            <Text style={styles.logo}>Worksy</Text>
            <Text style={styles.subtitle}>Tạo tài khoản mới</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Đăng ký</Text>
            <Text style={styles.cardHint}>Điền thông tin để bắt đầu</Text>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{successMsg}</Text>
                <TouchableOpacity style={styles.successLink} onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.successLinkText}>← Về trang đăng nhập</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              placeholder="Nguyễn Văn A"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={(t) => { setName(t); clearError(); }}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={(t) => { setEmail(t); clearError(); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Mật khẩu</Text>
            <Text style={styles.hint}>Tối thiểu 6 ký tự, có chữ hoa và số</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.inputPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={(t) => { setPassword(t); clearError(); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.togglePass} onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.togglePassText}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Xác nhận mật khẩu</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.inputPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); clearError(); }}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity style={styles.togglePass} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Text style={styles.togglePassText}>{showConfirmPassword ? 'Ẩn' : 'Hiện'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnPrimaryDisabled]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>Đăng ký</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 48 },
  hero: { alignItems: 'center', marginBottom: 28 },
  logo: { fontSize: 38, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 6 },
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
  successBox: {
    backgroundColor: COLORS.successLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  successText: { fontSize: 14, color: COLORS.success, fontWeight: '500' },
  successLink: { marginTop: 8 },
  successLinkText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  hint: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
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
  passwordWrap: { position: 'relative', marginBottom: 16 },
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
  btnPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryDisabled: { opacity: 0.85 },
  btnPrimaryText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { fontSize: 15, color: COLORS.textMuted },
  loginLink: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
});
