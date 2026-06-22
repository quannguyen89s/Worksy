import { View, Text, TouchableOpacity, ActivityIndicator, type ComponentProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  label: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

/**
 * Nút CTA chính cho màn Profile / Chỉnh sửa / Đổi mật khẩu — đồng bộ giao diện.
 */
export function ProfilePrimaryButton({ label, icon, onPress, loading, disabled }: Props) {
  const inactive = Boolean(disabled || loading);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={inactive}
      className="overflow-hidden rounded-2xl"
      style={{
        opacity: inactive ? 0.55 : 1,
        shadowColor: '#78350F',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 14,
        elevation: 10,
      }}
    >
      <LinearGradient
        colors={['#F59E0B', '#D97706', '#92400E']}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          minHeight: 54,
          paddingVertical: 15,
          paddingHorizontal: 22,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.22)',
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <View className="flex-row items-center">
            {icon ? (
              <View
                className="mr-2.5 h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Ionicons name={icon} size={20} color="#fff" />
              </View>
            ) : null}
            <Text
              style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: '800',
                letterSpacing: 0.4,
              }}
            >
              {label}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}
