# Job Completion Flow Check

Tai lieu nay follow format cua `docs/WORKER-APPLY-FLOW-CHECK.md` de chuan bi code cho luong:
- Customer tao job, worker apply va duoc chon
- Job hoan thanh theo 2 cach:
  1) Customer bam set done thu cong
  2) He thong tu set done sau mot khoang thoi gian

## 1) Muc tieu nghiep vu

- [x] Co co che `manual done`: customer chu dong set done
- [x] Co co che `auto done`: qua timeout thi job tu chuyen done
- [x] Worker va customer deu thay duoc trang thai completion ro rang
- [x] Dam bao idempotent: set done nhieu lan khong bi sai so lieu

---

## 2) Luong tong quan can dat

### Step 1: Tao job va xu ly apply
- Customer tao job
- Worker apply job
- Customer xem applicants va select worker
- Job chuyen trang thai theo slot (`open` -> `partial`/`full`)

### Step 2: Bat dau completion window
- Khi da co worker duoc assign (thuong la `full`, hoac `partial` neu cho phep), job vao giai doan cho hoan thanh
- Luu moc thoi gian de tinh auto done:
  - `completionDueAt` (deadline auto done)
  - hoac `acceptedAt` + `autoDoneAfterHours`

### Step 3A: Manual done (customer)
- Customer goi endpoint set done
- He thong:
  - set `status = done`
  - set `completedAt`
  - tang `completedJobs` cho assigned workers (1 lan duy nhat)
  - khoa cac hanh dong khong hop le sau done (apply, select-workers, cancel apply lien quan)

### Step 3B: Auto done (system)
- Job scheduler quet cac job chua done, qua han `completionDueAt`
- He thong tu dong set done voi logic tuong tu manual done
- Danh dau nguon completion: `completionSource = "auto"`

---

## 3) API/Model de xuat bo sung

### API de xuat
- [x] `PATCH /jobs/:id/complete` (da co) -> giu cho manual done
- [x] Internal job scheduler (cron/queue worker):
  - Khong can public API
  - Hoac endpoint noi bo duoc protect ky (neu can trigger thu cong)

### Field de xuat tren `Job`
- [x] `completedAt?: Date`
- [x] `completionDueAt?: Date`
- [x] `completionSource?: "manual" | "auto"`
- [x] `autoDoneAfterHours?: number` (neu muon cau hinh theo job/tenant)

---

## 4) Rule nghiep vu can chot truoc khi code

- [x] Khi nao bat dau dem auto done?
  - Lua chon A: ngay khi co it nhat 1 worker duoc nhan (DA AP DUNG)
  - Lua chon B: chi khi job dat `full`
- [ ] Co cho customer gia han completion window khong?
- [ ] Co gui thong bao truoc khi auto done khong? (vd. truoc 24h)
- [x] Sau khi auto done, customer con duoc review worker nhu manual done khong? (nen: co)
- [ ] Neu job dang tranh chap/khieu nai, co tam dung auto done khong?

---

## 5) Kiem tra tinh dung (test checklist)

### Manual done
- [x] Customer owner set done thanh cong
- [x] User khong phai owner -> `403`
- [x] Job da done goi lai endpoint -> idempotent (khong tang completedJobs lan 2)

### Auto done
- [x] Job qua han -> auto done thanh cong
- [x] Job chua qua han -> khong bi dong sai
- [x] Auto done khong cap nhat lap completedJobs khi job da done tu truoc

### Tuong tac voi apply/select
- [x] Job done khong cho apply moi
- [x] Job done khong cho select-workers tiep
- [x] Cancel apply chi hop le cho don `pending` truoc khi done

---

## 6) Ke hoach implement (de bat dau code)

1. Chot rule nghiep vu o muc 4.
2. Mo rong schema `Job` voi field completion.
3. Refactor `completeJob` de idempotent + set `completedAt`/`completionSource`.
4. Them scheduler auto done (cron hoac queue worker).
5. Them notification/realtime event (neu can): `job:completed`.
6. Viet test cho manual done + auto done + regression voi apply/select. (CHUA LAM)

---

## 7) Integration voi file hien tai

File nay di kem `docs/WORKER-APPLY-FLOW-CHECK.md`:
- File cu tap trung 3 flow apply/cancel/view applicants
- File nay mo rong phan completion (manual + auto)
- Khi code, nen follow thu tu:
  1) Fix apply state rules
  2) Chot completion rules
  3) Implement manual + auto done

---

## 8) Implementation status (cap nhat)

- Da implement:
  - mo rong `Job` schema cho completion fields
  - manual done + auto done dung chung 1 logic idempotent
  - scheduler auto done trong `index.ts`
  - event realtime `job:completed`
  - apply guard bo sung: chan `pending`
- Chua implement:
  - test tu dong cho cac case checklist
  - rule gia han completion window / pre-expiry notification / dispute pause
