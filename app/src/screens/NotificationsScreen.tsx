import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { decodeJwtRole } from '@/api/adminApi';
import type { RootStackParamList } from '@/navigation/types';
import { COLORS } from '@/theme/colors';
import UserHeader from '@/components/navigation/UserHeader';
import UserBottomBar from '@/components/navigation/UserBottomBar';

type UserRole = 'customer' | 'worker' | 'admin' | 'guest';

export default function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<UserRole>('guest');

  useFocusEffect(
    useCallback(() => {
      void SecureStore.getItemAsync('accessToken').then((token) => {
        if (!token) {
          setRole('guest');
          return;
        }
        const decoded = decodeJwtRole(token);
        if (decoded === 'customer' || decoded === 'worker' || decoded === 'admin') {
          setRole(decoded);
        } else {
          setRole('guest');
        }
      });
    }, []),
  );

  const notifications = useMemo(() => {
    if (role === 'customer') {
      return [
        'Có ứng viên mới cho tin của bạn.',
        'Nhắc bạn xem và chốt ứng viên phù hợp.',
        'Tin đã quá hạn có thể được auto done.',
      ];
    }
    if (role === 'worker') {
      return [
        'Có job mới phù hợp kỹ năng của bạn.',
        'Đơn ứng tuyển đang chờ duyệt.',
        'Một số công việc sắp tới giờ làm.',
      ];
    }
    return ['Chưa có thông báo nào.'];
  }, [role]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bg }]} edges={['top']}>
      <UserHeader
        title="Thông báo"
        subtitle={role === 'customer' ? 'Cập nhật cho khách hàng' : 'Cập nhật cho người lao động'}
        leftIcon="menu"
        onLeftPress={() => navigation.navigate('Home')}
      />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 10) + 86 }]}>
        {notifications.map((text, idx) => (
          <View key={`${idx}-${text}`} style={styles.card}>
            <Text style={styles.badge}>#{idx + 1}</Text>
            <Text style={styles.text}>{text}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.85}
          onPress={() => Alert.alert('Thông báo', 'Sẽ kết nối realtime notification ở bản sau.')}
        >
          <Text style={styles.ctaText}>Làm mới thông báo</Text>
        </TouchableOpacity>
      </ScrollView>

      <UserBottomBar navigation={navigation} active="Notifications" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 10 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '700',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  text: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  ctaBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700' },
});
