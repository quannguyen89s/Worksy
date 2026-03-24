# Backend API - Worksy

Tài liệu liệt kê các API có thể sử dụng trong ứng dụng Worksy, bao gồm request body, query params và header Authorization.

**Base URL mặc định:** `http://localhost:3000` (hoặc URL backend khi deploy)

## OpenAPI + Scalar (tài liệu tương tác)

Sau khi chạy backend (`npm run dev` trong thư mục `backend`):

| URL | Mô tả |
|-----|--------|
| [http://localhost:3000/reference](http://localhost:3000/reference) | Giao diện **Scalar** (thử API, xem schema) |
| [http://localhost:3000/openapi.yaml](http://localhost:3000/openapi.yaml) | File **OpenAPI 3.0** (YAML) |

File đặc tả nguồn: `backend/openapi.yaml`. Có thể import vào Postman, Insomnia hoặc [Scalar Desktop](https://scalar.com).

Trong `openapi.yaml` đã có **ví dụ (examples)** cho request/response: `example` mặc định, `examples` đặt tên (ví dụ khách/thợ khi login), schema mẫu (`Location`, `JobListItem`, `LoginResponse`, …). Scalar/Redoc sẽ hiển thị các mẫu này khi xem tài liệu.

---

## 1. Authorization Header

Hầu hết API yêu cầu xác thực qua **Bearer Token**:

```
Authorization: Bearer <accessToken>
```

Lấy `accessToken` sau khi đăng nhập thành công (từ API `/auth/login`, `/auth/google-token`, hoặc `/auth/refresh-token`).

---

## 2. Auth API (`/auth`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/auth/login` | ❌ | Đăng nhập |
| POST | `/auth/register` | ❌ | Đăng ký |
| POST | `/auth/verify-email` | ❌ | Xác thực email qua mã OTP |
| GET | `/auth/verify-email` | ❌ | Xác thực email qua link (query: token) |
| POST | `/auth/resend-verify-email` | ❌ | Gửi lại mã xác thực email |
| POST | `/auth/forgot-password` | ❌ | Quên mật khẩu |
| POST | `/auth/verify-otp` | ❌ | Xác thực OTP quên mật khẩu |
| POST | `/auth/reset-password` | ❌ | Đặt lại mật khẩu |
| POST | `/auth/refresh-token` | ❌ | Làm mới access token |
| POST | `/auth/logout` | ✅ Bearer | Đăng xuất |
| POST | `/auth/google-token` | ❌ | Đăng nhập Google (idToken) |
| GET | `/auth/google` | ❌ | Redirect đăng nhập Google |
| GET | `/auth/google/callback` | ❌ | Callback Google OAuth |

### Request body chi tiết

#### POST `/auth/login`
```json
{
  "email": "string",
  "password": "string"
}
```

#### POST `/auth/register`
```json
{
  "name": "string (2–50 ký tự)",
  "email": "string (email hợp lệ)",
  "password": "string (≥6 ký tự, có chữ hoa + số)",
  "confirm_password": "string (phải trùng password)",
  "location": { "lat": number, "lng": number }  // optional
}
```

#### POST `/auth/verify-email`
```json
{
  "emailVerifyToken": "string"
}
```

#### POST `/auth/resend-verify-email`
```json
{
  "email": "string"
}
```

#### POST `/auth/forgot-password`
```json
{
  "email": "string"
}
```

#### POST `/auth/verify-otp`
```json
{
  "email": "string",
  "otp": "string (6 ký tự)"
}
```

#### POST `/auth/reset-password`
```json
{
  "email": "string",
  "otp": "string (6 ký tự)",
  "password": "string (≥6 ký tự, có chữ hoa + số)",
  "confirm_password": "string (phải trùng password)"
}
```

#### POST `/auth/refresh-token`
```json
{
  "refreshToken": "string"
}
```

#### POST `/auth/google-token`
```json
{
  "idToken": "string (Google ID token)"
}
```

---

## 3. Jobs API (`/jobs`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/jobs` | ❌ | - | Job gần vị trí (query: lat, lng, radiusKm) |
| GET | `/jobs/browse` | ✅ Bearer | worker | Duyệt job có filter |
| GET | `/jobs/pending` | ✅ Bearer | admin | Job chờ duyệt |
| GET | `/jobs/recommended` | ✅ Bearer | worker | Job gợi ý |
| GET | `/jobs/mine` | ✅ Bearer | customer | Job của tôi (khách đăng) |
| GET | `/jobs/:id` | ❌ | - | Chi tiết 1 job |
| GET | `/jobs/:id/applicants` | ✅ Bearer | customer | Danh sách ứng viên |
| GET | `/jobs/:id/reviews` | ✅ Bearer | - | Đánh giá của job |
| POST | `/jobs` | ✅ Bearer | customer | Tạo job |
| POST | `/jobs/:id/reviews` | ✅ Bearer | - | Tạo đánh giá (chủ job) |
| POST | `/jobs/:id/select-workers` | ✅ Bearer | customer | Chọn ứng viên |
| PATCH | `/jobs/:id` | ✅ Bearer | customer | Cập nhật job |
| PATCH | `/jobs/:id/complete` | ✅ Bearer | customer | Hoàn thành job |
| PATCH | `/jobs/:id/approve` | ✅ Bearer | admin | Duyệt job |
| DELETE | `/jobs/:id` | ✅ Bearer | customer | Xóa job |

### Query params

#### GET `/jobs`
| Param | Type | Mô tả |
|-------|------|-------|
| lat | number | Bắt buộc |
| lng | number | Bắt buộc |
| radiusKm | number | Mặc định 10 |

#### GET `/jobs/browse`
| Param | Type | Mô tả |
|-------|------|-------|
| search | string | Tìm kiếm |
| status | string hoặc "a,b" | open, partial, full, done |
| minPrice | number | Giá tối thiểu |
| maxPrice | number | Giá tối đa |
| skillTags | string hoặc "a,b" | Kỹ năng |
| lat | number | Vĩ độ |
| lng | number | Kinh độ |
| radiusKm | number | Mặc định 10 |
| sort | string | price_asc, price_desc, date_desc, date_asc, distance |
| page | number | Trang |
| limit | number | Số lượng mỗi trang (tối đa 500) |

#### GET `/jobs/recommended`
| Param | Type | Mô tả |
|-------|------|-------|
| lat | number | Tùy chọn |
| lng | number | Tùy chọn |
| limit | number | Mặc định 20 |
| radiusKm | number | Mặc định 20 |

### Request body

#### POST `/jobs` (tạo job)
```json
{
  "title": "string",
  "description": "string",
  "price": number,
  "location": { "lat": number, "lng": number },
  "address": "string (optional)",
  "scheduledAt": "string (ISO date)",
  "requiredWorkers": number,
  "skillTags": ["string"]  // optional
}
```

#### PATCH `/jobs/:id` (cập nhật job)
Các field tùy chọn, chỉ gửi field cần sửa:
```json
{
  "title": "string",
  "description": "string",
  "price": number,
  "location": { "lat": number, "lng": number },
  "address": "string",
  "scheduledAt": "string",
  "requiredWorkers": number,
  "skillTags": ["string"]
}
```

#### POST `/jobs/:id/select-workers`
```json
{
  "workerIds": ["workerId1", "workerId2"]
}
```

#### POST `/jobs/:id/reviews` (đánh giá thợ – chủ job)
```json
{
  "workerId": "string",
  "rating": number (1–5),
  "comment": "string (optional)"
}
```

---

## 4. Apply API (`/apply`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| POST | `/apply` | ✅ Bearer | worker | Ứng tuyển job |
| GET | `/apply/me` | ✅ Bearer | worker | Đơn ứng tuyển của tôi |
| DELETE | `/apply/:id` | ✅ Bearer | worker | Hủy đơn ứng tuyển |

### POST `/apply` – Request body
```json
{
  "jobId": "string",
  "priceOffer": number  // optional
}
```

---

## 5. Review API (`/review`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/review/job/:jobId` | ✅ Bearer | Danh sách đánh giá của job |
| POST | `/review` | ✅ Bearer | Tạo đánh giá thợ |

### POST `/review` – Request body
```json
{
  "jobId": "string",
  "workerId": "string",
  "rating": number (1–5),
  "comment": "string (optional)"
}
```

---

## 6. Profile API (`/profile`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/profile` | ✅ Bearer | Lấy profile |
| PATCH | `/profile` | ✅ Bearer | Cập nhật profile |
| PATCH | `/profile/change-password` | ✅ Bearer | Đổi mật khẩu |
| POST | `/profile/upload-avatar` | ✅ Bearer | Upload avatar (multipart/form-data) |

### PATCH `/profile` – Request body
```json
{
  "name": "string (optional, 2–50 ký tự)",
  "avatar": "string (optional, URL)",
  "location": { "lat": number, "lng": number }  // optional
}
```

### PATCH `/profile/change-password` – Request body
```json
{
  "currentPassword": "string",
  "newPassword": "string (≥6 ký tự, có chữ hoa + số)",
  "confirmNewPassword": "string (phải trùng newPassword)"
}
```

### POST `/profile/upload-avatar`
- Content-Type: `multipart/form-data`
- Field: `avatar` (file ảnh)

---

## 7. Users API (`/users`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/users/workers` | ✅ Bearer | Danh sách thợ |
| GET | `/users/me` | ✅ Bearer | Thông tin user hiện tại |

### GET `/users/workers` – Query params
| Param | Type | Mô tả |
|-------|------|-------|
| limit | number | 1–50, mặc định 20 |
| search | string | Tìm theo tên hoặc skill |

---

## 8. Chat API (`/chat`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/chat/unread` | ✅ Bearer | Số tin nhắn chưa đọc |
| GET | `/chat/conversations` | ✅ Bearer | Danh sách cuộc hội thoại |
| POST | `/chat/conversations` | ✅ Bearer | Tạo/mở cuộc hội thoại |
| GET | `/chat/conversations/:id/messages` | ✅ Bearer | Tin nhắn trong cuộc hội thoại |
| POST | `/chat/conversations/:id/read` | ✅ Bearer | Đánh dấu đã đọc |
| POST | `/chat/conversations/:id/image` | ✅ Bearer | Gửi ảnh (base64) |

### POST `/chat/conversations` – Request body
```json
{
  "recipientId": "string (bắt buộc)",
  "jobId": "string (optional)"
}
```

### GET `/chat/conversations/:id/messages` – Query params
| Param | Type | Mô tả |
|-------|------|-------|
| page | number | Trang tin nhắn |

### POST `/chat/conversations/:id/image` – Request body
```json
{
  "imageBase64": "string (bắt buộc)",
  "mimeType": "string (optional, mặc định image/jpeg)"
}
```

---

## 9. Notifications API (`/notifications`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/notifications` | ✅ Bearer | Danh sách thông báo |
| GET | `/notifications/unread-count` | ✅ Bearer | Số thông báo chưa đọc |
| PATCH | `/notifications/read-all` | ✅ Bearer | Đánh dấu tất cả đã đọc |
| PATCH | `/notifications/:id/read` | ✅ Bearer | Đánh dấu 1 thông báo đã đọc |
| DELETE | `/notifications/:id` | ✅ Bearer | Xóa thông báo |

### GET `/notifications` – Query params
| Param | Type | Mô tả |
|-------|------|-------|
| page | number | Mặc định 1 |
| limit | number | Mặc định 20 |

---

## 10. Admin API (`/admin`)

Tất cả route yêu cầu: **Authorization: Bearer** + role **admin**.

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/admin/overview` | Thống kê tổng quan |
| GET | `/admin/meta/categories` | Danh mục dịch vụ |
| GET | `/admin/users` | Danh sách user |
| POST | `/admin/users` | Tạo user |
| PATCH | `/admin/users/:id` | Cập nhật user |
| GET | `/admin/jobs` | Danh sách job |
| DELETE | `/admin/jobs/:id` | Xóa job |

### GET `/admin/users` – Query params
| Param | Type | Mô tả |
|-------|------|-------|
| page | number | Mặc định 1 |
| limit | number | Tối đa 500 |
| role | string | Lọc theo role |
| search | string | Tìm kiếm |

### POST `/admin/users` – Request body
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "confirm_password": "string",
  "role": "string (optional)",
  "isVerified": boolean  // optional
}
```

### PATCH `/admin/users/:id` – Request body
```json
{
  "name": "string",
  "email": "string",
  "role": "string",
  "isVerified": boolean,
  "isDeleted": boolean
}
```

### GET `/admin/jobs` – Query params
| Param | Type | Mô tả |
|-------|------|-------|
| page | number | Mặc định 1 |
| limit | number | Mặc định 20 |
| status | string | Lọc theo status |
| search | string | Tìm kiếm |

---

## Tóm tắt Authorization

| Loại API | Header |
|----------|--------|
| Không cần đăng nhập | Không gửi Authorization |
| Cần đăng nhập | `Authorization: Bearer <accessToken>` |
| Admin | `Authorization: Bearer <accessToken>` (user phải có role admin) |
| Customer (tạo/sửa job, chọn ứng viên...) | `Authorization: Bearer <accessToken>` (user phải có role customer) |
| Worker (apply, browse job...) | `Authorization: Bearer <accessToken>` (user phải có role worker) |

---

## Lưu ý

- Content-Type mặc định: `application/json`
- Lỗi thường trả về dạng: `{ "success": false, "message": "..." }` hoặc `{ "message": "..." }`
- Thành công thường có dạng: `{ "success": true, "data": ... }` hoặc `{ "message": "...", "result": ... }`
