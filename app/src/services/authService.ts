import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '@/api/config';

const api = axios.create({
  baseURL: `${API_BASE}/auth`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getStoredUser() {
  const raw = await AsyncStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;
    await AsyncStorage.multiSet([
      ['token', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)],
    ]);
    return response.data;
  },

  register: async (name: string, email: string, password: string, confirm_password: string) => {
    const response = await api.post('/register', { name, email, password, confirm_password });
    return response.data;
  },

  logout: async (accessToken: string) => {
    const response = await api.post('/logout', {}, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
    return response.data;
  },

  googleLogin: async (idToken: string) => {
    const response = await api.post('/google-login', { idToken });
    const { accessToken, refreshToken, user } = response.data;
    await AsyncStorage.multiSet([
      ['token', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)],
    ]);
    return response.data;
  },
};

export default authService;