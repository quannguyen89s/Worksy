import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { User } from '../types';

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await api.post<{
    message?: string;
    accessToken?: string;
    token?: string;
    user?: User;
  }>('/auth/login', { email, password });

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

  if (user) await AsyncStorage.setItem('user', JSON.stringify(user));
  return { token, user: user! };
}

export async function register(
  name: string,
  email: string,
  password: string,
  confirm_password: string,
): Promise<unknown> {
  const res = await api.post('/auth/register', { name, email, password, confirm_password });
  return res.data;
}

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove(['token', 'user']);
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem('user');
  return raw ? (JSON.parse(raw) as User) : null;
}

/** Object export — dùng cho authScreens components */
const authService = { login, register, logout, getStoredUser };
export default authService;
