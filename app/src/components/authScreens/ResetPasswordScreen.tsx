import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Animated, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Toast } from '@/components/ToastProvider';
import authService from '@/services/authService';

export default function ResetPasswordScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { email, otp } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [success, setSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  // Password strength
  const getStrength = () => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();
  const strengthLabel = ['', 'Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['#F3F4F6', '#EF4444', '#F97316', '#F59E0B', '#22C55E', '#16A34A'][strength];

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      Toast.show({ type: 'error', title: 'Error', message: 'Please fill in all fields.' }); return;
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
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', title: 'Error', message: 'Passwords do not match.' }); return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email, otp, password, confirmPassword);
      setSuccess(true);
      Animated.spring(successScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
      setTimeout(() => { navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); }, 2500);
    } catch (error: any) {
      Toast.show({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to change password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1C0A00' }}>
      <StatusBar barStyle="light-content" />

      {/* Hero */}
      <LinearGradient
        colors={['#1C0A00', '#3B1505', '#78350F']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 16, paddingBottom: 56, paddingHorizontal: 28 }}
      >
        <View style={{
          position: 'absolute', top: insets.top, right: -30,
          width: 180, height: 180, borderRadius: 90,
          backgroundColor: 'rgba(180,83,9,0.2)',
        }} />

        {/* Icon */}
        <View style={{
          width: 64, height: 64, borderRadius: 20,
          backgroundColor: success ? 'rgba(22,163,74,0.25)' : 'rgba(217,119,6,0.25)',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, marginTop: insets.top > 0 ? 0 : 16,
          borderWidth: 1,
          borderColor: success ? 'rgba(22,163,74,0.4)' : 'rgba(217,119,6,0.4)',
        }}>
          <Ionicons
            name={success ? 'checkmark-circle-outline' : 'lock-open-outline'}
            size={32}
            color={success ? '#4ADE80' : '#F59E0B'}
          />
        </View>

        <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8 }}>
          {success ? 'Password Reset! 🎉' : 'Set New Password'}
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 22 }}>
          {success
            ? 'Your password has been changed successfully. Redirecting you to login...'
            : 'Create a strong password to keep\nyour account secure.'}
        </Text>
      </LinearGradient>

      {/* Form card */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView
            style={{
              flex: 1, backgroundColor: '#fff',
              borderTopLeftRadius: 32, borderTopRightRadius: 32,
              marginTop: -28,
            }}
            contentContainerStyle={{ padding: 28, paddingBottom: 48 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Handle bar */}
            <View style={{
              width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB',
              alignSelf: 'center', marginBottom: 32,
            }} />

            {/* Success state */}
            {success ? (
              <Animated.View style={{
                alignItems: 'center', paddingVertical: 32,
                transform: [{ scale: successScale }],
              }}>
                <View style={{
                  width: 100, height: 100, borderRadius: 50,
                  backgroundColor: '#F0FDF4',
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <Ionicons name="checkmark-circle" size={60} color="#16A34A" />
                </View>
                <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
                  All Done!
                </Text>
                <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>
                  Redirecting you to Sign In...
                </Text>
                <ActivityIndicator color="#92400E" style={{ marginTop: 24 }} />
              </Animated.View>
            ) : (
              <>
                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 22 }}>
                  For <Text style={{ fontWeight: '600', color: '#111827' }}>{email}</Text>
                </Text>

                {/* New Password */}
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  New Password
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  height: 58, borderRadius: 16, paddingHorizontal: 16,
                  backgroundColor: passwordFocused ? '#FFFBEB' : '#F9FAFB',
                  borderWidth: 1.5,
                  borderColor: passwordFocused ? '#D97706' : '#F3F4F6',
                  marginBottom: 10,
                }}>
                  <View style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: passwordFocused ? '#FEF3C7' : '#F3F4F6',
                    alignItems: 'center', justifyContent: 'center', marginRight: 12,
                  }}>
                    <Ionicons name="lock-closed-outline" size={17} color={passwordFocused ? '#92400E' : '#9CA3AF'} />
                  </View>
                  <TextInput
                    style={{ flex: 1, fontSize: 15, color: '#111827', padding: 0 }}
                    placeholder="Enter new password"
                    placeholderTextColor="#C0C0C0"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Strength meter */}
                {password.length > 0 && (
                  <View style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <View key={i} style={{
                          flex: 1, height: 4, borderRadius: 2,
                          backgroundColor: i <= strength ? strengthColor : '#F3F4F6',
                        }} />
                      ))}
                    </View>
                    <Text style={{ fontSize: 12, color: strengthColor, fontWeight: '600' }}>
                      {strengthLabel}
                    </Text>
                  </View>
                )}

                {/* Confirm Password */}
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Confirm Password
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  height: 58, borderRadius: 16, paddingHorizontal: 16,
                  backgroundColor: confirmFocused ? '#FFFBEB' : '#F9FAFB',
                  borderWidth: 1.5,
                  borderColor: confirmFocused
                    ? (confirmPassword && confirmPassword !== password ? '#EF4444' : '#D97706')
                    : (confirmPassword && confirmPassword !== password ? '#FCA5A5' : '#F3F4F6'),
                  marginBottom: 8,
                }}>
                  <View style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: confirmFocused ? '#FEF3C7' : '#F3F4F6',
                    alignItems: 'center', justifyContent: 'center', marginRight: 12,
                  }}>
                    <Ionicons name="shield-checkmark-outline" size={17} color={confirmFocused ? '#92400E' : '#9CA3AF'} />
                  </View>
                  <TextInput
                    style={{ flex: 1, fontSize: 15, color: '#111827', padding: 0 }}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#C0C0C0"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Match indicator */}
                {confirmPassword.length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 28 }}>
                    <Ionicons
                      name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={password === confirmPassword ? '#16A34A' : '#EF4444'}
                    />
                    <Text style={{ fontSize: 12, color: password === confirmPassword ? '#16A34A' : '#EF4444', fontWeight: '500' }}>
                      {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </Text>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity onPress={handleReset} activeOpacity={0.85} disabled={loading} style={{ marginTop: confirmPassword.length > 0 ? 0 : 28 }}>
                  <LinearGradient
                    colors={['#D97706', '#B45309', '#92400E']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{
                      height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                      shadowColor: '#B45309', shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
                    }}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
                          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                            Reset Password
                          </Text>
                        </View>
                      )
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
