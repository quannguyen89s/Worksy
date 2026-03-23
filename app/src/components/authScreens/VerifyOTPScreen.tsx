import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Toast } from '@/components/ToastProvider';
import authService from '@/services/authService';

export default function VerifyOTPScreen({ navigation, route }: any) {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

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
      Toast.show({ type: 'error', title: 'Error', message: 'Please enter all 6 OTP digits.' }); return;
    }

    setLoading(true);
    try {
      await authService.verifyOTP(email, otpString);
      Toast.show({ type: 'success', title: 'Success', message: 'OTP verified successfully!' });
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
      inputRefs.current[0]?.focus();
      Toast.show({ type: 'success', title: 'Success', message: 'A new OTP has been sent!' });
    } catch {
      Toast.show({ type: 'error', title: 'Error', message: 'Failed to resend OTP.' });
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FFF8E7' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" contentContainerClassName="flex-grow justify-center px-8 py-16" keyboardShouldPersistTaps="handled">

          <View className="items-center mb-8">
            <Text className="text-9xl font-extrabold tracking-tight text-center mb-6" style={{ color: '#92400E' }}>
              Worksy
            </Text>
            <Text className="text-xl font-bold text-gray-500 mt-5">Verify OTP</Text>
          </View>

          <Text className="text-md text-gray-400 text-center mb-2">An OTP code has been sent to</Text>
          <Text className="text-md font-bold text-gray-800 text-center mb-8">{email}</Text>

          {/* OTP Inputs */}
          <View className="flex-row justify-between mb-10">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                className="text-center text-xl font-bold"
                style={{
                  width: 48, height: 56, borderRadius: 12,
                  backgroundColor: digit ? '#FEF3E2' : '#F9FAFB',
                  color: '#1F2937',
                  borderWidth: 1.5,
                  borderColor: digit ? '#92400E' : '#E5E7EB',
                }}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={6}
              />
            ))}
          </View>

          <TouchableOpacity onPress={handleVerify} activeOpacity={0.85} disabled={loading}>
            <LinearGradient
              colors={['#B45309', '#92400E', '#78350F']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              className="rounded-full py-4 items-center"
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text className="text-white text-base font-extrabold tracking-widest">VERIFY OTP</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-md text-gray-400">Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResend}>
              <Text className="text-md font-bold" style={{ color: '#92400E' }}>Resend</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="flex-row items-center justify-center mt-6 gap-2" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={16} color="#92400E" />
            <Text className="text-md font-semibold" style={{ color: '#92400E' }}>Go back</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
