import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../services/auth.service';
import { reconnectSocket } from '../services/socket';

interface Props {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(trimmedEmail, password);
      await reconnectSocket();
      onLoginSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Sai email hoặc mật khẩu';
      setError(msg);
      Alert.alert('Đăng nhập thất bại', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={s.top}>
          <View style={s.logoWrap}>
            <Ionicons name="briefcase" size={36} color="#6C63FF" />
          </View>
          <Text style={s.appName}>Worksy</Text>
          <Text style={s.tagline}>Smart Job Matching</Text>
        </View>

        <View style={s.card}>
          <Text style={s.title}>Đăng nhập</Text>

          <View style={s.fieldLabel}>
            <Text style={s.label}>Email</Text>
          </View>
          <View style={s.inputWrap}>
            <Ionicons name="mail-outline" size={18} color="#666" style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor="#444"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View style={[s.fieldLabel, { marginTop: 16 }]}>
            <Text style={s.label}>Mật khẩu</Text>
          </View>
          <View style={s.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#666" style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="••••••••"
              placeholderTextColor="#444"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={s.eyeBtn}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          {/* Gợi ý tài khoản test */}
          <View style={s.hint}>
            <Text style={s.hintTitle}>Tài khoản test (sau khi seed):</Text>
            <TouchableOpacity
              onPress={() => { setEmail('customer@worksy.test'); setPassword('123456'); }}>
              <Text style={s.hintRow}>👤 customer@worksy.test · 123456</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setEmail('worker@worksy.test'); setPassword('123456'); }}>
              <Text style={s.hintRow}>🔧 worker@worksy.test · 123456</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  kav: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  top: { alignItems: 'center', marginBottom: 32 },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 13, color: '#666', marginTop: 4 },
  card: {
    backgroundColor: '#13132a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e1e35',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 20 },
  fieldLabel: { marginBottom: 6 },
  label: { fontSize: 13, color: '#9b9bc0', fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: '#e8e8f0', fontSize: 15 },
  eyeBtn: { padding: 4 },
  errorText: { color: '#E57373', fontSize: 13, marginTop: 10 },
  btn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint: {
    marginTop: 24,
    padding: 14,
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e1e35',
    gap: 6,
  },
  hintTitle: { color: '#555', fontSize: 12, marginBottom: 4 },
  hintRow: { color: '#6C63FF', fontSize: 13 },
});
