import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// header & nút xám nhạt, bg giữ nguyên
const COLORS = {
  main: '#D1D5DB',
  light: '#D1D5DB',
  dark: '#4B5563',
};

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FFF8E7' }}>
      {/* Header */}
      <View className="px-6 py-5" style={{ backgroundColor: COLORS.main }}>
        <Text className="text-2xl font-bold" style={{ color: COLORS.dark }}>Worksy</Text>
        <Text className="text-base mt-1 opacity-80" style={{ color: COLORS.dark }}>Chào mừng bạn trở lại</Text>
      </View>

      {/* Main content */}
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        {/* Quick actions */}
        <View className="bg-white rounded-2xl p-5 mb-5 shadow-sm">
          <Text className="text-slate-800 text-lg font-semibold mb-4">
            Thao tác nhanh
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity
              className="px-5 py-3 rounded-xl"
              style={{ backgroundColor: COLORS.light }}
              activeOpacity={0.7}
            >
              <Text className="font-medium" style={{ color: COLORS.dark }}>Tìm việc</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-5 py-3 rounded-xl"
              style={{ backgroundColor: COLORS.light }}
              activeOpacity={0.7}
            >
              <Text className="font-medium" style={{ color: COLORS.dark }}>Đăng tin</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-5 py-3 rounded-xl"
              style={{ backgroundColor: COLORS.light }}
              activeOpacity={0.7}
            >
              <Text className="font-medium" style={{ color: COLORS.dark }}>Tin của tôi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View className="bg-white rounded-2xl p-5 mb-5 shadow-sm">
          <Text className="text-slate-800 text-lg font-semibold mb-4">
            Tổng quan
          </Text>
          <View className="flex-row justify-between">
            <View className="rounded-xl p-4 flex-1 mr-2" style={{ backgroundColor: COLORS.light }}>
              <Text className="text-sm" style={{ color: COLORS.dark }}>Việc đã xem</Text>
              <Text className="text-2xl font-bold mt-1" style={{ color: COLORS.dark }}>0</Text>
            </View>
            <View className="rounded-xl p-4 flex-1" style={{ backgroundColor: COLORS.light }}>
              <Text className="text-sm" style={{ color: COLORS.dark }}>Tin đã đăng</Text>
              <Text className="text-2xl font-bold mt-1" style={{ color: COLORS.dark }}>0</Text>
            </View>
          </View>
        </View>

        {/* Recent */}
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <Text className="text-slate-800 text-lg font-semibold mb-4">
            Việc làm mới nhất
          </Text>
          <View className="rounded-xl p-4" style={{ backgroundColor: COLORS.light }}>
            <Text className="text-center py-8" style={{ color: COLORS.dark }}>
              Chưa có việc làm nào
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
