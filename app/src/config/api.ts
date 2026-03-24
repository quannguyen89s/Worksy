import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Cổng backend mặc định (trùng `PORT` trong backend). */
const API_PORT = 3000;

/**
 * Trong Expo Go, `hostUri` / `debuggerHost` thường là `192.168.x.x:8081` → lấy IP máy chạy Metro
 * để gọi backend trên cùng máy đó (điện thoại thật + cùng Wi‑Fi).
 */
function devHostFromExpo(): string | null {
  const expoCfg = Constants.expoConfig as { hostUri?: string } | null | undefined;
  const fromConfig = expoCfg?.hostUri;
  const fromGo = Constants.expoGoConfig as { debuggerHost?: string } | null | undefined;
  let raw = fromConfig ?? fromGo?.debuggerHost ?? null;

  if (!raw && typeof Constants.experienceUrl === 'string') {
    const m = Constants.experienceUrl.match(/^exp:\/\/([^/:]+)/);
    if (m?.[1]) raw = m[1];
  }

  if (!raw || typeof raw !== 'string') return null;
  const host = raw.split(':')[0]?.trim();
  return host || null;
}

/**
 * Base URL API.
 * - Ưu tiên `EXPO_PUBLIC_API_URL` trong `.env` (vd: http://192.168.1.5:3000).
 * - Dev: tự suy ra IP từ Expo khi có (Expo Go / tunnel).
 * - Android emulator: 10.0.2.2; iOS simulator: 127.0.0.1.
 */
export const API_BASE_URL: string = (() => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (__DEV__) {
    const host = devHostFromExpo();
    if (host) {
      return `http://${host}:${API_PORT}`;
    }
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}`;
  }
  if (Platform.OS === 'ios') {
    return `http://127.0.0.1:${API_PORT}`;
  }
  return `http://172.16.0.22:${API_PORT}`;
})();
