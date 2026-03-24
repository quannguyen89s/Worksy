# Worksy — Đặc tả tái lập (Marketplace dịch vụ khách hàng / thợ)

**Đường dẫn file:** `docs/WORKSY-MARKETPLACE-SPEC.md` (trong monorepo Worksy).

Tài liệu này mô tả **logic nghiệp vụ, API REST, schema dữ liệu, realtime Socket.IO** của dự án Worksy để bạn có thể **làm lại từ đầu** trên repo khác mà vẫn giữ cùng hành vi.

---

## 1. Tổng quan domain

- **Customer (khách)**: đăng việc (`Job`), xem ứng viên đã ứng tuyển, chọn thợ, đánh dấu hoàn thành, đánh giá thợ.
- **Worker (thợ)**: xem việc gần mình / gợi ý, ứng tuyển (có thể kèm giá đề xuất), huỷ đơn khi còn `pending`, chat với khách khi đã được gán việc.
- **Vị trí**: mọi user có `location: { lat, lng }`. Việc có `location` + `skillTags`. Thợ có `skills[]` phục vụ gợi ý việc.
- **Trạng thái việc (`Job.status`)**:
  - `open`: chưa ai / chưa đủ thợ.
  - `partial`: đã gán một phần, chưa đủ `requiredWorkers`.
  - `full`: đủ số thợ cần.
  - `done`: khách đã bấm hoàn thành.
- **Đơn ứng tuyển (`Apply.status`)**: `pending` → `accepted` / `rejected` (khi khách chọn thợ). Mỗi cặp `(jobId, workerId)` **duy nhất**.

---

## 2. Stack gợi ý (backend)

- Node.js + **Express 5**
- **MongoDB** + **Mongoose**
- **JWT** (`Authorization: Bearer`) cho REST
- **Socket.IO** gắn chung **HTTP server** (cùng `PORT`), CORS đồng bộ với Express
- `bcryptjs` hash mật khẩu
- `dotenv` load biến môi trường

---

## 3. Biến môi trường

| Biến | Ý nghĩa |
|------|---------|
| `MONGO_URI` | Chuỗi kết nối MongoDB |
| `JWT_SECRET` | Bí mật ký JWT (bắt buộc) |
| `PORT` | Cổng HTTP (vd. `3000`) |
| `HOST` | Nên `0.0.0.0` khi dev để Expo/điện thoại trong LAN gọi được qua IP máy |
| `CORS_ORIGIN` | Tuỳ chọn: để trống hoặc không set → phản chiếu mọi origin (tiện dev). Production: danh sách origin cách nhau dấu phẩy |

---

## 4. Schema MongoDB

### 4.1. `User`

- `name`, `email` (unique, lowercase), `password` (lưu hash, **không** trả về client — dùng `select: false` khi cần)
- `role`: `"customer"` | `"worker"`
- `rating`: number, mặc định ~`3.5`, cập nhật lại sau khi có review
- `completedJobs`: số việc đã hoàn thành (tăng khi job `done`)
- `location`: `{ lat, lng }` bắt buộc
- `skills`: `string[]`, chủ yếu cho worker + gợi ý việc

### 4.2. `Job`

- `title`, `description`, `price` (VND), `location`, `skillTags[]`
- `requiredWorkers` (≥ 1), `assignedWorkers`, `assignedWorkerIds[]`
- `status`: `open` | `partial` | `full` | `done`
- `createdBy`: ref User (customer)

### 4.3. `Apply`

- `jobId`, `workerId`, `priceOffer?`, `status`: `pending` | `accepted` | `rejected`
- Unique index `(jobId, workerId)`

### 4.4. `Review`

- `jobId`, `workerId`, `customerId`, `rating` (0–5), `comment?`
- Unique `(jobId, workerId)` — một khách chỉ đánh giá một thợ cho một việc một lần

### 4.5. `ChatMessage`

- `jobId`, `fromUserId`, `toUserId`, `text` (giới hạn độ dài hợp lý)
- Lưu DB + broadcast qua Socket.IO tới room `job:<jobId>`

---

## 5. JWT

- Payload gợi ý: `{ sub: userId, role, name }` (hoặc tương đương).
- Thời hạn: ví dụ `7d`.
- REST: header `Authorization: Bearer <token>`.
- Socket.IO: client gửi `auth: { token }` lúc connect; server verify và gắn `socket.data.userId`.

---

## 6. REST API — Chuẩn response

- Thành công thường: `{ success: true, data: ... }`
- Lỗi: middleware thống nhất (vd. `{ success: false, message }` + HTTP status)

