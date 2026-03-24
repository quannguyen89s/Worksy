# Worksy Backend — Hướng dẫn chạy, chèn dữ liệu & test

## Yêu cầu

- **Node.js** 18+
- **MongoDB** chạy local hoặc Atlas (chuỗi kết nối trong `.env`)

## Cài đặt & chạy

```bash
cd backend
npm install
npm run dev
```

Mặc định server lắng nghe cổng trong `.env` (ví dụ `PORT=3000`).

### Biến môi trường (`.env`)

| Biến | Mô tả |
|------|--------|
| `PORT` | Cổng HTTP + Socket.io (ví dụ `3000`) |
| `MONGO_URI` | Chuỗi kết nối MongoDB |
| `JWT_SECRET` | Secret ký/verify JWT (phải khớp khi tạo token test) |

---

## Lấy JWT để test (đăng nhập API)

Sau khi có user trong DB (ví dụ đã `npm run seed`), gọi **POST** `/auth/login`:

```http
POST /auth/login
Content-Type: application/json

{
  "email": "customer@worksy.test",
  "password": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "customer@worksy.test",
    "name": "Nguyễn Khách (Customer)",
    "role": "customer"
  }
}
```

Dùng `token` trong các API cần bảo vệ:

```http
Authorization: Bearer <token>
```

**Ví dụ curl:**

```bash
curl -X POST http://localhost:3000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"worker@worksy.test\",\"password\":\"123456\"}"
```

---

## Seed dữ liệu mẫu (khuyên dùng)

Script tạo sẵn **User, Job, Application, Conversation, Message, Notification** — mật khẩu bcrypt: **`123456`**.

```bash
cd backend
npm run seed
```

- Mặc định: **xoá** các collection liên quan rồi **chèn lại** (tránh trùng email).
- Chỉ chèn thêm (không xoá): `npm run seed -- --append` — dễ lỗi trùng email nếu đã có dữ liệu.

Sau khi chạy, terminal in ra `_id` user để tạo JWT. Email test:

| Vai trò   | Email               |
|-----------|---------------------|
| Customer  | `customer@worksy.test` |
| Worker    | `worker@worksy.test`   |
| Worker 2  | `worker2@worksy.test`  |

---

## Chèn dữ liệu (MongoDB)

API `/chat` và `/notifications` cần **JWT** (`Authorization: Bearer <token>`). **Cách nhanh:** dùng **`POST /auth/login`** (mục trên). Hoặc tạo user trong DB rồi tự ký JWT (phần dưới).

### Cách 1: MongoDB Compass

1. Kết nối tới `MONGO_URI` (ví dụ `mongodb://127.0.0.1:27017/PROJECT`).
2. Chọn database (ví dụ `PROJECT`) → collection **`users`** → **Add Data** → **Insert Document**.

Ví dụ (Compass sẽ tự sinh `_id` — **copy `_id` sau khi insert** để dùng trong JWT):

```json
{
  "name": "Người thuê A",
  "email": "customer@test.com",
  "password": "hashed_or_plain_for_demo_only",
  "role": "customer",
  "avatar": ""
}
```

Tạo thêm một user `worker`:

```json
{
  "name": "Thợ B",
  "email": "worker@test.com",
  "password": "hashed_or_plain_for_demo_only",
  "role": "worker",
  "avatar": ""
}
```

> **Lưu ý:** Trường `password` trong model là bắt buộc; khi đã có API auth thì nên lưu bcrypt. Chỉ test API chat/notifications thì chỉ cần user có `_id` hợp lệ.

### Cách 2: `mongosh`

```javascript
use PROJECT

db.users.insertMany([
  {
    name: "Người thuê A",
    email: "customer@test.com",
    password: "demo",
    role: "customer",
    avatar: ""
  },
  {
    name: "Thợ B",
    email: "worker@test.com",
    password: "demo",
    role: "worker",
    avatar: ""
  }
])

// Lấy _id để tạo token
db.users.find({}, { email: 1 }).pretty()
```

Copy chuỗi `_id` (dạng ObjectId) của từng user.

---

## Tạo JWT để test

Token phải chứa **`id`** (string của ObjectId) và **`role`** (`customer` | `worker`), ký bằng đúng `JWT_SECRET` trong `.env`.

### Dùng Node (trong thư mục `backend`)

Thay `USER_ID_STRING` bằng `_id` từ MongoDB (chuỗi 24 ký tự hex):

```bash
node -e "console.log(require('jsonwebtoken').sign({ id: 'USER_ID_STRING', role: 'customer' }, process.env.JWT_SECRET || '123456@'))"
```

