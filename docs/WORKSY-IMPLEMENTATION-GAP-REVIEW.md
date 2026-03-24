# Worksy - Review chuc nang chua xong/chua khop spec

Tai lieu nay tong hop cac chuc nang can uu tien hoan thien dua tren doi chieu:
- `docs/WORKSY-MARKETPLACE-SPEC.md`
- Backend hien tai trong `backend/src`

## 1) Muc chua xong nghiem trong (uu tien cao)

- [ ] **Status `partial` chua duoc khai bao trong schema `Job`**
  - Spec yeu cau `open | partial | full | done`.
  - Code service da gan `job.status = "partial"` trong luong chon tho.
  - Nhung model `Job` chi cho phep `["pending", "open", "full", "done"]`.
  - Tac dong: nguy co loi validation khi save job, vo luong nghiep vu `select-workers`.

- [ ] **Workflow pending/open chua duoc khoa logic apply**
  - Job moi tao dang set `status = "pending"` (co buoc admin duyet).
  - API apply hien tai chi chan `full`/`done`, KHONG chan `pending`.
  - Tac dong: worker co the apply vao job chua duoc duyet.

## 2) Chuc nang chua khop voi SPEC (can chot rule)

- [ ] **Bien moi truong JWT khong thong nhat**
  - Spec mo ta `JWT_SECRET`.
  - Socket dang verify bang `JWT_SECRET_ACCESS_TOKEN`.
  - Tac dong: token REST va Socket co the khong dong bo, gay loi auth realtime.

- [ ] **Status `pending` la mo rong ngoai spec, chua cap nhat tai lieu**
  - Spec tong quan trang thai Job khong co `pending`.
  - Backend dang dung moderation flow co `pending` + API admin `/jobs/pending`, `/jobs/:id/approve`.
  - Can chot 1 trong 2 huong:
    1. Cap nhat spec de chinh thuc hoa moderation flow.
    2. Bo moderation flow de quay ve dung spec goc.

- [ ] **Danh sach viec worker mac dinh van gom `full`**
  - Service browse dang default `status = ["open", "partial", "full"]`.
  - Theo nghiep vu thong thuong, viec `full` khong con slot de apply.
  - Can chot co hien thi `full` cho worker hay khong.

## 3) Chuc nang nen bo sung de hoan thien du an

- [ ] **Bo validation input chua day du/o mot so endpoint**
  - Can bo sung schema validate chat cho `create/update job`, `apply`, `select-workers`, `review`.
  - Dam bao thong bao loi nhat quan, tranh du lieu xau vao DB.

- [ ] **Bo test cho cac luong nghiep vu chinh**
  - De xuat test:
    - apply trung -> 409
    - select-workers khi con/het slot
    - transition status `open -> partial/full -> done`
    - review trung `(jobId, workerId)` -> 409
    - socket auth sai secret/khong token

## 4) Thu tu de xuat de code tiep

1. Sua schema `Job.status` va chot luong moderation (`pending`) theo quyet dinh nghiep vu.
2. Sua logic `createApply` de chan apply voi job khong hop le (it nhat la `pending/full/done` neu co moderation).
3. Dong bo secret JWT giua REST va Socket.
4. Chot bo trang thai tra ve trong API browse/recommended (co/khong `full`).
5. Them validation + test cho cac endpoint cot loi.

## 5) Ket qua review

He thong da co khung chuc nang kha day du (auth, jobs, apply, review, socket chat, score), nhung hien tai con cac diem nghen ve **state machine cua Job** va **dong bo auth JWT**. Day la 2 muc can fix truoc de tranh loi runtime va sai nghiep vu.