Base path ví dụ: `/auth`, `/jobs`, `/apply`, `/review`, thêm `GET /health` → `{ ok: true }`.

### 6.1. Auth (`/auth`)

| Method | Path | Auth | Body | Ghi chú |
|--------|------|------|------|---------|
| POST | `/auth/register` | Không | `name`, `email`, `password`, `role`, `location{lat,lng}`, `skills?` (array, worker) | Trả `token` + object user (không password) |
| POST | `/auth/login` | Không | `email`, `password` | Trả `token` + user |

### 6.2. Jobs (`/jobs`)

| Method | Path | Auth | Role | Ghi chú |
|--------|------|------|------|---------|
| GET | `/jobs` | Không | — | Query: `lat`, `lng`, `radiusKm?` (mặc định 10). Trả việc trong bán kính, kèm `distanceKm`, sort theo khoảng cách |
| GET | `/jobs/:id` | Không | — | Chi tiết job |
| POST | `/jobs` | Có | customer | Body: `title`, `description`, `price`, `location`, `requiredWorkers`, `skillTags?` |
| GET | `/jobs/mine` | Có | customer | Việc do user đăng |
| GET | `/jobs/recommended` | Có | worker | Query: `lat?`, `lng?`, `limit?`. Trả việc `open`/`partial` kèm `distanceKm`, `recommendationScore` |
| GET | `/jobs/:id/applicants` | Có | customer | Danh sách ứng viên **đã rank** (xem §8) |
| POST | `/jobs/:id/select-workers` | Có | customer | Body: `workerIds: string[]`. Chọn thợ trong các đơn `pending`; cập nhật `Apply`, `assignedWorkers`, `assignedWorkerIds`, `status` job |
| PATCH | `/jobs/:id/complete` | Có | customer | Đánh dấu `done`, tăng `completedJobs` cho mọi thợ đã gán |

**Lưu ý thứ tự route Express**: các path tĩnh (`/recommended`, `/mine`) phải khai báo **trước** `/:id` để không bị nuốt nhầm.

### 6.3. Apply (`/apply`)

| Method | Path | Auth | Role | Ghi chú |
|--------|------|------|------|---------|
| POST | `/apply` | Có | worker | Body: `jobId`, `priceOffer?`. Không cho apply nếu job `full` / `done`. Trùng ứng tuyển → 409 |
| DELETE | `/apply/:id` | Có | worker | Huỷ đơn; chỉ khi `pending` và đúng owner |
| GET | `/apply/me` | Có | worker | Danh sách đơn của worker, populate thông tin job (tiêu đề, trạng thái việc, …) |

### 6.4. Review (`/review`)

| Method | Path | Auth | Role | Body | Ghi chú |
|--------|------|------|------|------|---------|
| POST | `/review` | Có | customer | `jobId`, `workerId`, `rating`, `comment?` | Chỉ khi job `done`, worker phải nằm trong `assignedWorkerIds`. Cập nhật lại `User.rating` (avg) |

---

## 7. Luồng nghiệp vụ chính

1. **Đăng việc**: Customer tạo job → có thể **push realtime** `job:nearby` tới các worker trong bán kính cố định (vd. 10 km) so với `job.location`.
2. **Ứng tuyển**: Worker tạo `Apply` pending → có thể emit `apply:new` cho customer (owner job).
3. **Xếp hạng ứng viên**: Customer gọi `GET .../applicants` → server join Apply + User, tính **score** (§8), sort giảm dần.
4. **Chọn thợ**: `select-workers` với mảng `workerIds`:
   - Chỉ xử lý các đơn **pending** khớp worker trong list.
   - Số slot còn lại = `requiredWorkers - assignedWorkers`.
   - Chọn tối đa `remaining` người, **ưu tiên theo score** trong tập được chọn.
   - Người được chọn → `accepted`, còn lại pending → `rejected`.
   - Cập nhật `assignedWorkerIds`, `assignedWorkers`, `status` (`open`/`partial`/`full`).
5. **Hoàn thành**: `complete` → `status = done`, mỗi assigned worker `completedJobs += 1`.
6. **Đánh giá**: `POST /review` → insert Review, trùng `(jobId, workerId)` → 409; cập nhật rating trung bình worker.

---

## 8. Công thức điểm

### 8.1. Rank ứng viên (`calculateScore`)

Input: worker (`rating`, `completedJobs`, `location`), job (`price`, `location`), optional `priceOffer`.

Gợi ý công thức (số cao hơn = tốt hơn):

