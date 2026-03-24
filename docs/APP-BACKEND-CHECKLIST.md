# Checklist App ↔ Backend (Worksy)

Dùng khi **không đăng nhập được**, **ảnh profile không hiện**, hoặc **đổi mật khẩu lỗi**.

## 1. Backend

- [ ] Chạy backend: `cd backend && npm run dev` (hoặc script tương đương), cổng **3000** (hoặc khớp với URL app).
- [ ] Máy chạy backend và điện thoại **cùng Wi‑Fi** (hoặc tunnel phù hợp).
- [ ] Trong MongoDB, user đăng nhập email/password:
  - [ ] Có field `password` (không phải chỉ Google).
  - [ ] `isVerified: true` **hoặc** trên backend bật `ALLOW_UNVERIFIED_LOGIN=true` (chỉ dev).

## 2. App — URL API

- [ ] File `app/.env`: `EXPO_PUBLIC_API_URL=http://<IP_MÁY_BACKEND>:3000` (không dấu `/` cuối).
- [ ] IP là **IP LAN máy chạy Node** (Windows: `ipconfig`; không dùng IP cũ của máy khác).
- [ ] Sau khi sửa `.env`: **`npx expo start -c`** (xóa cache Metro).

## 3. Một nguồn base URL

- [ ] `apiClient`, `config/api.ts` (`API_BASE_URL`), và `services/api.ts` (`BASE_URL` / axios chat, notification, socket) đều dùng cùng logic — **không hardcode IP riêng lẻ**.

## 4. Auth

- [ ] Login: `POST /auth/login` — nếu 401 do “chưa verify”, xử lý verify email hoặc `ALLOW_UNVERIFIED_LOGIN`.
- [ ] Refresh token: `POST /auth/refresh-token` (không gọi refresh khi đang ở màn login / register / forgot-password).
- [ ] Google: luồng chính là **WebBrowser + redirect** (`LoginScreen`), không phải `authService.googleLogin` (endpoint POST tương ứng có thể không tồn tại).

## 5. Profile & avatar

- [ ] Avatar từ API dạng `/uploads/...` → app ghép `API_BASE_URL` (đã xử lý ở `ProfileScreen` / `EditProfileScreen`).
- [ ] Đổi mật khẩu: backend phải load `password` khi so sánh bcrypt (`changePasswordService` dùng `.select("+password")`).

## 6. Nhanh — lỗi thường gặp

| Hiện tượng | Gợi ý |
|------------|--------|
| Network error / timeout | Sai IP, backend tắt, firewall chặn cổng 3000 |
| 401 sau login | Email chưa verify; hoặc interceptor refresh gọi sai (đã loại trừ path auth công khai) |
| Ảnh đại diện trắng | URL tương đối chưa ghép base URL |
| Đổi MK luôn sai MK cũ | Backend không select `password` (đã sửa) |
