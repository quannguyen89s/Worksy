import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Toast } from '@/components/ToastProvider';
import profileService from '@/services/profileService';

const ACCENT = '#92400E';

export default function ChangePasswordScreen({ navigation }: any) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentFocused, setCurrentFocused] = useState(false);
  const [newFocused, setNewFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Toast.show({ type: 'error', title: 'Error', message: 'Please enter your current password' });
      return;
    }
    if (!newPassword) {
      Toast.show({ type: 'error', title: 'Error', message: 'Please enter a new password' });
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({ type: 'error', title: 'Error', message: 'New password must be at least 6 characters' });
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      Toast.show({ type: 'error', title: 'Error', message: 'New password must contain at least 1 uppercase letter' });
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      Toast.show({ type: 'error', title: 'Error', message: 'New password must contain at least 1 number' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', title: 'Error', message: 'Confirm password does not match' });
      return;
    }

    setLoading(true);
    try {
      await profileService.changePassword(currentPassword, newPassword, confirmPassword);
      Toast.show({ type: 'success', title: 'Success', message: 'Password changed successfully' });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error', title: 'Error',
        message: error.response?.data?.message || 'Failed to change password',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FFF8E7' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" contentContainerClassName="flex-grow px-8 py-6" keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color={ACCENT} />
            </TouchableOpacity>
            <Text className="text-2xl font-bold" style={{ color: ACCENT }}>Change Password</Text>
          </View>

          {/* Lock icon */}
          <View className="items-center mb-8">
            <View
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{ backgroundColor: '#FEF3C7' }}
            >
              <Ionicons name="lock-closed" size={36} color={ACCENT} />
            </View>
            <Text className="text-sm text-gray-400 mt-3 text-center">
              Password must be at least 6 characters,{'\n'}1 uppercase letter and 1 number
            </Text>
          </View>

          {/* Current Password */}
          <View className="mb-8">
            <Text className="text-md font-semibold text-gray-500 mb-2 uppercase tracking-wider">Current Password</Text>
            <View
              className="flex-row items-center gap-3 pb-2.5"
              style={{ borderBottomWidth: 1.5, borderBottomColor: currentFocused ? ACCENT : '#E5E7EB' }}
            >
              <Ionicons name="key-outline" size={20} color={currentFocused ? ACCENT : '#B0B0B0'} />
              <TextInput
                className="flex-1 text-lg text-gray-800 p-0"
                placeholder="Enter current password"
                placeholderTextColor="#B0B0B0"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                onFocus={() => setCurrentFocused(true)}
                onBlur={() => setCurrentFocused(false)}
                secureTextEntry={!showCurrent}
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color="#B0B0B0" />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View className="mb-8">
            <Text className="text-md font-semibold text-gray-500 mb-2 uppercase tracking-wider">New Password</Text>
            <View
              className="flex-row items-center gap-3 pb-2.5"
              style={{ borderBottomWidth: 1.5, borderBottomColor: newFocused ? ACCENT : '#E5E7EB' }}
            >
              <Ionicons name="lock-closed-outline" size={20} color={newFocused ? ACCENT : '#B0B0B0'} />
              <TextInput
                className="flex-1 text-lg text-gray-800 p-0"
                placeholder="Min 6 chars, 1 uppercase, 1 number"
                placeholderTextColor="#B0B0B0"
                value={newPassword}
                onChangeText={setNewPassword}
                onFocus={() => setNewFocused(true)}
                onBlur={() => setNewFocused(false)}
                secureTextEntry={!showNew}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color="#B0B0B0" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm New Password */}
          <View className="mb-10">
            <Text className="text-md font-semibold text-gray-500 mb-2 uppercase tracking-wider">Confirm New Password</Text>
            <View
              className="flex-row items-center gap-3 pb-2.5"
              style={{ borderBottomWidth: 1.5, borderBottomColor: confirmFocused ? ACCENT : '#E5E7EB' }}
            >
              <Ionicons name="lock-closed-outline" size={20} color={confirmFocused ? ACCENT : '#B0B0B0'} />
              <TextInput
                className="flex-1 text-lg text-gray-800 p-0"
                placeholder="Re-enter new password"
                placeholderTextColor="#B0B0B0"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#B0B0B0" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity onPress={handleChangePassword} activeOpacity={0.85} disabled={loading}>
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

          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
