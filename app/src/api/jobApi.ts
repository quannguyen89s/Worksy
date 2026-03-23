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
};

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
