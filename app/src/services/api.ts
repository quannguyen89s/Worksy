import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/config/api';

/** Giữ tên cũ cho `socket.ts` và code import `BASE_URL` — luôn trùng `API_BASE_URL`. */
export const BASE_URL = API_BASE_URL;

const api = axios.create({ baseURL: API_BASE_URL });

async function getAccessToken() {
  const secureToken = await SecureStore.getItemAsync('accessToken');
  if (secureToken) return secureToken;
  return AsyncStorage.getItem('token');
}

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Khi nhận 401 (token hết hạn / không hợp lệ) → xóa token, trigger logout
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401) {
      await Promise.all([
        AsyncStorage.multiRemove(['token', 'refreshToken', 'user']),
        SecureStore.deleteItemAsync('accessToken'),
        SecureStore.deleteItemAsync('refreshToken'),
      ]);
      // Thông báo toàn app cần đăng nhập lại
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Callback được set bởi AppNavigator để redirect về Login khi token hết hạn */
export let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export default api;
