import apiClient from '@/services/apiClient';

export type WorkerListItem = {
  _id: string;
  name: string;
  rating: number;
  completedJobs: number;
  skills: string[];
  avatar: string;
};

type WorkersResponse = {
  success?: boolean;
  items?: WorkerListItem[];
  message?: string;
};

/**
 * Danh sách thợ (backend GET /users/workers — cần access token).
 */
export async function fetchWorkers(params?: {
  limit?: number;
  search?: string;
}): Promise<WorkerListItem[]> {
  const res = await apiClient.get<WorkersResponse>('/users/workers', {
    params: {
      limit: params?.limit ?? 24,
      ...(params?.search?.trim() ? { search: params.search.trim() } : {}),
    },
  });
  return res.data?.items ?? [];
}
