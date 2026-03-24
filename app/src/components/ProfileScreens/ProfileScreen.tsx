import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Toast } from '@/components/ToastProvider';
import profileService from '@/services/profileService';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/config/api';

function avatarUri(avatar?: string | null): string | undefined {
  if (!avatar) return undefined;
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return `${API_BASE_URL}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
}

const ACCENT = '#92400E';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  isVerified: boolean;
  createdAt: string;
}

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const result = await profileService.getProfile();
      setProfile(result.result);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to load profile',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleLogout = async () => {
    try {
      const apiClient = (await import('@/services/apiClient')).default;
      await apiClient.post('/auth/logout');
    } catch { }
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    Toast.show({ type: 'success', title: 'Logged Out', message: 'You have been logged out successfully' });
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: '#FFF8E7' }}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text className="mt-3 text-gray-500">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FFF8E7' }}>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {/* Top section: Avatar + Name */}
        <View className="items-center pt-6 pb-4" style={{ backgroundColor: '#FFF8E7' }}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ position: 'absolute', left: 16, top: 16 }}
          >
            <Ionicons name="arrow-back" size={24} color={ACCENT} />
          </TouchableOpacity>

          {/* Avatar */}
          <View
            className="rounded-full items-center justify-center"
            style={{
              width: 110, height: 110,
              borderWidth: 3, borderColor: ACCENT,
              backgroundColor: '#fff',
            }}
          >
            {profile?.avatar ? (
              <Image
                source={{ uri: avatarUri(profile.avatar)! }}
                className="rounded-full"
                style={{ width: 100, height: 100 }}
              />
            ) : (
              <LinearGradient
                colors={['#D97706', '#92400E']}
                className="rounded-full items-center justify-center"
                style={{ width: 100, height: 100 }}
              >
                <Text className="text-white text-4xl font-bold">
                  {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </LinearGradient>
            )}
          </View>

          {/* Verified badge */}
          <View className="flex-row items-center mt-3">
            <Ionicons
              name={profile?.isVerified ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={profile?.isVerified ? '#16A34A' : '#DC2626'}
            />
            <Text
              className="ml-1 text-xs font-medium"
              style={{ color: profile?.isVerified ? '#16A34A' : '#DC2626' }}
            >
              {profile?.isVerified ? 'Verified' : 'Unverified'}
            </Text>
          </View>

          {/* Name */}
          <Text className="text-xl font-bold text-gray-800 mt-2">{profile?.name}</Text>
          {/* Email subtitle */}
          <Text className="text-sm text-gray-400 mt-1">{profile?.email}</Text>
        </View>

        {/* Divider */}
        <View className="mx-5 h-px bg-gray-200 mb-2" />

        {/* Menu items */}
        <View className="px-5">
          <MenuItem
            icon="person-outline"
            label="Personal Information"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <MenuItem
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <MenuItem
            icon="mail-outline"
            label="Email"
            value={profile?.email}
          />
          <MenuItem
            icon="calendar-outline"
            label="Joined Date"
            value={profile?.createdAt ? formatDate(profile.createdAt) : ''}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Account Verification"
            value={profile?.isVerified ? 'Verified' : 'Unverified'}
            valueColor={profile?.isVerified ? '#16A34A' : '#DC2626'}
          />

          {/* Divider */}
          <View className="h-px bg-gray-200 my-2" />

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.6}
            className="flex-row items-center py-4"
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: '#FEE2E2' }}
            >
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            </View>
            <Text className="flex-1 text-base text-red-500 font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon, label, onPress, value, valueColor,
}: {
  icon: any; label: string; onPress?: () => void; value?: string; valueColor?: string;
}) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      {...(onPress ? { onPress, activeOpacity: 0.6 } : {})}
      className="flex-row items-center py-4"
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: '#FEF3C7' }}
      >
        <Ionicons name={icon} size={20} color={ACCENT} />
      </View>
      <Text className="flex-1 text-base text-gray-700 font-medium">{label}</Text>
      {value ? (
        <Text className="text-sm font-medium" style={{ color: valueColor || '#9CA3AF' }}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
      )}
    </Container>
  );
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'admin': return 'Admin';
    case 'employer': return 'Employer';
    case 'customer': return 'Customer';
    default: return role;
  }
}
