# Worker Apply Flow Check

Tai lieu check nhanh 3 luong ban yeu cau:
- Worker tim job va apply
- Cancel apply
- View applicants

## 1) Worker tim job -> Apply Job

### Route lien quan
- `GET /jobs/browse` (worker)
- `GET /jobs/recommended` (worker)
- `POST /apply` (worker)

### Ket qua check
- [x] Worker co endpoint tim job (`/jobs/browse`, `/jobs/recommended`)
- [x] Worker co endpoint apply (`POST /apply`)
- [x] Co chan apply trung (Mongo unique index + bat loi `11000` -> `409 Already applied`)
- [ ] Chua chan apply vao job `pending` (hien chi chan `full`/`done`)
- [ ] Browse dang default gom ca `full` (`open`, `partial`, `full`) -> co the nhin thay viec khong con slot

### Danh gia
- **Trang thai hien tai:** Chay duoc co ban, nhung chua an toan ve nghiep vu moderation.
- **Can fix uu tien:** Chan `pending` trong `createApply`, can nhac bo `full` khoi danh sach browse mac dinh.

---

## 2) Cancel Apply

### Route lien quan
- `DELETE /apply/:id` (worker)

### Ket qua check
- [x] Chi worker moi goi duoc route
- [x] Chi owner cua application moi huy duoc (`403` neu khac owner)
- [x] Chi huy duoc khi `status = pending` (`400` neu accepted/rejected)
- [x] Xu ly `404` neu khong tim thay application

### Danh gia
- **Trang thai hien tai:** On, dung logic nghiep vu.
- **Rui ro con lai:** Chua co test tu dong de khoa regression.

---

## 3) View Applicants

### Route lien quan
- `GET /jobs/:id/applicants`

### Ket qua check
- [x] Endpoint da co
- [x] Da rank ung vien theo score
- [x] Chi owner cua job duoc xem danh sach
- [ ] Route nay la **customer-only**, worker khong duoc xem

### Danh gia
- **Trang thai hien tai:** Dung theo mo hinh marketplace (customer xem applicants).
- **Luu y nghiep vu:** Neu ban muon worker cung xem mot phan danh sach ung vien, can mo rong permission + quy tac an du lieu.

---

## Tong ket nhanh

- **Apply Job:** Co, nhung con 2 diem can chot/fix (`pending`, `full` trong browse).
- **Cancel Apply:** On.
- **View Applicants:** Co, nhung danh cho customer (khong phai worker).

## De xuat buoc tiep theo

1. Fix `createApply` de chan `pending`.
2. Chot rule co hien thi job `full` trong browse hay khong.
3. Viet test cho 3 luong tren (it nhat happy path + permission + invalid status).
