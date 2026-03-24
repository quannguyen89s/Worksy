import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Toast } from '@/components/ToastProvider';
import { COLORS } from '@/theme/colors';
import authService from '@/services/authService';

const ACCENT = '#92400E';
const ACCENT_LIGHT = '#D97706';

export default function RegisterScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Toast.show({ type: 'error', title: 'Error', message: 'Please fill in all fields.' }); return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', title: 'Error', message: 'Passwords do not match.' }); return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', title: 'Error', message: 'Password must be at least 6 characters.' }); return;
    }
    if (!/[A-Z]/.test(password)) {
      Toast.show({ type: 'error', title: 'Error', message: 'Password must contain at least 1 uppercase letter.' }); return;
    }
    if (!/[0-9]/.test(password)) {
      Toast.show({ type: 'error', title: 'Error', message: 'Password must contain at least 1 number.' }); return;
    }

    setLoading(true);
    try {
      await authService.register(name.trim(), email.trim(), password, confirmPassword);
      Toast.show({ type: 'success', title: 'Success', message: 'Registration successful! Please check your email to verify.' });
      setTimeout(() => navigation.navigate('Login'), 2000);
    } catch (error: any) {
      Toast.show({ type: 'error', title: 'Registration Failed', message: error.response?.data?.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1C0A00' }}>
      <StatusBar barStyle="light-content" />

      {/* Hero header */}
      <LinearGradient
        colors={['#1C0A00', '#3B1505', '#78350F']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 16, paddingBottom: 44, paddingHorizontal: 28 }}
      >
        {/* Decorative blobs */}
        <View style={{
          position: 'absolute', bottom: -20, right: -20,
          width: 160, height: 160, borderRadius: 80,
          backgroundColor: 'rgba(180,83,9,0.2)',
        }} />

        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.12)',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Heading */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: '#D97706', alignItems: 'center', justifyContent: 'center',
            marginRight: 12,
          }}>
            <Ionicons name="briefcase" size={20} color="#fff" />
          </View>
          <Text style={{ fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>
            Worksy
          </Text>
        </View>

        <Text style={{ fontSize: 26, fontWeight: '700', color: '#fff', marginTop: 20, lineHeight: 34 }}>
          Create account ✨
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
          Join thousands finding their dream jobs
        </Text>
      </LinearGradient>

      {/* Form */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView
            style={{
              flex: 1, backgroundColor: '#fff',
              borderTopLeftRadius: 32, borderTopRightRadius: 32,
              marginTop: -24,
            }}
            contentContainerStyle={{ padding: 28, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Handle bar */}
            <View style={{
              width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB',
              alignSelf: 'center', marginBottom: 28,
            }} />

            {/* Step indicator */}
            <View style={{ flexDirection: 'row', marginBottom: 24, gap: 6 }}>
              {[1, 2, 3].map((s) => (
                <View key={s} style={{
                  flex: s === 1 ? 2 : 1, height: 4, borderRadius: 2,
                  backgroundColor: s === 1 ? ACCENT_LIGHT : '#F3F4F6',
                }} />
              ))}
            </View>

            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 }}>
              Personal details
            </Text>

            {/* Name */}
            <InputField
              label="Full Name"
              icon="person-outline"
              placeholder="John Smith"
              value={name}
              onChangeText={setName}
              focused={nameFocused}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              autoCapitalize="words"
            />

            {/* Email */}
            <InputField
              label="Email"
              icon="mail-outline"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              focused={emailFocused}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              keyboardType="email-address"
            />

            {/* Password */}
            <InputField
              label="Password"
              icon="lock-closed-outline"
              placeholder="Min 6 chars, 1 uppercase, 1 number"
              value={password}
              onChangeText={setPassword}
              focused={passwordFocused}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry={!showPassword}
              rightAction={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              }
            />

            {/* Confirm Password */}
            <InputField
              label="Confirm Password"
              icon="shield-checkmark-outline"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              focused={confirmFocused}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              secureTextEntry={!showConfirmPassword}
              rightAction={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              }
            />

            {/* Register Button */}
            <TouchableOpacity onPress={handleRegister} activeOpacity={0.85} disabled={loading}>
              <LinearGradient
                colors={['#D97706', '#B45309', '#92400E']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{
                  height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#B45309', shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
                  marginBottom: 28,
                }}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }}>
                    Create Account
                  </Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Terms */}
            <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 20, lineHeight: 18 }}>
              By creating an account, you agree to our{' '}
              <Text style={{ color: ACCENT, fontWeight: '600' }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: ACCENT, fontWeight: '600' }}>Privacy Policy</Text>
            </Text>

            {/* Sign in link */}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
                Already have an account?{' '}
                <Text
                  style={{ color: ACCENT, fontWeight: '700' }}
                  onPress={() => navigation.navigate('Login')}
                >
                  Sign In
                </Text>
              </Text>
            </View>

          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

function InputField({
  label, icon, placeholder, value, onChangeText,
  focused, onFocus, onBlur, secureTextEntry, rightAction, keyboardType, autoCapitalize,
}: {
  label: string; icon: any; placeholder: string;
  value: string; onChangeText: (t: string) => void;
  focused: boolean; onFocus: () => void; onBlur: () => void;
  secureTextEntry?: boolean; rightAction?: React.ReactNode;
  keyboardType?: any; autoCapitalize?: any;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        height: 56, borderRadius: 16, paddingHorizontal: 14,
        backgroundColor: focused ? '#FFFBEB' : '#F9FAFB',
        borderWidth: 1.5,
        borderColor: focused ? '#D97706' : '#F3F4F6',
      }}>
        <View style={{
          width: 32, height: 32, borderRadius: 10,
          backgroundColor: focused ? '#FEF3C7' : '#F3F4F6',
          alignItems: 'center', justifyContent: 'center', marginRight: 12,
        }}>
          <Ionicons name={icon} size={16} color={focused ? '#92400E' : '#9CA3AF'} />
        </View>
        <TextInput
          style={{ flex: 1, fontSize: 15, color: '#111827', padding: 0 }}
          placeholder={placeholder}
          placeholderTextColor="#C0C0C0"
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
        />
        {rightAction}
      </View>
    </View>
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
