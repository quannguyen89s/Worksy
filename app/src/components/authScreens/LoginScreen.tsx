import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Toast } from '@/components/ToastProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '@/services/authService';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const API_BASE = 'http://172.16.0.167:3000';

const REMEMBER_EMAIL_KEY = 'worksy_remember_email';
const REMEMBER_PASSWORD_KEY = 'worksy_remember_password';
const REMEMBER_FLAG_KEY = 'worksy_remember_flag';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FFF8E7' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" contentContainerClassName="flex-grow justify-center px-8 py-16" keyboardShouldPersistTaps="handled">

          <View className="items-center mb-8">
            <Text className="text-9xl font-extrabold tracking-tight text-center mb-6" style={{ color: '#92400E' }}>
              Worksy
            </Text>
            <Text className="text-xl font-bold text-gray-500 mt-5">Sign in to continue</Text>
          </View>

          {/* Email */}
          <View className="mb-10">
            <Text className="text-md font-semibold text-gray-500 mb-2 uppercase tracking-wider">Email</Text>
            <View
              className="flex-row items-center gap-3 pb-2.5"
              style={{ borderBottomWidth: 1.5, borderBottomColor: emailFocused ? '#92400E' : '#E5E7EB' }}
            >
              <Ionicons name="mail-outline" size={20} color={emailFocused ? '#92400E' : '#B0B0B0'} />
              <TextInput
                className="flex-1 text-xl text-gray-800 p-0"
                placeholder="Enter your email"
                placeholderTextColor="#B0B0B0"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
          <View className="mb-6">
            <Text className="text-md font-semibold text-gray-500 mb-2 uppercase tracking-wider">Password</Text>
            <View
              className="flex-row items-center gap-3 pb-2.5"
              style={{ borderBottomWidth: 1.5, borderBottomColor: passwordFocused ? '#92400E' : '#E5E7EB' }}
            >
              <Ionicons name="lock-closed-outline" size={20} color={passwordFocused ? '#92400E' : '#B0B0B0'} />
              <TextInput
                className="flex-1 text-xl text-gray-800 p-0"
                placeholder="Enter your password"
                placeholderTextColor="#B0B0B0"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#B0B0B0" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-8">
            <TouchableOpacity
              className="flex-row items-center gap-2"
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View
                className="w-5 h-5 rounded items-center justify-center"
                style={{
                  backgroundColor: rememberMe ? '#92400E' : 'transparent',
                  borderWidth: rememberMe ? 0 : 1.5,
                  borderColor: '#D1D5DB',
                }}
              >
                {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text className="text-md text-gray-500">Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text className="text-md font-semibold" style={{ color: '#92400E' }}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleLogin} activeOpacity={0.85} disabled={loading}>
            <LinearGradient
              colors={['#B45309', '#92400E', '#78350F']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              className="rounded-full py-4 items-center"
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text className="text-white text-base font-extrabold tracking-widest">SIGN IN</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-3 my-5 text-md text-gray-400">Or sign in with</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          <View className="flex-row justify-center mb-6">
            <TouchableOpacity
              className="w-12 h-12 rounded-full bg-white items-center justify-center border border-gray-200 shadow-sm"
              onPress={handleGoogleLogin}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color="#EA4335" size="small" />
              ) : (
                <MaterialCommunityIcons name="google" size={24} color="#EA4335" />
              )}
            </TouchableOpacity>
          </View>

          <View className="items-center">
            <Text className="text-md text-gray-400 mb-2">Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text className="text-md mt-3 font-extrabold tracking-wide" style={{ color: '#92400E' }}>SIGN UP</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