Hoặc set secret tạm:

```bash
set JWT_SECRET=123456@
node -e "console.log(require('jsonwebtoken').sign({ id: 'YOUR_USER_ID', role: 'customer' }, '123456@'))"
```

(Linux/macOS: `export JWT_SECRET=...`)

### Dùng [jwt.io](https://jwt.io)

- Payload: `{ "id": "<_id user>", "role": "customer" }`
- Secret: giống `JWT_SECRET` trong `.env`

---

## Test REST API

Base URL: `http://localhost:3000` (hoặc `PORT` của bạn).

Header mọi request cần bảo vệ:

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

### Kiểm tra server

```http
GET /
```

Kỳ vọng: `"Connect succesfull"` (hoặc JSON tương đương).

### Chat

| Method | Đường dẫn | Body / Query |
|--------|-----------|--------------|
| `GET` | `/chat/unread` | — |
| `GET` | `/chat/conversations` | — |
| `POST` | `/chat/conversations` | `{ "recipientId": "<_id user kia>", "jobId": "<optional>" }` |
| `GET` | `/chat/conversations/:id/messages?page=1` | — |
| `POST` | `/chat/conversations/:id/read` | — |

**Ví dụ curl (PowerShell dùng `curl.exe` hoặc `Invoke-RestMethod`):**

```bash
curl -X GET "http://localhost:3000/chat/conversations" ^
  -H "Authorization: Bearer YOUR_JWT" ^
  -H "Content-Type: application/json"
```

```bash
curl -X POST "http://localhost:3000/chat/conversations" ^
  -H "Authorization: Bearer YOUR_JWT" ^
  -H "Content-Type: application/json" ^
  -d "{\"recipientId\":\"OTHER_USER_ID\",\"jobId\":null}"
```

### Notifications

| Method | Đường dẫn |
|--------|-----------|
| `GET` | `/notifications` |
| `GET` | `/notifications/unread-count` |
| `PATCH` | `/notifications/read-all` |
| `PATCH` | `/notifications/:id/read` |
| `DELETE` | `/notifications/:id` |

---

## Test Socket.io (realtime chat + notification)

Client kết nối Socket.io **cùng host/port** với API, và gửi JWT khi handshake.

**Cách gửi token:**

- `auth: { token: "<JWT>" }`, hoặc
- Header `Authorization: Bearer <JWT>` (tùy client)

### Sự kiện chính (client → server)

| Event | Payload |
|-------|---------|
| `join_conversation` | `conversationId` (string) |
| `leave_conversation` | `conversationId` |
| `send_message` | `{ "conversationId", "content", "type"?: "text"\|"image"\|"file" }` |
| `typing` | `conversationId` |
| `stop_typing` | `conversationId` |
| `mark_read` | `conversationId` |

### Sự kiện server → client

| Event | Ý nghĩa |
|-------|---------|
| `new_message` | Tin nhắn mới |
| `user_typing` / `user_stop_typing` | Trạng thái gõ |
| `messages_read` | Đã đọc |
| `notification` | Thông báo (ví dụ tin nhắn mới) |

**Script test nhanh** (cài thêm: `npm install socket.io-client`):

```javascript
// test-socket.mjs — chạy: node test-socket.mjs
import { io } from "socket.io-client";

const TOKEN = "YOUR_JWT_HERE";

const socket = io("http://localhost:3000", {
  auth: { token: TOKEN },
});

socket.on("connect", () => console.log("connected", socket.id));
socket.on("new_message", (msg) => console.log("new_message", msg));
socket.on("notification", (n) => console.log("notification", n));
socket.on("connect_error", (err) => console.error(err.message));

// Sau khi có conversationId từ API POST /chat/conversations:
// socket.emit("join_conversation", "CONVERSATION_ID");
// socket.emit("send_message", { conversationId: "...", content: "Xin chào" });
```

---

## Build production

```bash
npm run build
npm start
```

(Lưu ý: `start` trong `package.json` trỏ tới `dist/index.js` — nếu cần, đổi thành `node dist/index.js` sau khi build.)

---

## Gợi ý xử lý lỗi thường gặp

| Lỗi | Cách xử lý |
|-----|------------|
| `EADDRINUSE` port 3000 | Đóng process đang dùng port (Task Manager / `Get-NetTCPConnection -LocalPort 3000` rồi `Stop-Process`) hoặc đổi `PORT` trong `.env`. |
| `401 Unauthorized` | Kiểm tra JWT đúng secret, payload có `id` và `role`. |
| Mongo không kết nối | Kiểm tra MongoDB đã chạy và `MONGO_URI` đúng. |
