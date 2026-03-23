import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { isAxiosError } from 'axios';
import { API_BASE_URL } from '@/config/api';

const NETWORK_HINT = `Không kết nối được máy chủ (${API_BASE_URL}). Bật backend (npm run dev), điện thoại và PC cùng Wi‑Fi. Nếu vẫn lỗi: tạo app/.env với EXPO_PUBLIC_API_URL=http://IP-PC:3000 rồi chạy lại expo (npx expo start -c).`;

const TOKEN_KEY = 'worksy_admin_token';

export async function getAdminToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setAdminToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export function decodeJwtRole(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = globalThis.atob(padded);
    const o = JSON.parse(json) as { role?: string };
    return o.role ?? null;
  } catch {
    return null;
  }
}

/** Tên trong JWT (backend ký khi login) — dùng avatar chữ trên dashboard. */
export function decodeJwtName(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = globalThis.atob(padded);
    const o = JSON.parse(json) as { name?: string };
    const n = o.name?.trim();
    return n || null;
  } catch {
    return null;
  }
}

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config) => {
  const token = await getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type PendingApprovalRow = {
  id: string;
  kind: 'user_verify' | 'job_open';
  title: string;
  subtitle: string;
};

export type RecentActivityRow = {
  id: string;
  kind: 'job_done' | 'user_new' | 'system';
  title: string;
  subtitle: string;
  at: string;
};

export type Overview = {
  totalUsers: number;
  customers: number;
  workers: number;
  admins: number;
  jobsOpen: number;
  jobsPartial: number;
  jobsFull: number;
  jobsDone: number;
  totalJobs: number;
  revenueDone: number;
  reportedPosts: number;
  /** Doanh thu việc done (theo updatedAt) trong 7 ngày gần nhất */
  revenueCurrentPeriod: number;
  revenuePreviousPeriod: number;
  /** % so với 7 ngày trước; null nếu kỳ trước = 0 (không chia được) */
  revenueTrendPercent: number | null;
  revenueTrendPeriodLabel: string;
  jobMomentumLabel: string;
  /** % việc trạng thái done / tổng việc */
  completionRate: number;
  pendingApprovals: PendingApprovalRow[];
  recentActivity: RecentActivityRow[];
  recentUserInitials: string[];
};

export type UserRow = {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  rating?: number;
  completedJobs?: number;
  createdAt?: string;
};

export type CreateUserBody = {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  role?: string;
  isVerified?: boolean;
};

export type JobRow = {
  _id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  requiredWorkers: number;
  assignedWorkers: number;
  skillTags: string[];
  createdAt?: string;
  createdBy?: { name?: string; email?: string; role?: string } | null;
};

export async function loginRequest(email: string, password: string) {
  const res = await axios.post(`${API_BASE_URL}/auth/login`, {
    email,
    password,
  });
  return res.data as {
    message: string;
    result: { accessToken?: string; refreshToken?: string; message?: string };
  };
}

export async function fetchOverview(): Promise<Overview> {
  const res = await client.get<{ success: boolean; data: Overview }>('/admin/overview');
  return res.data.data;
}

export async function fetchUsers(params: {
  page: number;
  limit?: number;
  role?: string;
  search?: string;
}) {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('limit', String(params.limit ?? 20));
  if (params.role) q.set('role', params.role);
  if (params.search) q.set('search', params.search);
  const res = await client.get<{
    success: boolean;
    data: { items: UserRow[]; total: number; page: number; limit: number };
  }>(`/admin/users?${q.toString()}`);
  return res.data.data;
}

export async function patchUser(id: string, body: { role?: string; isVerified?: boolean }) {
  const res = await client.patch<{ success: boolean; data: UserRow }>(`/admin/users/${id}`, body);
  return res.data.data;
}

export async function createUser(body: CreateUserBody) {
  const res = await client.post<{ success: boolean; data: UserRow }>(`/admin/users`, body);
  return res.data.data;
}

export async function fetchJobs(params: {
  page: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('limit', String(params.limit ?? 20));
  if (params.status) q.set('status', params.status);
  if (params.search) q.set('search', params.search);
  const res = await client.get<{
    success: boolean;
    data: { items: JobRow[]; total: number; page: number; limit: number };
  }>(`/admin/jobs?${q.toString()}`);
  return res.data.data;
}

export async function patchJob(
  id: string,
  body: {
    status?: string;
    title?: string;
    description?: string;
    price?: number;
  }
) {
  const res = await client.patch<{ success: boolean; data: JobRow }>(`/admin/jobs/${id}`, body);
  return res.data.data;
}

export async function deleteJob(id: string) {
  const res = await client.delete<{ success: boolean; data: { deleted: boolean } }>(
    `/admin/jobs/${id}`
  );
  return res.data.data;
}

export async function fetchCategories(): Promise<string[]> {
  const res = await client.get<{
    success: boolean;
    data: { categories: string[] };
  }>('/admin/meta/categories');
  return res.data.data.categories;
}

export function toErrMessage(e: unknown): string {
  if (isAxiosError(e)) {
    const code = e.code;
    const msg = e.message;
    if (code === 'ERR_NETWORK' || msg === 'Network Error' || msg === 'Network request failed') {
      return NETWORK_HINT;
    }
    const m = e.response?.data as { message?: string } | undefined;
    if (typeof m?.message === 'string') return m.message;
    return msg || 'Lỗi mạng';
  }
  if (e instanceof Error) return e.message;
  return 'Đã xảy ra lỗi';
}
