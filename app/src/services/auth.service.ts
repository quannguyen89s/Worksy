import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { User } from '../types';

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await api.post<{
    message?: string;
    accessToken?: string;
    refreshToken?: string;
    token?: string;
    user?: User;
  }>(
    '/auth/login',
    { email, password }
  );

  const token = res.data.accessToken ?? res.data.token;
  if (!token) {
    throw new Error(res.data.message ?? 'Đăng nhập thất bại');
  }

  await AsyncStorage.setItem('token', token);

  let user = res.data.user;
  if (!user) {
    const meRes = await api.get<{ success: boolean; user: User }>('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    user = meRes.data.user;
  }

  await AsyncStorage.setItem('user', JSON.stringify(user));
  return { token, user };
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem('user');
  return raw ? (JSON.parse(raw) as User) : null;
}
