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

const ACCENT = '#92400E';

export default function VerifyOTPScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // Individual box shake animations
  const shakeAnims = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    // Auto focus first input
    setTimeout(() => inputRefs.current[0]?.focus(), 700);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      const digits = value.replace(/[^0-9]/g, '').split('').slice(0, 6);
      const newOtp = [...otp];
      digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value.replace(/[^0-9]/g, '');
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Toast.show({ type: 'error', title: 'Error', message: 'Please enter all 6 digits.' }); return;
    }
    setLoading(true);
    try {
      await authService.verifyOTP(email, otpString);
      Toast.show({ type: 'success', title: 'Verified!', message: 'OTP verified successfully.' });
      navigation.navigate('ResetPassword', { email, otp: otpString });
    } catch (error: any) {
      Toast.show({ type: 'error', title: 'Error', message: error.response?.data?.message || 'OTP verification failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.forgotPassword(email);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      Toast.show({ type: 'success', title: 'Sent!', message: 'A new OTP has been sent to your email.' });
    } catch {
      Toast.show({ type: 'error', title: 'Error', message: 'Failed to resend OTP.' });
    }
  };

  const filledCount = otp.filter(d => d !== '').length;

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
          position: 'absolute', top: insets.top + 20, right: -20,
          width: 160, height: 160, borderRadius: 80,
          backgroundColor: 'rgba(180,83,9,0.2)',
        }} />

        {/* Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.12)',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Icon */}
        <View style={{
          width: 64, height: 64, borderRadius: 20,
          backgroundColor: 'rgba(217,119,6,0.25)',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
          borderWidth: 1, borderColor: 'rgba(217,119,6,0.4)',
        }}>
          <Ionicons name="shield-checkmark-outline" size={32} color="#F59E0B" />
        </View>

        <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8 }}>
          Enter OTP Code
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 22 }}>
          We've sent a 6-digit code to
        </Text>
        <Text style={{ fontSize: 14, color: '#F59E0B', fontWeight: '600', marginTop: 2 }}>
          {email}
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
              alignSelf: 'center', marginBottom: 36,
            }} />

            {/* Progress indicator */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
              {otp.map((d, i) => (
                <View
                  key={i}
                  style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: d ? '#D97706' : '#F3F4F6',
                  }}
                />
              ))}
            </View>

            {/* OTP inputs */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={{
                    width: 50, height: 62, borderRadius: 16,
                    textAlign: 'center', fontSize: 24, fontWeight: '700',
                    backgroundColor: digit ? '#FFFBEB' : '#F9FAFB',
                    color: '#1F2937',
                    borderWidth: 2,
                    borderColor: digit ? '#D97706' : '#F3F4F6',
                  }}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              ))}
            </View>

            {/* Progress text */}
            <Text style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', marginBottom: 32 }}>
              {filledCount}/6 digits entered
            </Text>

            {/* Verify Button */}
            <TouchableOpacity onPress={handleVerify} activeOpacity={0.85} disabled={loading}>
              <LinearGradient
                colors={filledCount === 6 ? ['#D97706', '#B45309', '#92400E'] : ['#D1D5DB', '#D1D5DB', '#D1D5DB']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{
                  height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                  shadowColor: filledCount === 6 ? '#B45309' : 'transparent',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4, shadowRadius: 12, elevation: filledCount === 6 ? 8 : 0,
                  marginBottom: 24,
                }}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                        Verify Code
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </View>
                  )
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Resend */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 8 }}>
                Didn't receive the code?
              </Text>
              <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: ACCENT }}>
                  Resend Code
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
