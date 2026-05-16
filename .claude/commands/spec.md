---
description: Scaffold a 4-file spec for a new feature (requirements, design, tasks, checklist). Usage — /spec <feature-name>
argument-hint: <feature-name>  (e.g. "products", "payments", "notifications")
allowed-tools: Read, Write, Bash, Glob
---

Feature name: $ARGUMENTS

Existing specs:
!`ls docs/specs/ 2>/dev/null | grep -v '\.md$' | sort`

---

Scaffold a spec for "$ARGUMENTS". Follow these steps exactly.

## Step 1 — Determine next spec number

Run: `ls docs/specs/ | grep -E '^[0-9]{2}-' | sort | tail -1`

Extract the number prefix and increment by 1 (zero-padded to 2 digits).
If no existing numbered specs, start at `01`.

The folder will be: `docs/specs/<NN>-$ARGUMENTS/`

## Step 2 — Create the 4 spec files

### `docs/specs/<NN>-$ARGUMENTS/requirements.md`

```markdown
# Requirements — Feature: $ARGUMENTS

**Version:** 0.1 (draft)
**Status:** 🔴 Draft — chưa duyệt
**Last updated:** YYYY-MM-DD

---

## Mô tả

[1-2 câu: feature này làm gì, giải quyết vấn đề gì cho user]

---

## Người dùng mục tiêu

- **User chính:** [ai dùng]
- **Quy mô MVP:** [số lượng user, đơn giản hay phức tạp]

---

## Yêu cầu nghiệp vụ

### Phải có (Must have)

- [ ] [User story / acceptance criterion]
- [ ] [...]

### Không làm trong MVP (Out of scope)

- ❌ [feature bị loại]
- ❌ [...]

---

## Ràng buộc

- [kỹ thuật, bảo mật, hiệu năng, UX]

---

## Tiêu chí chấp nhận (Acceptance criteria)

```
GIVEN [điều kiện]
WHEN [hành động]
THEN [kết quả mong đợi]
```

```

---

### `docs/specs/<NN>-$ARGUMENTS/design.md`

```markdown
# Design — Feature: $ARGUMENTS

**Version:** 0.1 (draft)
**Status:** 🔴 Draft — chưa duyệt
**Last updated:** YYYY-MM-DD

---

## API Endpoints

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/api/v1/$ARGUMENTS` | ✅ Bearer | — | `...Read[]` 200 |

---

## Schema DB

```sql
-- Table: [tên bảng]
id   SERIAL PRIMARY KEY
-- thêm cột ở đây
```

Migration: `backend/alembic/versions/` — autogenerate từ model

---

## Pydantic Schemas

```python
class [Name]Create(BaseModel):
    pass  # TODO: điền fields

class [Name]Read(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    # TODO: điền fields
```

---

## Flow kỹ thuật

```
[Describe the main flow step by step]
```

---

## Cấu trúc file

```
backend/app/
├── api/v1/$ARGUMENTS.py
├── crud/$ARGUMENTS.py
├── models/$ARGUMENTS.py
├── schemas/$ARGUMENTS.py
└── services/$ARGUMENTS.py

frontend/src/features/$ARGUMENTS/
├── $ARGUMENTS.api.ts
├── use[Name].ts
└── [Name]Page.tsx
```

---

## Quyết định thiết kế

| Quyết định | Lý do |
|-----------|-------|
| [pattern chọn] | [why] |

```

---

### `docs/specs/<NN>-$ARGUMENTS/tasks.md`

```markdown
# Tasks — Feature: $ARGUMENTS

**Tổng thời gian ước tính:** ~[X] giờ
**Status:** 🔴 Not started

> **Cách dùng:**
> - Tick task khi xong: `- [x] T1 ✅`
> - Mỗi task = 1 commit, ≤ 30 phút
> - Task lớn hơn → chia nhỏ

---

## Backend

