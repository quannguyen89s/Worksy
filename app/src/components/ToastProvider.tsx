import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';
type ToastData = { type: ToastType; title: string; message?: string };

let showToastFn: ((data: ToastData) => void) | null = null;

export const Toast = {
  show: (data: ToastData) => { showToastFn?.(data); },
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: '#F0FDF4', border: '#16A34A', icon: '#16A34A' },
  error:   { bg: '#FEF2F2', border: '#DC2626', icon: '#DC2626' },
  info:    { bg: '#EFF6FF', border: '#2563EB', icon: '#2563EB' },
};

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

export default function ToastProvider() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-40)).current;
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -40, duration: 250, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const show = useCallback((data: ToastData) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(data);
    opacity.setValue(0);
    translateY.setValue(-40);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 15 }),
    ]).start();
    timer.current = setTimeout(hide, 3000);
  }, [opacity, translateY, hide]);

  useEffect(() => { showToastFn = show; return () => { showToastFn = null; }; }, [show]);

  if (!toast) return null;
  const c = COLORS[toast.type];

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ translateY }], backgroundColor: c.bg, borderLeftColor: c.border },
      ]}
    >
      <Ionicons name={ICONS[toast.type]} size={22} color={c.icon} />
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: c.icon }]}>{toast.title}</Text>
        {toast.message ? <Text style={styles.message}>{toast.message}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 50, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 12, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 6,
    zIndex: 9999,
  },
  textWrap: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700' },
  message: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});
