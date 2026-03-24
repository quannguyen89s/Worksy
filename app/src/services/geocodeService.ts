/**
 * Geocoding service - chuyển địa chỉ thành lat/lng dùng Nominatim (OpenStreetMap)
 * Miễn phí, không cần API key
 */

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

export type AddressSuggestion = {
  displayName: string;
  lat: number;
  lng: number;
  placeId: string;
};

/**
 * Tìm gợi ý địa chỉ khi user nhập
 * Giới hạn kết quả tại Việt Nam (countrycodes=vn)
 */
export async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const params = new URLSearchParams({
      q: `${q} Viet Nam`,
      format: 'json',
      limit: '6',
      countrycodes: 'vn',
    });
    const res = await fetch(`${NOMINATIM_SEARCH}?${params}`, {
      headers: {
        'User-Agent': 'WorksyApp/1.0',
      },
    });
    const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string; place_id: number }>;
    return data.map((item) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      placeId: String(item.place_id),
    }));
  } catch {
    return [];
  }
}

/**
 * Reverse geocode - chuyển tọa độ thành địa chỉ (dùng Nominatim)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
    });
    const res = await fetch(`${NOMINATIM_REVERSE}?${params}`, {
      headers: { 'User-Agent': 'WorksyApp/1.0' },
    });
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
