# Seed tài khoản Worker (MongoDB)

## Chạy

```bash
cd backend
npm run seed:workers
```

Cần file `backend/.env` có `MONGO_URI` trỏ đúng database đang dùng cho app.

## Sau khi seed

- **12** user `role: worker`, `isVerified: true`, có `name`, `email`, `skills`, `rating`, `completedJobs`, `location`.
- **Mật khẩu** (tất cả): `Worker@123`  
  - Đổi bằng biến môi trường: `SEED_WORKER_PASSWORD=YourPass npm run seed:workers`

## Email đăng nhập (ví dụ)

| Email | Kỹ năng chính |
|-------|----------------|
| `seed.worker.minh@example.com` | Điện lạnh, điện dân dụng |
| `seed.worker.huong@example.com` | Dọn dẹp, vệ sinh |
| `seed.worker.anh@example.com` | Mộc, sửa chữa |
| … | Toàn bộ danh sách trong `backend/src/scripts/seedWorkers.ts` → `WORKER_SEED_ENTRIES` |

Chạy lại `npm run seed:workers` sẽ **cập nhật** lại profile + mật khẩu cho các email seed (upsert).

## Hiển thị trên app (customer)

- API: `GET /users/workers` (Bearer token, role customer) — trả danh sách thợ: tên, rating, `completedJobs`, skills, avatar.
- Trang chủ **customer** trong app gọi API này để list **Thợ nổi bật** (kéo xuống để refresh).

## File nguồn

`backend/src/scripts/seedWorkers.ts` — có thể sửa thêm/bớt phần tử trong `WORKER_SEED_ENTRIES` cho đúng nghiệp vụ.
