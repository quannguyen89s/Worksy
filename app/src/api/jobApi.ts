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
  return 'Có lỗi xảy ra. Kiểm tra: 1) Token 2) Backend chạy port 3000 3) app/.env: EXPO_PUBLIC_API_URL=http://IP-PC:3000 rồi npx expo start -c';
}

export type JobCreateBody = {
  title: string;
  description: string;
  price: number;
  location: { lat: number; lng: number };
  scheduledAt: string;
  requiredWorkers: number;
  skillTags?: string[];
};

export type JobUpdateBody = {
  title?: string;
  description?: string;
  price?: number;
  location?: { lat: number; lng: number };
  scheduledAt?: string;
  requiredWorkers?: number;
  skillTags?: string[];
};

export type AssignedWorkerRef = {
  _id: string;
  name?: string;
  email?: string;
};

export type Job = {
  _id: string;
  title: string;
  description: string;
  price: number;
  location: { lat: number; lng: number };
  scheduledAt?: string;
  requiredWorkers: number;
  assignedWorkers: number;
  /** ObjectId hoặc đã populate (sau khi list mine) */
  assignedWorkerIds?: string[] | AssignedWorkerRef[];
  skillTags?: string[];
  status: string;
  createdBy: string;
  createdAt?: string;
  distanceKm?: number;
  completedAt?: string | null;
  completionDueAt?: string | null;
  completionSource?: 'manual' | 'auto' | null;
  autoDoneAfterHours?: number | null;
  /** Backend list mine: còn thợ chưa có review → true (nút Đánh giá sáng). */
  feedbackActionable?: boolean;
};

export type JobReviewRow = {
  _id: string;
  workerId: string;
  rating: number;
  comment?: string;
  createdAt?: string;
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

export type Apply = {
  _id: string;
  jobId: Job | string;
  workerId: string;
  status: 'pending' | 'accepted' | 'rejected';
  priceOffer?: number;
};

export type RankedApplicant = {
  apply: {
    _id: string;
    workerId: string;
    priceOffer?: number;
    status: 'pending' | 'accepted' | 'rejected';
  };
  worker: {
    _id: string;
    name?: string;
    rating?: number;
    completedJobs?: number;
    skills?: string[];
    location?: { lat: number; lng: number };
  };
  score: number;
};

function parseScore(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const normalized = raw.replace(',', '.').trim();
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }
  if (raw && typeof raw === 'object') {
    const o = raw as {
      $numberDecimal?: string;
      $numberDouble?: string;
      value?: number | string;
    };
    if (o.$numberDecimal) return parseScore(o.$numberDecimal);
    if (o.$numberDouble) return parseScore(o.$numberDouble);
    if (o.value != null) return parseScore(o.value);
  }
  return 0;
}

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

export async function completeJob(accessToken: string, jobId: string): Promise<Job> {
  const { data } = await axios.patch(
    `${API_BASE}/jobs/${jobId}/complete`,
    {},
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 15000,
    },
  );
  return data.data;
}

export async function listJobReviews(
  accessToken: string,
  jobId: string,
): Promise<JobReviewRow[]> {
  const { data } = await axios.get(`${API_BASE}/review/job/${jobId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000,
  });
  const rows = Array.isArray(data.data) ? data.data : [];
  return rows.map((r: Record<string, unknown>) => {
    const wid = r.workerId as { _id?: string } | string | undefined;
    const workerId =
      typeof wid === 'object' && wid && '_id' in wid
        ? String((wid as { _id: string })._id)
        : String(wid ?? '');
    return {
      _id: String(r._id ?? ''),
      workerId,
      rating: Number(r.rating) || 0,
      ...(typeof r.comment === 'string' && r.comment ? { comment: r.comment } : {}),
      ...(typeof r.createdAt === 'string' ? { createdAt: r.createdAt } : {}),
    };
  });
}

export async function createJobReview(
  accessToken: string,
  body: { jobId: string; workerId: string; rating: number; comment?: string },
): Promise<JobReviewRow> {
  const { jobId, workerId, rating, comment } = body;
  const { data } = await axios.post(
    `${API_BASE}/jobs/${jobId}/reviews`,
    {
      workerId,
      rating,
      ...(comment !== undefined && comment !== '' ? { comment } : {}),
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    },
  );
  return data.data;
}

export async function applyJob(
  accessToken: string,
  body: { jobId: string; priceOffer?: number },
): Promise<{ _id: string; jobId: string; workerId: string; status: string; priceOffer?: number }> {
  const { data } = await axios.post(`${API_BASE}/apply`, body, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
  return data.data;
}

export async function listMyApplies(accessToken: string): Promise<Apply[]> {
  const { data } = await axios.get(`${API_BASE}/apply/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000,
  });
  return data.data;
}

export async function cancelApply(
  accessToken: string,
  applyId: string,
): Promise<{ deleted: boolean }> {
  const { data } = await axios.delete(`${API_BASE}/apply/${applyId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000,
  });
  return data.data;
}

export async function listApplicants(accessToken: string, jobId: string): Promise<RankedApplicant[]> {
  const { data } = await axios.get(`${API_BASE}/jobs/${jobId}/applicants`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000,
  });
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.map((row: unknown) => {
    const r = (row ?? {}) as {
      apply?: {
        _id?: string;
        workerId?: string | { _id?: string };
        priceOffer?: number;
        status?: 'pending' | 'accepted' | 'rejected';
      };
      worker?: {
        _id?: string;
        name?: string;
        rating?: number;
        completedJobs?: number;
        skills?: string[];
        location?: { lat: number; lng: number };
      };
      score?: number | string;
    };

    const workerId =
      typeof r.apply?.workerId === 'string'
        ? r.apply.workerId
        : (r.apply?.workerId?._id ?? r.worker?._id ?? '');

    const resolvedScore =
      parseScore(r.score) ||
      parseScore((r as { apply?: { score?: unknown } }).apply?.score);

    return {
      apply: {
        _id: r.apply?._id ?? '',
        workerId,
        ...(r.apply?.priceOffer != null ? { priceOffer: r.apply.priceOffer } : {}),
        status: r.apply?.status ?? 'pending',
      },
      worker: {
        _id: r.worker?._id ?? workerId,
        name: r.worker?.name,
        rating: r.worker?.rating,
        completedJobs: r.worker?.completedJobs,
        skills: r.worker?.skills,
        location: r.worker?.location,
      },
      score: resolvedScore,
    } as RankedApplicant;
  });
}

export async function selectWorkers(
  accessToken: string,
  jobId: string,
  workerIds: string[],
): Promise<Job> {
  const { data } = await axios.post(
    `${API_BASE}/jobs/${jobId}/select-workers`,
    { workerIds },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    },
  );
  return data.data;
}
