import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Toast } from '@/components/ToastProvider';
import authService from '@/services/authService';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      Toast.show({ type: 'error', title: 'Error', message: 'Please enter your email.' }); return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      Toast.show({ type: 'success', title: 'Success', message: 'OTP code has been sent to your email!' });
      setTimeout(() => { navigation.navigate('VerifyOTP', { email: email.trim() }); }, 1500);
    } catch (error: any) {
      Toast.show({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to send OTP. Please try again.' });
    } finally {
      setLoading(false);
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
            <Text className="text-xl font-bold text-gray-500 mt-5">Forgot Password</Text>
          </View>

          <Text className="text-md text-gray-400 text-center mb-8">
            Enter your registered email and we'll send you an OTP code to verify.
          </Text>

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

          <TouchableOpacity onPress={handleSendOTP} activeOpacity={0.85} disabled={loading}>
            <LinearGradient
              colors={['#B45309', '#92400E', '#78350F']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              className="rounded-full py-4 items-center"
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text className="text-white text-base font-extrabold tracking-widest">SEND OTP</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-center mt-8 gap-2" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={16} color="#92400E" />
            <Text className="text-md font-semibold" style={{ color: '#92400E' }}>Back to login</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
