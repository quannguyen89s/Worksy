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

export default function ResetPasswordScreen({ navigation, route }: any) {
  const { email, otp } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

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
      Toast.show({ type: 'success', title: 'Success', message: 'Password changed successfully!' });
      setTimeout(() => { navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); }, 2000);
    } catch (error: any) {
      Toast.show({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to change password.' });
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
            <Text className="text-xl font-bold text-gray-500 mt-5">Set New Password</Text>
          </View>

          {/* New Password */}
          <View className="mb-10">
            <Text className="text-md font-semibold text-gray-500 mb-2 uppercase tracking-wider">New Password</Text>
            <View
              className="flex-row items-center gap-3 pb-2.5"
              style={{ borderBottomWidth: 1.5, borderBottomColor: passwordFocused ? '#92400E' : '#E5E7EB' }}
            >
              <Ionicons name="lock-closed-outline" size={20} color={passwordFocused ? '#92400E' : '#B0B0B0'} />
              <TextInput
                className="flex-1 text-xl text-gray-800 p-0"
                placeholder="Min 6 chars, uppercase & number"
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

          {/* Confirm Password */}
          <View className="mb-10">
            <Text className="text-md font-semibold text-gray-500 mb-2 uppercase tracking-wider">Confirm New Password</Text>
            <View
              className="flex-row items-center gap-3 pb-2.5"
              style={{ borderBottomWidth: 1.5, borderBottomColor: confirmFocused ? '#92400E' : '#E5E7EB' }}
            >
              <Ionicons name="lock-closed-outline" size={20} color={confirmFocused ? '#92400E' : '#B0B0B0'} />
              <TextInput
                className="flex-1 text-xl text-gray-800 p-0"
                placeholder="Re-enter new password"
                placeholderTextColor="#B0B0B0"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#B0B0B0" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={handleReset} activeOpacity={0.85} disabled={loading}>
            <LinearGradient
              colors={['#B45309', '#92400E', '#78350F']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              className="rounded-full py-4 items-center"
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text className="text-white text-base font-extrabold tracking-widest">CHANGE PASSWORD</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
