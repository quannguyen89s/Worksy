import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Toast } from '@/components/ToastProvider';
import profileService from '@/services/profileService';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '@/config/api';

const ACCENT = '#92400E';

export default function EditProfileScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await profileService.getProfile();
        const p = result.result;
        setName(p.name || '');
        setAvatarUri(p.avatar ? (p.avatar.startsWith('http') ? p.avatar : `${API_BASE_URL}${p.avatar}`) : '');
        setEmail(p.email || '');
        setRole(p.role || '');
        setCreatedAt(p.createdAt || '');
        setIsVerified(p.isVerified || false);
      } catch {
        Toast.show({ type: 'error', title: 'Error', message: 'Failed to load profile' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const pickImage = async () => {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Toast.show({ type: 'error', title: 'Error', message: 'Photo library access is required' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setUploading(true);
      try {
        const uploadResult = await profileService.uploadAvatar(uri);
        const newAvatarUrl = `${API_BASE_URL}${uploadResult.result.avatar}`;
        setAvatarUri(newAvatarUrl);
        Toast.show({ type: 'success', title: 'Success', message: 'Avatar updated successfully' });
      } catch (error: any) {
        Toast.show({
          type: 'error', title: 'Error',
          message: error.response?.data?.message || 'Avatar upload failed',
        });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', title: 'Error', message: 'Name cannot be empty' });
      return;
    }
    setSaving(true);
    try {
      await profileService.updateProfile({ name: name.trim() });
      Toast.show({ type: 'success', title: 'Success', message: 'Profile updated successfully' });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error', title: 'Error',
        message: error.response?.data?.message || 'Failed to update profile',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: '#FFF8E7' }}>
        <ActivityIndicator size="large" color={ACCENT} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FFF8E7' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" contentContainerClassName="px-6 py-4" keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color={ACCENT} />
            </TouchableOpacity>
            <Text className="text-2xl font-bold" style={{ color: ACCENT }}>Personal Information</Text>
          </View>

          {/* Avatar + Upload */}
          <View className="items-center mb-8">
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8} disabled={uploading}>
              <View
                className="rounded-full items-center justify-center"
                style={{
                  width: 120, height: 120,
                  borderWidth: 3, borderColor: ACCENT,
                  backgroundColor: '#fff',
                }}
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    className="rounded-full"
                    style={{ width: 110, height: 110 }}
                  />
                ) : (
                  <LinearGradient
                    colors={['#D97706', '#92400E']}
                    className="rounded-full items-center justify-center"
                    style={{ width: 110, height: 110 }}
                  >
                    <Text className="text-white text-4xl font-bold">
                      {name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </LinearGradient>
                )}

                {/* Camera overlay */}
                <View
                  className="absolute items-center justify-center rounded-full"
                  style={{
                    bottom: 0, right: 0,
                    width: 36, height: 36,
                    backgroundColor: ACCENT,
                    borderWidth: 3, borderColor: '#FFF8E7',
                  }}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="camera" size={16} color="#fff" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
            <Text className="text-xs text-gray-400 mt-3">Tap to change your avatar</Text>
          </View>

          {/* Form fields in card */}
          <View className="bg-white rounded-2xl p-5 mb-5 shadow-sm">
            {/* Name (editable) */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Full Name</Text>
              <View
                className="flex-row items-center gap-3 pb-2"
                style={{ borderBottomWidth: 1.5, borderBottomColor: nameFocused ? ACCENT : '#F3F4F6' }}
              >
                <Ionicons name="person-outline" size={18} color={nameFocused ? ACCENT : '#B0B0B0'} />
                <TextInput
                  className="flex-1 text-base text-gray-800 p-0"
                  placeholder="Enter your name"
                  placeholderTextColor="#B0B0B0"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                />
              </View>
            </View>

            {/* Email (read-only) */}
            <ReadOnlyField icon="mail-outline" label="Email" value={email} />

            {/* Role (read-only) */}
            <ReadOnlyField icon="shield-outline" label="Role" value={getRoleLabel(role)} />

            {/* Created At (read-only) */}
            <ReadOnlyField icon="calendar-outline" label="Joined Date" value={formatDate(createdAt)} />

            {/* Verified (read-only) */}
            <View className="mb-2">
              <Text className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Status</Text>
              <View className="flex-row items-center gap-3 pb-2 border-b border-gray-50">
                <Ionicons
                  name={isVerified ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={isVerified ? '#16A34A' : '#DC2626'}
                />
                <Text
                  className="flex-1 text-base font-medium"
                  style={{ color: isVerified ? '#16A34A' : '#DC2626' }}
                >
                  {isVerified ? 'Verified' : 'Unverified'}
                </Text>
              </View>
            </View>
          </View>

          {/* Save button */}
          <TouchableOpacity onPress={handleSave} activeOpacity={0.85} disabled={saving} className="mb-8">
            <LinearGradient
              colors={['#B45309', '#92400E', '#78350F']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              className="rounded-full py-4 items-center"
            >
              {saving ? <ActivityIndicator color="#fff" /> : (
                <Text className="text-white text-base font-extrabold tracking-widest">SAVE CHANGES</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReadOnlyField({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View className="mb-6">
      <Text className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">{label}</Text>
      <View className="flex-row items-center gap-3 pb-2 border-b border-gray-50">
        <Ionicons name={icon} size={18} color="#B0B0B0" />
        <Text className="flex-1 text-base text-gray-400">{value}</Text>
        <Ionicons name="lock-closed" size={12} color="#D1D5DB" />
      </View>
    </View>
  );
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'employer': return 'Employer';
    case 'customer': return 'Customer';
    default: return role;
  }
}
