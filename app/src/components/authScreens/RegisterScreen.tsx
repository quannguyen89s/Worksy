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
import authService from '@/services/authService';

const C = {
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

interface Props {
  navigation: any;
}

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
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.flex}>
        <ScrollView
          style={s.flex}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={s.logoSection}>
            <Text style={[s.logoText, { color: C.primary }]}>Worksy</Text>
            <Text style={[s.logoSub, { color: C.textLight }]}>Tạo tài khoản mới</Text>
          </View>

          {/* Form Card */}
          <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>

            {errorMsg ? (
              <View style={[s.msgBox, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[s.msgText, { color: C.error }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={[s.msgBox, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[s.msgText, { color: C.success }]}>{successMsg}</Text>
                <TouchableOpacity style={{ marginTop: 8 }} onPress={() => navigation.navigate('Login')}>
                  <Text style={[s.msgText, { color: C.primary, fontWeight: '600' }]}>← Về trang đăng nhập</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Text style={[s.label, { color: C.text }]}>Họ và tên</Text>
            <TextInput
              style={[s.input, { backgroundColor: C.primaryLight, color: C.text, borderColor: C.border }]}
              placeholder="Nhập họ và tên"
              placeholderTextColor={C.textLight}
              value={name}
              onChangeText={(t) => { setName(t); clear(); }}
            />

            <Text style={[s.label, { color: C.text }]}>Email</Text>
            <TextInput
              style={[s.input, { backgroundColor: C.primaryLight, color: C.text, borderColor: C.border }]}
              placeholder="Nhập email của bạn"
              placeholderTextColor={C.textLight}
              value={email}
              onChangeText={(t) => { setEmail(t); clear(); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[s.label, { color: C.text }]}>Mật khẩu</Text>
            <View style={s.pwWrap}>
              <TextInput
                style={[s.input, s.pwInput, { backgroundColor: C.primaryLight, color: C.text, borderColor: C.border }]}
                placeholder="Tối thiểu 6 ký tự, có chữ hoa và số"
                placeholderTextColor={C.textLight}
                value={password}
                onChangeText={(t) => { setPassword(t); clear(); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                <Text style={[s.eyeText, { color: C.primary }]}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={[s.label, { color: C.text }]}>Xác nhận mật khẩu</Text>
            <View style={[s.pwWrap, { marginBottom: 24 }]}>
              <TextInput
                style={[s.input, s.pwInput, { backgroundColor: C.primaryLight, color: C.text, borderColor: C.border }]}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor={C.textLight}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); clear(); }}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConfirmPassword((v) => !v)}>
                <Text style={[s.eyeText, { color: C.primary }]}>{showConfirmPassword ? 'Ẩn' : 'Hiện'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[s.btn, { backgroundColor: loading ? '#B45309' : C.primary }]}
              onPress={handleRegister}
              activeOpacity={0.8}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Đăng ký</Text>}
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={[s.footerText, { color: C.textLight }]}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[s.footerLink, { color: C.primary }]}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 36, fontWeight: '700' },
  logoSub: { fontSize: 16, marginTop: 8 },
  card: { borderRadius: 16, padding: 24, borderWidth: 1 },
  msgBox: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 },
  msgText: { fontSize: 14 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  pwWrap: { position: 'relative', marginBottom: 16 },
  pwInput: { paddingRight: 64, marginBottom: 0 },
  eyeBtn: { position: 'absolute', right: 12, top: 12 },
  eyeText: { fontSize: 14, fontWeight: '500' },
  btn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '600' },
});