- Chuẩn hoá rating vào [0, 5].
- Giới hạn `completedJobs` khi tính điểm (vd. cap 100) để không lấn át.
- Khoảng cách Haversine worker–job (km), cap (vd. 50 km).
- Giá hiệu dụng = `priceOffer ?? job.price`, penalty tuyến tính (vd. `price * 0.01`).

Ví dụ:

`score = rating * 3 + min(completedJobs, cap) * 0.5 - min(distanceKm, 50) - effectivePrice * 0.01`

### 8.2. Gợi ý việc cho worker (`recommendationScore`)

Với mỗi job `open`/`partial`:

- `distanceKm` từ worker (query `lat/lng` hoặc profile).
- `skillScore`: overlap `skillTags` vs `skills` (không phân biệt hoa thường), chuẩn hoá theo số tag.
- `priceScore`: hàm giảm theo `job.price` (ví dụ `1 / (1 + price/500)`).
- `distancePenalty`: `min(distanceKm, 50) / 50`.
- Kết hợp trọng số (ví dụ): `skillScore * 10 + priceScore * 3 - distancePenalty * 4`, làm tròn 3 chữ số thập phân.

Sort `recommendationScore` giảm dần, `limit` mặc định (vd. 20).

### 8.3. Khoảng cách

**Haversine** (bán kính Trái Đất ~6371 km) giữa hai cặp `(lat, lng)`.

---

## 9. Socket.IO

### 9.1. CORS

Dùng **cùng logic** với Express (`origin`, `credentials: true`).

### 9.2. Đăng ký user ↔ socket

Map `userId` → một hoặc nhiều `socket.id` (nhiều thiết bị/tab).

### 9.3. Events gợi ý

| Hướng | Event | Payload / hành vi |
|--------|--------|-------------------|
| Server → worker | `job:nearby` | `{ jobId }` — khi có job mới gần worker |
| Server → customer | `apply:new` | `{ jobId, applyId }` — worker vừa ứng tuyển |
| Client → server | `job:join` | `jobId` + callback ack. Chỉ cho phép nếu user là **owner** hoặc nằm trong `assignedWorkerIds` |
| Client → server | `chat:message` | `{ jobId, toUserId, text }` — validate quyền như trên + `toUserId` phải là đối tác hợp lệ của job |
| Server → room | `chat:message` | Broadcast message đã lưu DB tới room `job:<jobId>` |

---

## 10. Gợi ý client (Expo / React Native)

- Base URL API: `http://<IP_LAN>:<PORT>` (Android emulator có thể dùng `10.0.2.2` trỏ máy host).
- Socket.IO client: cùng URL, `auth: { token }`, reconnect khi token đổi.
- Màn hình gợi ý:
  - Home worker: `GET /jobs?lat&lng`, `GET /jobs/recommended`, realtime banner `job:nearby`.
  - Customer: `POST /jobs`, `GET /jobs/mine`, `GET .../applicants`, `POST .../select-workers`, `PATCH .../complete`.
  - Worker: `POST /apply`, `GET /apply/me`, `DELETE /apply/:id`.

---

## 11. Cấu trúc thư mục backend (tham chiếu)

```
src/
  config/       # db, corsOptions
  controllers/  # map HTTP → service
  middleware/   # auth, error
  models/       # mongoose schemas
  routes/       # mount path → controller
  services/     # business logic + transaction
  sockets/      # initSocket, registry, emit helpers
  utils/        # distance, scoring, AppError, asyncHandler, mongo helpers
  types/        # express augment, shared TS types
  seed/         # optional seed data
  index.ts      # connect DB, createServer(app), initSocket, listen HOST/PORT
  server.ts     # express app, cors, json, routes, 404, error middleware
```

---

## 12. Checklist khi làm lại project mới

- [ ] Một file entry duy nhất build ra `dist/index.js` (hoặc tương đương), **không** gọi `listen` trong `server.ts` nếu muốn dùng chung HTTP + Socket.IO.
- [ ] `HOST=0.0.0.0` khi cần test thiết bị thật.
- [ ] Thứ tự route: `/jobs/recommended`, `/jobs/mine` trước `/jobs/:id`.
- [ ] Index unique `(jobId, workerId)` trên Apply.
- [ ] Transaction (Mongo session) khi `select-workers` để tránh race condition.
- [ ] Password field `select: false`; login dùng `.select("+password")`.

---

*Tài liệu phản ánh thiết kế marketplace Worksy (customer/worker, job/apply/review/chat, scoring & recommendations, Socket.IO). Chỉnh sửa nhẹ nếu bạn đổi quy tắc nghiệp vụ trên project mới.*
