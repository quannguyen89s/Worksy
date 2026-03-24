# Map & Location – Các hàm và nơi sử dụng

Tài liệu mô tả các hàm, file và luồng sử dụng cho bản đồ và vị trí trong app Worksy.

---

## 1. Thư viện / package sử dụng

| Package | Phiên bản | Mục đích |
|---------|-----------|----------|
| `react-native-maps` | 1.20.1 | Hiển thị bản đồ (Google Maps / Apple Maps) |
| `expo-location` | ~19.0.8 | Lấy GPS, quản lý quyền vị trí |
| Nominatim API | (OpenStreetMap) | Geocode / reverse geocode (trong `geocodeService`) |

---

## 2. File: `app/src/services/geocodeService.ts`

| Hàm | Mô tả | Được gọi từ |
|-----|-------|-------------|
| `searchAddress(query: string)` | Tìm gợi ý địa chỉ từ văn bản → `{ displayName, lat, lng, placeId }[]` | `MyJobsScreen.tsx` (gợi ý khi nhập địa chỉ) |
| `reverseGeocode(lat, lng)` | Chuyển tọa độ → địa chỉ dạng string | `LocationMapPicker.tsx` (khi bấm Xác nhận) |
| **Type** `AddressSuggestion` | `{ displayName, lat, lng, placeId }` | `MyJobsScreen.tsx` |

**API dùng:**
- `https://nominatim.openstreetmap.org/search` (search)
- `https://nominatim.openstreetmap.org/reverse` (reverse geocode)

---

## 3. File: `app/src/components/LocationMapPicker.tsx`

### Props

| Prop | Kiểu | Mô tả |
|------|------|-------|
| `visible` | `boolean` | Ẩn/hiện modal |
| `onClose` | `() => void` | Đóng modal |
| `onConfirm` | `(result: LocationResult) => void` | Trả `{ lat, lng, address }` |
| `initialLocation` | `{ lat, lng } \| null` | Vị trí ban đầu |

### Hàm nội bộ

| Hàm / Logic | Gọi từ | Mô tả |
|-------------|--------|-------|
| `initFromCurrentLocation()` | Mở picker (khi chưa có `initialLocation`), nút "Vị trí hiện tại" | Xin quyền GPS → lấy vị trí → zoom map |
| `handleRegionChangeComplete(r)` | `MapView.onRegionChangeComplete` | Cập nhật vị trí chọn = tọa độ trung tâm map |
| `handleConfirm()` | Nút "Xác nhận" | Gọi `reverseGeocode` → `onConfirm` → đóng |

### Dependencies

| Import | Dùng cho |
|--------|----------|
| `MapView` từ `react-native-maps` | Hiển thị bản đồ |
| `Location` từ `expo-location` | `requestForegroundPermissionsAsync`, `getCurrentPositionAsync` |
| `reverseGeocode` từ `@/services/geocodeService` | Chuyển tọa độ → địa chỉ |
| `Ionicons` | Icon close, location, map |

### Được sử dụng tại

| File | Cách dùng |
|------|-----------|
| `RegisterScreen.tsx` | Nút "Chọn trên bản đồ" → cập nhật `userLocation` |
| `MyJobsScreen.tsx` | Nút "Chọn trên bản đồ" → cập nhật `formLocation` + `form.address` |

---

## 4. File: `app/src/components/authScreens/RegisterScreen.tsx`

| Hàm / API | Nguồn | Dùng cho |
|-----------|-------|----------|
| `Location.requestForegroundPermissionsAsync()` | `expo-location` | Nút "Vị trí hiện tại" |
| `Location.getCurrentPositionAsync()` | `expo-location` | Lấy GPS khi bấm "Vị trí hiện tại" |
| `<LocationMapPicker />` | `@/components/LocationMapPicker` | Nút "Chọn trên bản đồ" |
| `authService.register(..., userLocation)` | `@/services/authService` | Đăng ký kèm vị trí |

---

## 5. File: `app/src/screens/MyJobsScreen.tsx`

| Hàm / API | Nguồn | Dùng cho |
|-----------|-------|----------|
| `searchAddress(query)` | `@/services/geocodeService` | Gợi ý địa chỉ khi nhập (debounce) |
| `Location.requestForegroundPermissionsAsync()` | `expo-location` | Nút "Vị trí hiện tại" |
| `Location.getCurrentPositionAsync()` | `expo-location` | Lấy GPS cho form tạo/sửa tin |
| `<LocationMapPicker />` | `@/components/LocationMapPicker` | Nút "Chọn trên bản đồ" |
| `jobApi.createJob(..., location)` | `@/api/jobApi` | Tạo tin với `location` |
| `jobApi.updateJob(..., location)` | `@/api/jobApi` | Cập nhật tin với `location` |

