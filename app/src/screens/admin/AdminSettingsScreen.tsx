import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@/navigation/types';
import { fetchCategories, toErrMessage } from '@/api/adminApi';
import { adminTheme } from '@/constants/adminTheme';

type Props = StackScreenProps<RootStackParamList, 'AdminSettings'>;

export default function AdminSettingsScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const c = await fetchCategories();
      setCategories(c);
    } catch (e) {
      setError(toErrMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: adminTheme.bgPage }}>
      <View
        className="flex-row items-center px-4 py-3"
        style={{
          backgroundColor: adminTheme.bgHeader,
          borderBottomWidth: 1,
          borderBottomColor: adminTheme.borderSoft,
        }}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={{ color: adminTheme.brown, fontSize: 16 }}>←</Text>
        </TouchableOpacity>
        <Text
          className="mr-6 flex-1 text-center text-lg font-bold"
          style={{ color: adminTheme.brown }}>
          Cài đặt
        </Text>
      </View>
      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="mb-2 text-base" style={{ color: adminTheme.brownMuted }}>
          Gợi ý danh mục dịch vụ từ backend (chỉ đọc). Trên thiết bị thật cần{' '}
          <Text style={{ fontWeight: '700' }}>EXPO_PUBLIC_API_URL</Text> trỏ tới máy chủ.
        </Text>
        {error ? (
          <View className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
            <Text style={{ color: adminTheme.danger }}>{error}</Text>
          </View>
        ) : null}
        {loading ? (
          <ActivityIndicator color={adminTheme.teal} style={{ marginVertical: 16 }} />
        ) : null}
        <View
          className="rounded-2xl p-4"
          style={{
            backgroundColor: adminTheme.card,
            borderWidth: 1,
            borderColor: adminTheme.borderSoft,
          }}>
          <Text className="mb-3 text-base font-bold" style={{ color: adminTheme.brown }}>
            Danh mục gợi ý
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((c) => (
              <View
                key={c}
                className="rounded-xl px-3 py-1.5"
                style={{ backgroundColor: adminTheme.pillBg }}>
                <Text style={{ color: adminTheme.brown, fontWeight: '600', fontSize: 13 }}>
                  {c}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
