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
import { reconnectSocket } from '@/services/socket';

const C = {
  bg: '#FFF8E7',
  card: '#FFFFFF',
  primary: '#92400E',
  primaryLight: '#F5E6D3',
  text: '#3F3F46',
  textLight: '#71717A',
  border: '#E4D5C3',
  error: '#DC2626',
};

interface Props {
  navigation: any;
  onLoginSuccess?: () => void;
}

export default function LoginScreen({ navigation, onLoginSuccess }: Props) {
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
      await authService.login(email.trim(), password);
      await reconnectSocket();
      onLoginSuccess?.();
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message ?? 'Đăng nhập thất bại. Vui lòng thử lại.');
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
            <Text style={[s.logoSub, { color: C.textLight }]}>Đăng nhập để tiếp tục</Text>
          </View>

          {/* Form Card */}
          <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>

            {errorMsg ? (
              <View style={[s.msgBox, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[s.msgText, { color: C.error }]}>{errorMsg}</Text>
              </View>
            ) : null}

            <Text style={[s.label, { color: C.text }]}>Email</Text>
            <TextInput
              style={[s.input, { backgroundColor: C.primaryLight, color: C.text, borderColor: C.border }]}
              placeholder="Nhập email của bạn"
              placeholderTextColor={C.textLight}
              value={email}
              onChangeText={(t) => { setEmail(t); setErrorMsg(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[s.label, { color: C.text, marginTop: 16 }]}>Mật khẩu</Text>
            <View style={s.pwWrap}>
              <TextInput
                style={[s.input, s.pwInput, { backgroundColor: C.primaryLight, color: C.text, borderColor: C.border }]}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={C.textLight}
                value={password}
                onChangeText={(t) => { setPassword(t); setErrorMsg(''); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                <Text style={[s.eyeText, { color: C.primary }]}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.forgotBtn}>
              <Text style={[s.forgotText, { color: C.primary }]}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.btn, { backgroundColor: loading ? '#B45309' : C.primary }]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Đăng nhập</Text>}
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={[s.divLine, { backgroundColor: C.border }]} />
              <Text style={[s.divText, { color: C.textLight }]}>hoặc</Text>
              <View style={[s.divLine, { backgroundColor: C.border }]} />
            </View>

            <TouchableOpacity
              style={[s.googleBtn, { backgroundColor: C.primaryLight, borderColor: C.border }]}
              activeOpacity={0.8}>
              <Text style={s.googleG}>G</Text>
              <Text style={[s.googleText, { color: C.text }]}>Đăng nhập bằng Google</Text>
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={[s.footerText, { color: C.textLight }]}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[s.footerLink, { color: C.primary }]}>Đăng ký ngay</Text>
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
    marginBottom: 4,
    borderWidth: 1,
  },
  pwWrap: { position: 'relative', marginBottom: 8 },
  pwInput: { paddingRight: 64 },
  eyeBtn: { position: 'absolute', right: 12, top: 12 },
  eyeText: { fontSize: 14, fontWeight: '500' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { fontSize: 14, fontWeight: '500' },
  btn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divLine: { flex: 1, height: 1 },
  divText: { marginHorizontal: 12, fontSize: 14 },
  googleBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
  },
  googleG: { fontSize: 18, marginRight: 8 },
  googleText: { fontSize: 16, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '600' },
});
