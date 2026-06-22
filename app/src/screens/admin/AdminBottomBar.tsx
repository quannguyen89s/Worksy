import type { RootStackParamList } from '@/navigation/types';
import { adminTheme } from '@/constants/adminTheme';
import { Ionicons } from '@expo/vector-icons';
import type { NavigationProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import type { ComponentProps } from 'react';
import { useCallback, useState } from 'react';
import { fetchOverview } from '@/api/adminApi';

type AdminRoute = keyof Pick<
  RootStackParamList,
  'AdminDashboard' | 'AdminUsers' | 'AdminJobs' | 'AdminAlerts'
>;

const TAB_H = 58;

type IconName = ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<AdminRoute, IconName> = {
  AdminDashboard: 'stats-chart-outline',
  AdminUsers: 'people',
  AdminJobs: 'briefcase-outline',
  AdminAlerts: 'notifications-outline',
};

export default function AdminBottomBar({
  navigation,
  active,
}: {
  navigation: NavigationProp<RootStackParamList>;
  active: AdminRoute;
}) {
  const insets = useSafeAreaInsets();
  const [pendingJobsCount, setPendingJobsCount] = useState(0);
  const bottomPad = Math.max(insets.bottom, 10);
  const height = TAB_H + bottomPad;

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      void fetchOverview()
        .then((data) => {
          if (!mounted) return;
          setPendingJobsCount(data.jobsOpen ?? 0);
        })
        .catch(() => {
          // keep previous value on transient API errors
        });
      return () => {
        mounted = false;
      };
    }, []),
  );

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
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('AdminDashboard')}
        activeOpacity={0.85}>
        <View
          style={[
            styles.tabIconBox,
            active === 'AdminDashboard' && styles.tabIconBoxActive,
          ]}>
          <Ionicons
            name={ICONS.AdminDashboard}
            size={22}
            color={active === 'AdminDashboard' ? adminTheme.brown : adminTheme.brownMuted}
          />
        </View>
        <Text style={[styles.tabLabel, active === 'AdminDashboard' && styles.tabLabelActive]}>
          DASHBOARD
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('AdminUsers')}
        activeOpacity={0.85}>
        <View style={[styles.tabIconBox, active === 'AdminUsers' && styles.tabIconBoxActive]}>
          <Ionicons
            name={ICONS.AdminUsers}
            size={22}
            color={active === 'AdminUsers' ? adminTheme.brown : adminTheme.brownMuted}
          />
        </View>
        <Text style={[styles.tabLabel, active === 'AdminUsers' && styles.tabLabelActive]}>USERS</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('AdminJobs')}
        activeOpacity={0.85}>
        <View style={[styles.tabIconBox, active === 'AdminJobs' && styles.tabIconBoxActive]}>
          <Ionicons
            name={ICONS.AdminJobs}
            size={22}
            color={active === 'AdminJobs' ? adminTheme.brown : adminTheme.brownMuted}
          />
        </View>
        <Text style={[styles.tabLabel, active === 'AdminJobs' && styles.tabLabelActive]}>JOBS</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('AdminAlerts')}
        activeOpacity={0.85}>
        <View style={[styles.tabIconBox, active === 'AdminAlerts' && styles.tabIconBoxActive]}>
          <Ionicons
            name={ICONS.AdminAlerts}
            size={22}
            color={active === 'AdminAlerts' ? adminTheme.brown : adminTheme.brownMuted}
          />
          {pendingJobsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {pendingJobsCount > 9 ? '9+' : String(pendingJobsCount)}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.tabLabel, active === 'AdminAlerts' && styles.tabLabelActive]}>
          ALERTS
        </Text>
      </TouchableOpacity>
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
    backgroundColor: adminTheme.card,
    paddingTop: 8,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: adminTheme.borderSoft,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
    zIndex: 10,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabIconBox: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    position: 'relative',
  },
  tabIconBoxActive: { backgroundColor: adminTheme.gold },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: adminTheme.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  tabLabel: { fontSize: 9, fontWeight: '800', color: adminTheme.brownMuted, letterSpacing: 0.3 },
  tabLabelActive: { color: adminTheme.brown },
});