---

## 6. File: `app/src/screens/BrowseJobsScreen.tsx`

| Hàm / API | Nguồn | Dùng cho |
|-----------|-------|----------|
| `Location.requestForegroundPermissionsAsync()` | `expo-location` | Nút "Lấy vị trí để tìm việc gần bạn" |
| `Location.getCurrentPositionAsync()` | `expo-location` | Lấy GPS cho `deviceLocation` |
| `profileService.getProfile()` | `@/services/profileService` | Lấy `userLocation` từ profile |
| `jobApi.browseJobs(..., lat, lng, radiusKm)` | `@/api/jobApi` | Danh sách job theo vị trí |
| `jobApi.listRecommendedJobs(..., lat, lng, radiusKm)` | `@/api/jobApi` | Gợi ý job gần vị trí |

---

## 7. File: `app/src/components/ProfileScreens/EditProfileScreen.tsx`

| Hàm / API | Nguồn | Dùng cho |
|-----------|-------|----------|
| `Location.requestForegroundPermissionsAsync()` | `expo-location` | Nút lấy vị trí |
| `Location.getCurrentPositionAsync()` | `expo-location` | Cập nhật `userLocation` |
| `profileService.updateProfile({ location })` | `@/services/profileService` | Lưu vị trí lên server |

---

## 8. File: `app/app.config.js`

| Mục | Mô tả |
|-----|-------|
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | API key cho Google Maps trên Android (tùy chọn) |
| `android.config.googleMaps.apiKey` | Cấu hình key cho `react-native-maps` |

---

## 9. Luồng tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHỌN VỊ TRÍ (LocationMapPicker)               │
├─────────────────────────────────────────────────────────────────┤
│  RegisterScreen / MyJobsScreen                                   │
│       │                                                          │
│       ▼                                                          │
│  LocationMapPicker (Modal)                                       │
│       │                                                          │
│       ├─► expo-location: requestForegroundPermissionsAsync       │
│       ├─► expo-location: getCurrentPositionAsync                 │
│       ├─► react-native-maps: MapView (initialRegion, onRegionChangeComplete) │
│       └─► geocodeService.reverseGeocode(lat, lng) → address     │
│       │                                                          │
│       ▼                                                          │
│  onConfirm({ lat, lng, address })                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    GỢI Ý ĐỊA CHỈ (MyJobsScreen)                  │
├─────────────────────────────────────────────────────────────────┤
│  User nhập địa chỉ (≥2 ký tự)                                    │
│       │                                                          │
│       ▼                                                          │
│  geocodeService.searchAddress(query) → AddressSuggestion[]       │
│       │                                                          │
│       ▼                                                          │
│  User chọn gợi ý → setFormLocation + setForm.address            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    TÌM VIỆC GẦN TÔI (BrowseJobsScreen)           │
├─────────────────────────────────────────────────────────────────┤
│  userLocation (profile) || deviceLocation (GPS)                  │
│       │                                                          │
│       ├─► jobApi.browseJobs(..., lat, lng, radiusKm)            │
│       └─► jobApi.listRecommendedJobs(..., lat, lng, radiusKm)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Bảng tổng hợp – Hàm ← File

| Hàm / Component | Định nghĩa tại | Được gọi từ |
|-----------------|----------------|-------------|
| `searchAddress` | `geocodeService.ts` | `MyJobsScreen.tsx` |
| `reverseGeocode` | `geocodeService.ts` | `LocationMapPicker.tsx` |
| `LocationMapPicker` | `LocationMapPicker.tsx` | `RegisterScreen.tsx`, `MyJobsScreen.tsx` |
| `Location.requestForegroundPermissionsAsync` | `expo-location` | `LocationMapPicker`, `RegisterScreen`, `MyJobsScreen`, `BrowseJobsScreen`, `EditProfileScreen` |
| `Location.getCurrentPositionAsync` | `expo-location` | `LocationMapPicker`, `RegisterScreen`, `MyJobsScreen`, `BrowseJobsScreen`, `EditProfileScreen` |
| `MapView` | `react-native-maps` | `LocationMapPicker.tsx` |
