import axios from 'axios';
import { API_BASE } from './config';

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    if ('response' in err) {
      const ax = err as { response?: { data?: { message?: string }; status?: number } };
      const msg = ax.response?.data?.message;
      if (msg) return msg;
      if (ax.response?.status === 401) return 'Chưa đăng nhập hoặc token hết hạn';
      if (ax.response?.status === 403) return 'Không có quyền thực hiện';
      if (ax.response?.status === 404) return 'Không tìm thấy';
    }
    if ('message' in err) return String((err as { message: string }).message);
  }
  return 'Có lỗi xảy ra. Kiểm tra: 1) Token đúng chưa 2) Backend có chạy ở port 3000 3) Nếu dùng thiết bị thật, đổi IP trong api/config.ts';
}

export type JobCreateBody = {
  title: string;
  description: string;
  price: number;
  location: { lat: number; lng: number };
  requiredWorkers: number;
  skillTags?: string[];
};

export type JobUpdateBody = {
  title?: string;
  description?: string;
  price?: number;
  location?: { lat: number; lng: number };
  requiredWorkers?: number;
  skillTags?: string[];
};

export type Job = {
  _id: string;
  title: string;
  description: string;
  price: number;
  location: { lat: number; lng: number };
  requiredWorkers: number;
  assignedWorkers: number;
  skillTags?: string[];
  status: string;
  createdBy: string;
  createdAt?: string;
  distanceKm?: number;
};

export type BrowseJobsParams = {
  search?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  skillTags?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc' | 'distance';
  page?: number;
  limit?: number;
};

export type BrowseJobsResult = {
  data: Job[];
  total: number;
  page: number;
  limit: number;
};

export async function browseJobs(
  accessToken: string,
  params?: BrowseJobsParams,
): Promise<BrowseJobsResult> {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.status) q.set('status', params.status);
  if (params?.minPrice != null) q.set('minPrice', String(params.minPrice));
  if (params?.maxPrice != null) q.set('maxPrice', String(params.maxPrice));
  if (params?.skillTags) q.set('skillTags', params.skillTags);
  if (params?.lat != null) q.set('lat', String(params.lat));
  if (params?.lng != null) q.set('lng', String(params.lng));
  if (params?.radiusKm != null) q.set('radiusKm', String(params.radiusKm));
  if (params?.sort) q.set('sort', params.sort);
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  const query = q.toString();
  const url = `${API_BASE}/jobs/browse${query ? `?${query}` : ''}`;
  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000,
  });
  return { data: data.data, total: data.total, page: data.page, limit: data.limit };
}

export async function createJob(accessToken: string, body: JobCreateBody): Promise<Job> {
  const { data } = await axios.post(`${API_BASE}/jobs`, body, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
  return data.data;
}

export { getErrorMessage };

export async function updateJob(accessToken: string, jobId: string, body: JobUpdateBody): Promise<Job> {
  const { data } = await axios.patch(`${API_BASE}/jobs/${jobId}`, body, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data.data;
}

export async function deleteJob(accessToken: string, jobId: string): Promise<{ deleted: boolean; id: string }> {
  const { data } = await axios.delete(`${API_BASE}/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data.data;
}

export async function listMyJobs(accessToken: string): Promise<Job[]> {
  const { data } = await axios.get(`${API_BASE}/jobs/mine`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data.data;
}
