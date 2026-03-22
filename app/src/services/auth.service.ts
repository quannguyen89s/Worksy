import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { User } from '../types';

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await api.post<{ success: boolean; token: string; user: User }>('/auth/login', {
    email,
    password,
  });
  const { token, user } = res.data;
  await AsyncStorage.setItem('token', token);
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
