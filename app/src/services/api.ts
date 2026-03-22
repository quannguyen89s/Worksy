import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Đổi IP thành địa chỉ máy chủ thực khi chạy trên thiết bị thật
export const BASE_URL = 'http://192.168.50.159:3000'; // Android emulator → localhost
// export const BASE_URL = 'http://localhost:3000'; // iOS simulator

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
