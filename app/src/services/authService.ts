import * as SecureStore from 'expo-secure-store';
import apiClient from './apiClient';
import profileService from './profileService';
import type { User } from '../types';

/**
 * User hiện tại (từ API `/profile`) khi còn access token.
 * Dùng cho Chat / Messages / Notifications — trước đây thiếu export nên bị "is not a function".
 */
export async function getStoredUser(): Promise<User | null> {
  const token = await SecureStore.getItemAsync('accessToken');
  if (!token) return null;

  const data = (await profileService.getProfile()) as {
    result?: {
      _id?: string;
      id?: string;
      name?: string;
      email?: string;
      role?: string;
      avatar?: string;
    };
  };
  const p = data?.result;
  if (!p || typeof p !== 'object') return null;

  const id = String(p._id ?? p.id ?? '');
  if (!id) return null;

  const role: User['role'] =
    p.role === 'worker' || p.role === 'customer' ? p.role : 'customer';

  return {
    id,
    _id: p._id != null ? String(p._id) : undefined,
    name: String(p.name ?? ''),
    email: typeof p.email === 'string' ? p.email : undefined,
    role,
    avatar: typeof p.avatar === 'string' ? p.avatar : undefined,
  };
}

export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const data = response.data as {
      accessToken?: string;
      refreshToken?: string;
      message?: string;
      result?: { accessToken?: string; refreshToken?: string };
    };
    // Backend trả flat { accessToken, refreshToken, user, message }
    if (data.accessToken && data.refreshToken) return data;
    if (data.result?.accessToken && data.result?.refreshToken) {
      return { accessToken: data.result.accessToken, refreshToken: data.result.refreshToken };
    }
    return data;
  },

  register: async (
    name: string,
    email: string,
    password: string,
    confirm_password: string,
    location?: { lat: number; lng: number },
  ) => {
    const body: Record<string, unknown> = { name, email, password, confirm_password };
    if (location?.lat != null && location?.lng != null) body.location = location;
    const response = await apiClient.post('/auth/register', body);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  /**
   * Đăng nhập Google trên Expo: `expo-auth-session` lấy id_token → backend `verifyIdToken`.
   */
  signInWithGoogleIdToken: async (idToken: string) => {
    const response = await apiClient.post('/auth/google-token', { idToken });
    return response.data as {
      message?: string;
      accessToken: string;
      refreshToken: string;
      user?: unknown;
    };
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyOTP: async (email: string, otp: string) => {
    const response = await apiClient.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  resetPassword: async (email: string, otp: string, password: string, confirm_password: string) => {
    const response = await apiClient.post('/auth/reset-password', { email, otp, password, confirm_password });
    return response.data;
  },
};

export default authService;