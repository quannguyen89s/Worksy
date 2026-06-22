import type { RootStackParamList } from '@/navigation/types';
import { COLORS } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, type NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import type { ComponentProps } from 'react';
import { useCallback, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { decodeJwtRole } from '@/api/adminApi';
import { getUnreadCount as getChatUnreadCount } from '@/services/chat.service';
import { getUnreadCount as getNotificationUnreadCount } from '@/services/notification.service';
import { connectSocket } from '@/services/socket';

type UserRoute = keyof Pick<
  RootStackParamList,
  'Home' | 'BrowseJobs' | 'MyJobs' | 'WorkerApplies' | 'Notifications' | 'Messages'
>;
type UserRole = 'customer' | 'worker' | 'admin' | 'guest';

type IconName = ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<UserRoute, IconName> = {
  Home: 'home-outline',
  BrowseJobs: 'search-outline',
  MyJobs: 'briefcase-outline',
  WorkerApplies: 'document-text-outline',
  Notifications: 'notifications-outline',
  Messages: 'chatbubble-ellipses-outline',
};

const LABELS: Record<UserRoute, string> = {
  Home: 'TRANG CHỦ',
  BrowseJobs: 'TÌM VIỆC',
  MyJobs: 'TIN CỦA TÔI',
  WorkerApplies: 'ĐÃ ỨNG TUYỂN',
  Notifications: 'THÔNG BÁO',
  Messages: 'TIN NHẮN',
};

const TAB_H = 58;

export default function UserBottomBar({
  navigation,
  active,
}: {
  navigation: NavigationProp<RootStackParamList>;
  active: UserRoute;
}) {
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<UserRole>('guest');
  const [chatUnread, setChatUnread] = useState(0);
  const [notificationUnread, setNotificationUnread] = useState(0);
  const bottomPad = Math.max(insets.bottom, 10);
  const height = TAB_H + bottomPad;

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

      let mounted = true;
      const refreshUnread = async () => {
        try {
          const [chatCount, notificationCount] = await Promise.all([
            getChatUnreadCount(),
            getNotificationUnreadCount(),
          ]);
          if (!mounted) return;
          setChatUnread(chatCount);
          setNotificationUnread(notificationCount);
        } catch {
          // Keep previous badge values when API is unavailable.
        }
      };
      void refreshUnread();

      let offSocket: (() => void) | null = null;
      void connectSocket().then((socket) => {
        if (!mounted) return;
        const onNewMessage = () => setChatUnread((c) => c + 1);
        const onNotification = () => setNotificationUnread((c) => c + 1);
        socket.on('new_message', onNewMessage);
        socket.on('notification', onNotification);
        offSocket = () => {
          socket.off('new_message', onNewMessage);
          socket.off('notification', onNotification);
        };
      });

      return () => {
        mounted = false;
        offSocket?.();
      };
    }, []),
  );

  // Admin không dùng layout worker; nếu vẫn ở màn user, dùng tab giống customer (Home sẽ redirect lên AdminDashboard).
  const routes: UserRoute[] =
    role === 'customer' || role === 'admin'
      ? ['Home', 'MyJobs', 'Notifications', 'Messages']
      : ['Home', 'BrowseJobs', 'WorkerApplies', 'Notifications', 'Messages'];

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.tabBar,
        {
          height,
          paddingBottom: bottomPad,
        },
      ]}>
      {routes.map((r) => {
        const isActive = r === active;
        return (
          <TouchableOpacity
            key={r}
            style={styles.tabItem}
            onPress={() => navigation.navigate(r)}
            activeOpacity={0.85}>
            <View style={[styles.tabIconBox, isActive && styles.tabIconBoxActive]}>
              <Ionicons
                name={ICONS[r]}
                size={20}
                color={isActive ? COLORS.primaryDark : COLORS.textMuted}
              />
              {r === 'Messages' && chatUnread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {chatUnread > 9 ? '9+' : String(chatUnread)}
                  </Text>
                </View>
              )}
              {r === 'Notifications' && notificationUnread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationUnread > 9 ? '9+' : String(notificationUnread)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{LABELS[r]}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingTop: 8,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
    zIndex: 10,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabIconBox: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    position: 'relative',
  },
  tabIconBoxActive: { backgroundColor: COLORS.primaryLight },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  tabLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.2 },
  tabLabelActive: { color: COLORS.primaryDark },
});

