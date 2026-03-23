import { Platform } from 'react-native';

// Thiết bị thật: thay bằng IP máy (xem trong `expo start` hoặc chạy `ipconfig`)
// Android emulator: 10.0.2.2 | iOS simulator: localhost
const DEFAULT_DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : '172.16.0.22';
const DEV_HOST = process.env.EXPO_PUBLIC_API_HOST ?? DEFAULT_DEV_HOST;
const DEV_PORT = process.env.EXPO_PUBLIC_API_PORT ?? '3000';

export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ??
  (__DEV__ ? `http://${DEV_HOST}:${DEV_PORT}` : 'https://api.example.com');
