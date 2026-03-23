import { Platform } from 'react-native';

// Thiết bị thật: thay bằng IP máy (xem trong `expo start` hoặc chạy `ipconfig`)
// Android emulator: 10.0.2.2 | iOS simulator: localhost
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : '172.16.0.116';

export const API_BASE = __DEV__ ? `http://${DEV_HOST}:3000` : 'https://api.example.com';
