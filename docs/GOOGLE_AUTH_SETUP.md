# Google Sign-In (Expo + Node) — cấu hình & checklist

## Vì sao trước đây bị “localhost” / không quay lại app?

Luồng **cũ**: mở `WebBrowser.openAuthSessionAsync(API/auth/google?returnUrl=...)`.

1. Backend dùng `CLIENT_URL` (thường `http://localhost:3000`) làm **redirect_uri** gửi lên Google.
2. Google chỉ chấp nhận redirect URI đã đăng ký — nếu lệch IP/host → lỗi hoặc hành vi lạ.
3. Sau khi Google gọi callback về **máy chủ**, server `redirect` về `returnUrl` (deep link Expo). Trên **điện thoại thật**, `localhost` trên server là máy chạy Node, không phải điện thoại; nếu cấu hình sai, trình duyệt trong app có thể dừng ở trang web `localhost` thay vì mở lại scheme `exp://` / `worksy://`.
4. Deep link + query token dài dễ bị OS/browser cắt hoặc không khớp `openAuthSession` nếu URL không khớp chính xác.

**Luồng mới (khuyến nghị):** `expo-auth-session` + `Google.useAuthRequest` → lấy **id_token** → `POST /auth/google-token` → backend `verifyIdToken` → trả JWT. **Không** phụ thuộc redirect OAuth hai lần qua backend cho mobile.

---

## `useProxy: true` (Expo Auth Session)

Trên **Expo SDK 48+**, tùy chọn `promptAsync({ useProxy: true })` đã **bị loại bỏ**. Dùng `makeRedirectUri()` (qua options thứ 2 của `useAuthRequest`, ví dụ `{ path: 'auth' }`) để khớp scheme trong `app.json` (`scheme: "worksy"`).

---

## Google Cloud Console

### OAuth client — Web (bắt buộc cho server redirect flow & thường dùng chung)

- Loại: **Web application**
- **Authorized redirect URIs** (nếu vẫn dùng `GET /auth/google/callback`):
  - `http://localhost:3000/auth/google/callback` (dev)
  - `https://your-api-domain.com/auth/google/callback` (prod)
- Lưu **Client ID** + **Client Secret** → backend `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### OAuth client — iOS (Expo Go / build iOS)

- Loại: **iOS**
- Bundle ID: với **Expo Go** thường là `host.exp.exponent` (xác nhận theo phiên bản Expo); với **dev client / store** dùng bundle ID thật của app.
- Lưu Client ID → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (app) và `GOOGLE_IOS_CLIENT_ID` (backend audience)

### OAuth client — Android

- Loại: **Android**
- Package name + SHA-1 chứng chỉ ký (debug / EAS) theo [tài liệu Expo / Google Sign-In](https://react-native-google-signin.github.io/docs/setting-up/expo)
- Lưu Client ID → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` và `GOOGLE_ANDROID_CLIENT_ID`

### Redirect URI cho `expo-auth-session` (native)

`makeRedirectUri({ path: 'auth' })` tạo URI kiểu:

- Dev client / production: `worksy://auth` (theo `scheme` trong `app.json`)
- Expo Go: `exp://<host>:8081/--/auth` (hoặc tương đương)

Với client **iOS/Android** trên Google Cloud, redirect này được xử lý theo loại client; với **Web** client bạn phải thêm **chính xác** URI đó vào “Authorized redirect URIs” nếu dùng web client id trên native (thường **không** khuyến nghị — nên tách đủ 3 client).

---

## Biến môi trường

### App (`app/.env`)

```env
EXPO_PUBLIC_API_URL=http://<LAN-IP>:3000
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web-client-id>.apps.googleusercontent.com
# Hoặc dùng tên cũ:
# EXPO_PUBLIC_GOOGLE_CLIENT_ID=<web-client-id>.apps.googleusercontent.com

EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<ios-client-id>.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<android-client-id>.apps.googleusercontent.com
```

Sau khi sửa: `npx expo start -c`

