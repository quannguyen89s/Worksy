import { API_BASE_URL } from '@/config/api';

/**
 * Ghép URL ảnh đại diện từ API (đường dẫn `/uploads/...`, URL đầy đủ Google, v.v.).
 */
export function resolveAvatarUrl(
  avatar?: string | null,
  options?: { cacheBust?: number },
): string | undefined {
  if (avatar == null || typeof avatar !== 'string') return undefined;
  const a = avatar.trim();
  if (!a) return undefined;

  let url: string;
  if (/^https?:\/\//i.test(a)) {
    url = a;
  } else {
    const path = a.startsWith('/') ? a : `/${a}`;
    const base = API_BASE_URL.replace(/\/$/, '');
    url = `${base}${path}`;
  }

  if (options?.cacheBust != null) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}t=${options.cacheBust}`;
  }
  return url;
}
