import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Animated, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Toast } from '@/components/ToastProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '@/services/authService';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const API_BASE = 'http://172.16.0.167:3000';
const ACCENT = '#92400E';
const ACCENT_LIGHT = '#D97706';

const REMEMBER_EMAIL_KEY = 'worksy_remember_email';
const REMEMBER_PASSWORD_KEY = 'worksy_remember_password';
const REMEMBER_FLAG_KEY = 'worksy_remember_flag';

export default function LoginScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    const loadSaved = async () => {
      try {
        const flag = await AsyncStorage.getItem(REMEMBER_FLAG_KEY);
        if (flag === 'true') {
          const savedEmail = await AsyncStorage.getItem(REMEMBER_EMAIL_KEY);
          const savedPassword = await AsyncStorage.getItem(REMEMBER_PASSWORD_KEY);
          if (savedEmail) setEmail(savedEmail);
          if (savedPassword) setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch { }
    };
    loadSaved();
  }, []);

  const saveCredentials = async (emailVal: string, passwordVal: string, remember: boolean) => {
    try {
      if (remember) {
        await AsyncStorage.setItem(REMEMBER_FLAG_KEY, 'true');
        await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, emailVal);
        await AsyncStorage.setItem(REMEMBER_PASSWORD_KEY, passwordVal);
      } else {
        await AsyncStorage.multiRemove([REMEMBER_FLAG_KEY, REMEMBER_EMAIL_KEY, REMEMBER_PASSWORD_KEY]);
      }
    } catch { }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const returnUrl = Linking.createURL('auth');
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_BASE}/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`,
        returnUrl
      );
      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url);
        const accessToken = parsed.queryParams?.accessToken as string;
        const refreshToken = parsed.queryParams?.refreshToken as string;
        if (accessToken && refreshToken) {
          await SecureStore.setItemAsync('accessToken', accessToken);
          await SecureStore.setItemAsync('refreshToken', refreshToken);
          Toast.show({ type: 'success', title: 'Success', message: 'Google login successful!' });
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        } else {
          Toast.show({ type: 'error', title: 'Error', message: 'Google login failed.' });
        }
      }
    } catch {
      Toast.show({ type: 'error', title: 'Error', message: 'Google login failed.' });
    } finally { setGoogleLoading(false); }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Toast.show({ type: 'error', title: 'Error', message: 'Please enter your email and password.' });
      return;
    }
    setLoading(true);
    try {
      const result = await authService.login(email.trim(), password);
      await SecureStore.setItemAsync('accessToken', result.accessToken);
      await SecureStore.setItemAsync('refreshToken', result.refreshToken);
      await saveCredentials(email.trim(), password, rememberMe);
      Toast.show({ type: 'success', title: 'Success', message: 'Login successful!' });
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (error: any) {
      Toast.show({ type: 'error', title: 'Login Failed', message: error.response?.data?.message || 'Invalid email or password.' });
    } finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1C0A00' }}>
      <StatusBar barStyle="light-content" />

      {/* Top hero section */}
      <LinearGradient
        colors={['#1C0A00', '#3B1505', '#78350F']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 20, paddingBottom: 48, paddingHorizontal: 28 }}
      >
        {/* Decorative elements */}
        <View style={{
          position: 'absolute', top: insets.top, right: 0,
          width: 200, height: 200, borderRadius: 100,
          backgroundColor: 'rgba(180,83,9,0.25)',
        }} />
        <View style={{
          position: 'absolute', top: insets.top + 60, right: 40,
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: 'rgba(217,119,6,0.15)',
        }} />

        {/* Logo + tagline */}
        <View style={{ marginTop: 20 }}>
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
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
            Your career starts here
          </Text>
        </View>

        <View style={{ marginTop: 32 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff', lineHeight: 36 }}>
            Welcome back 👋
          </Text>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
            Sign in to continue your journey
          </Text>
        </View>
      </LinearGradient>

      {/* White card form - rounded top */}
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

            {/* Email input */}
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
              autoCapitalize="none"
            />

            {/* Password input */}
            <InputField
              label="Password"
              icon="lock-closed-outline"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              focused={passwordFocused}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry={!showPassword}
              rightAction={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              }
            />

            {/* Remember me + Forgot */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 20, height: 20, borderRadius: 6,
                  backgroundColor: rememberMe ? ACCENT : 'transparent',
                  borderWidth: rememberMe ? 0 : 1.5, borderColor: '#D1D5DB',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {rememberMe && <Ionicons name="checkmark" size={13} color="#fff" />}
                </View>
                <Text style={{ fontSize: 13, color: '#6B7280' }}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT_LIGHT }}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity onPress={handleLogin} activeOpacity={0.85} disabled={loading}>
              <LinearGradient
                colors={['#D97706', '#B45309', '#92400E']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{
                  height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#B45309', shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
                  marginBottom: 16,
                }}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 1 }}>
                    Sign In
                  </Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#F3F4F6' }} />
              <Text style={{ marginHorizontal: 14, fontSize: 12, color: '#9CA3AF', fontWeight: '500' }}>
                OR CONTINUE WITH
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#F3F4F6' }} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                height: 58, borderRadius: 18, backgroundColor: '#fff',
                borderWidth: 1.5, borderColor: '#E5E7EB',
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
                marginBottom: 32,
              }}
            >
              {googleLoading
                ? <ActivityIndicator color="#4285F4" size="small" />
                : (
                  <>
                    <MaterialCommunityIcons name="google" size={22} color="#4285F4" />
                    <Text style={{ marginLeft: 10, fontSize: 15, fontWeight: '600', color: '#111827' }}>
                      Continue with Google
                    </Text>
                  </>
                )
              }
            </TouchableOpacity>

            {/* Footer */}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
                Don't have an account?{' '}
                <Text
                  style={{ color: ACCENT, fontWeight: '700' }}
                  onPress={() => navigation.navigate('Register')}
                >
                  Sign Up
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
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        height: 58, borderRadius: 16, paddingHorizontal: 16,
        backgroundColor: focused ? '#FFFBEB' : '#F9FAFB',
        borderWidth: 1.5,
        borderColor: focused ? '#D97706' : '#F3F4F6',
      }}>
        <View style={{
          width: 34, height: 34, borderRadius: 10,
          backgroundColor: focused ? '#FEF3C7' : '#F3F4F6',
          alignItems: 'center', justifyContent: 'center', marginRight: 12,
        }}>
          <Ionicons name={icon} size={17} color={focused ? '#92400E' : '#9CA3AF'} />
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
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
        />
        {rightAction}
      </View>
    </View>
  );
}
