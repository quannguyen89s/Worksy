import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'http://172.16.0.116:3000';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Khi nhận 401 (token hết hạn / không hợp lệ) → xóa token, trigger logout
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
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
