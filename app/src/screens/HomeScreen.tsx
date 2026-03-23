import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// header & light gray buttons, bg unchanged
const COLORS = {
  main: '#D1D5DB',
  light: '#D1D5DB',
  dark: '#4B5563',
};

export default function HomeScreen({ navigation }: any) {
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FFF8E7' }}>
      {/* Header */}
      <View className="px-6 py-5 flex-row items-center justify-between" style={{ backgroundColor: COLORS.main }}>
        <View>
          <Text className="text-2xl font-bold" style={{ color: COLORS.dark }}>Worksy</Text>
          <Text className="text-base mt-1 opacity-80" style={{ color: COLORS.dark }}>Welcome back</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: '#E5E7EB' }}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={20} color={COLORS.dark} />
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        {/* Quick actions */}
        <View className="bg-white rounded-2xl p-5 mb-5 shadow-sm">
          <Text className="text-slate-800 text-lg font-semibold mb-4">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity
              className="px-5 py-3 rounded-xl"
              style={{ backgroundColor: COLORS.light }}
              activeOpacity={0.7}
            >
              <Text className="font-medium" style={{ color: COLORS.dark }}>Find Jobs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-5 py-3 rounded-xl"
              style={{ backgroundColor: COLORS.light }}
              activeOpacity={0.7}
            >
              <Text className="font-medium" style={{ color: COLORS.dark }}>Post Job</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-5 py-3 rounded-xl"
              style={{ backgroundColor: COLORS.light }}
              activeOpacity={0.7}
            >
              <Text className="font-medium" style={{ color: COLORS.dark }}>My Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-5 py-3 rounded-xl"
              style={{ backgroundColor: COLORS.light }}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text className="font-medium" style={{ color: COLORS.dark }}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View className="bg-white rounded-2xl p-5 mb-5 shadow-sm">
          <Text className="text-slate-800 text-lg font-semibold mb-4">
            Overview
          </Text>
          <View className="flex-row justify-between">
            <View className="rounded-xl p-4 flex-1 mr-2" style={{ backgroundColor: COLORS.light }}>
              <Text className="text-sm" style={{ color: COLORS.dark }}>Jobs Viewed</Text>
              <Text className="text-2xl font-bold mt-1" style={{ color: COLORS.dark }}>0</Text>
            </View>
            <View className="rounded-xl p-4 flex-1" style={{ backgroundColor: COLORS.light }}>
              <Text className="text-sm" style={{ color: COLORS.dark }}>Posts Made</Text>
              <Text className="text-2xl font-bold mt-1" style={{ color: COLORS.dark }}>0</Text>
            </View>
          </View>
        </View>

        {/* Recent */}
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <Text className="text-slate-800 text-lg font-semibold mb-4">
            Latest Jobs
          </Text>
          <View className="rounded-xl p-4" style={{ backgroundColor: COLORS.light }}>
            <Text className="text-center py-8" style={{ color: COLORS.dark }}>
              No jobs available yet
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
