import type { ReactNode } from 'react';
import { COLORS } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

export default function UserHeader({
  title,
  subtitle,
  leftIcon = 'arrow-back',
  hideLeftButton = false,
  onLeftPress,
  rightLabel,
  onRightPress,
  /** Nút tùy chỉnh bên phải (vd: avatar → Profile). Nếu có thì bỏ qua rightLabel. */
  rightSlot,
}: {
  title: string;
  subtitle?: string;
  leftIcon?: 'arrow-back' | 'menu';
  hideLeftButton?: boolean;
  onLeftPress?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
  rightSlot?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      {hideLeftButton ? (
        <View style={styles.leftPlaceholder} />
      ) : (
        <TouchableOpacity style={styles.leftBtn} onPress={onLeftPress} activeOpacity={0.8}>
          <Ionicons name={leftIcon} size={20} color={COLORS.primaryDark} />
        </TouchableOpacity>
      )}
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightSlot ? (
        <View style={styles.rightSlotWrap}>{rightSlot}</View>
      ) : rightLabel ? (
        <TouchableOpacity style={styles.rightBtn} onPress={onRightPress} activeOpacity={0.85}>
          <Text style={styles.rightBtnText}>{rightLabel}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.rightPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  leftBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  leftPlaceholder: { width: 40, height: 40 },
  textWrap: { flex: 1, marginHorizontal: 10 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  rightBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.errorLight,
  },
  rightBtnText: { color: COLORS.error, fontWeight: '700', fontSize: 13 },
  rightPlaceholder: { width: 44 },
  rightSlotWrap: { minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' },
});