### Backend (`.env`)

```env
# Web OAuth (flow redirect /auth/google — tùy chọn)
GOOGLE_CLIENT_ID=<web-client-id>
GOOGLE_CLIENT_SECRET=<web-secret>
CLIENT_URL=http://localhost:3000

# verifyIdToken audience (bắt buộc cho POST /auth/google-token)
GOOGLE_WEB_CLIENT_ID=<web-client-id>
GOOGLE_IOS_CLIENT_ID=<ios-client-id>
GOOGLE_ANDROID_CLIENT_ID=<android-client-id>
```

`loginWithGoogleIdToken` chấp nhận **mọi** audience đã khai báo (trùng `aud` trong JWT).

---

## API

| Method | Path | Mô tả |
|--------|------|--------|
| `POST` | `/auth/google-token` | Body `{ "idToken": "..." }` — dùng cho Expo |
| `GET` | `/auth/google` | Bắt đầu OAuth web (redirect) |
| `GET` | `/auth/google/callback` | Callback Google → redirect deep link (dễ vướng localhost trên mobile) |

---

## “Access blocked” / “This app’s request is invalid” / Error 403

Google chặn đăng nhập vì **cấu hình project**, không phải bug code Node/Expo.

### 1. OAuth consent screen — chế độ **Testing** (hay gặp nhất)

Nếu **Publishing status = Testing**, chỉ các **Test users** được phép đăng nhập.

1. Vào [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **OAuth consent screen**.
2. Kéo xuống **Test users** → **Add users** → thêm **đúng Gmail** bạn dùng trên điện thoại khi bấm “Continue with Google”.
3. Lưu, đợi vài phút rồi thử lại.

Muốn ai cũng đăng nhập được: chuyển app sang **In production** (có thể cần xác minh app nếu dùng scope “nhạy cảm”).

### 2. Loại User

- **Internal**: chỉ tài khoản **cùng Google Workspace** (công ty) mới vào được. Gmail cá nhân sẽ bị chặn.  
  → Chọn **External** nếu app dùng cho người dùng phổ thông.

### 3. Sai OAuth client (Web vs iOS vs Android)

- Trên **iPhone** phải dùng **iOS OAuth client ID** trong `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (không dùng nhầm chỉ Web client nếu Google báo lỗi / chặn).
- Trên **Android** tương tự với **Android client** + đúng **package name** + **SHA-1** (debug / release).
- Trong backend, mọi client ID đó phải có trong biến audience (`GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`, …).

### 4. `redirect_uri_mismatch`

Redirect URI từ app phải **trùng** URI đã khai báo cho **đúng loại** client trên Google (Web client cần khai báo URI dạng `https://...`; native dùng custom scheme theo client iOS/Android).

### 5. APIs

Bật **Google People API** hoặc đảm bảo project đã bật các API Google yêu cầu cho OAuth (thường People API cho profile).

---

## Checklist nhanh

- [ ] `app.json` có `scheme` ổn định (vd. `worksy`), khớp deep link.
- [ ] `WebBrowser.maybeCompleteAuthSession()` gọi một lần khi khởi động app (đã có trong `App.tsx`).
- [ ] Google Cloud: đủ Web / iOS / Android client theo môi trường bạn chạy (Expo Go vs dev client).
- [ ] Backend: mọi Client ID dùng trên app nằm trong `GOOGLE_*` audience.
- [ ] Không dùng `localhost` làm `CLIENT_URL` khi test **điện thoại thật** trừ khi tunnel/ngrok và redirect URI đã đăng ký đúng host công khai.
- [ ] Sau đổi env hoặc `app.json`: clear cache Metro (`expo start -c`).

---

## `app.json` — `owner` / `slug`

Chỉ cần cho một số dịch vụ Expo cũ (hosted redirect). Với luồng `id_token` + scheme cục bộ, **slug/owner** không bắt buộc cho Google; vẫn nên đặt `slug` rõ ràng cho dự án.