- [ ] **T1** (15') — Tạo `[Name]` SQLAlchemy model
  File: `backend/app/models/$ARGUMENTS.py`
  Commit: `feat: add [Name] model`

- [ ] **T2** (20') — Pydantic schemas: `[Name]Create`, `[Name]Read`
  File: `backend/app/schemas/$ARGUMENTS.py`
  Commit: `feat: add $ARGUMENTS schemas`

- [ ] **T3** (20') — CRUD layer: `get_all`, `get_by_id`, `create`, `update`, `delete`
  File: `backend/app/crud/$ARGUMENTS.py`
  Commit: `feat: add $ARGUMENTS crud`

- [ ] **T4** (20') — Routes: CRUD endpoints với auth guard
  File: `backend/app/api/v1/$ARGUMENTS.py`
  Commit: `feat: add $ARGUMENTS API endpoints`

- [ ] **T5** (20') — Tests: happy path + unauthorized
  File: `backend/tests/test_$ARGUMENTS.py`
  Commit: `test: add $ARGUMENTS endpoint tests`

## Frontend

- [ ] **T6** (20') — API layer
  File: `frontend/src/features/$ARGUMENTS/$ARGUMENTS.api.ts`
  Commit: `feat: add $ARGUMENTS API functions`

- [ ] **T7** (20') — TanStack Query hooks
  File: `frontend/src/features/$ARGUMENTS/use[Name].ts`
  Commit: `feat: add $ARGUMENTS hooks`

- [ ] **T8** (25') — Page UI
  File: `frontend/src/pages/[Name]Page.tsx`
  Commit: `feat: add $ARGUMENTS page`

## DevOps

- [ ] **T9** (10') — Alembic migration
  Command: `uv run alembic revision --autogenerate -m "add $ARGUMENTS table"`
  Commit: `chore: add $ARGUMENTS migration`

---

## Tổng kết

| | Dự kiến | Thực tế |
|--|---------|---------|
| Tasks | 9 | — |
| Tests | — | — |
| Thời gian | ~[X]h | — |
```

---

### `docs/specs/<NN>-$ARGUMENTS/checklist.md`

```markdown
# Checklist — Feature: $ARGUMENTS

**Tiêu chí "xong" — Claude tự verify trước khi báo hoàn thành**

---

## Backend

- [ ] `GET /api/v1/$ARGUMENTS` trả 200 với token hợp lệ
- [ ] `GET /api/v1/$ARGUMENTS` trả 401 khi không có token
- [ ] `POST /api/v1/$ARGUMENTS` tạo resource mới thành công
- [ ] `PUT /api/v1/$ARGUMENTS/{id}` cập nhật đúng
- [ ] `DELETE /api/v1/$ARGUMENTS/{id}` xóa đúng, trả 204
- [ ] `uv run pytest -q` → tất cả pass
- [ ] `uv run ruff check .` → 0 errors
- [ ] `uv run mypy app` → 0 errors (có thể có warning)

## Frontend

- [ ] List page hiển thị data từ API
- [ ] Loading state hiển thị Spinner
- [ ] Error state hiển thị message rõ ràng
- [ ] `npm run typecheck` → 0 errors
- [ ] `npm run build` → build thành công
- [ ] `npm test` → tất cả pass

## DevOps

- [ ] Migration file đã review (không có unintended changes)
- [ ] `uv run alembic upgrade head` → thành công
- [ ] `uv run alembic downgrade -1` → rollback sạch

## Documentation

- [ ] `requirements.md` — status → ✅ Implemented
- [ ] `design.md` — status → ✅ Implemented
- [ ] `tasks.md` — tất cả tasks đã tick ✅
- [ ] `handoff.md` TL;DR đã cập nhật

---

## Verification command

```bash
# Backend
cd backend && uv run pytest -q && uv run ruff check .

# Frontend
cd frontend && npm run typecheck && npm run build && npm test

# Smoke test (backend đang chạy)
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/$ARGUMENTS
# Expected: 200 + JSON array
```
```

---

## Step 3 — After creating the 4 files, print this summary

```
✅ Spec scaffolded: docs/specs/<NN>-$ARGUMENTS/

Files created:
  requirements.md   ← MÔ TẢ NGHIỆP VỤ (điền trước)
  design.md         ← THIẾT KẾ KỸ THUẬT (điền sau requirements)
  tasks.md          ← TASK LIST (điền sau design)
  checklist.md      ← TIÊU CHÍ XONG (review cuối)

Next steps:
1. Điền requirements.md — xác định scope, out-of-scope, acceptance criteria
2. Review với team / stakeholder → đổi status → 🟡 In review
3. Điền design.md — API endpoints, DB schema, flow
4. Điền tasks.md — break thành task ≤ 30 phút
5. Duyệt design → status → 🟢 Approved → bắt đầu code
6. Dùng /feature $ARGUMENTS để scaffold code skeleton

⚠️  KHÔNG code trước khi requirements được duyệt.
```
