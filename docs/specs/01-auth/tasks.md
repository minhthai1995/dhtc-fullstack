# Tasks — Feature: Auth

**Tổng thời gian ước tính:** ~4 giờ  
**Status:** ✅ Hoàn thành

> **Cách dùng file này:**
> - Tick task khi xong: `- [x] T1 ✅`
> - Mỗi task = 1 commit
> - Task ≤ 30 phút — nếu lớn hơn thì chia nhỏ

---

## Backend

- [x] **T1** (15') — Tạo `User` SQLAlchemy model + `TimestampMixin` ✅  
  File: `backend/app/models/user.py`  
  Commit: `feat: add User model with TimestampMixin`

- [x] **T2** (20') — Pydantic schemas: `RegisterRequest`, `TokenResponse`, `UserRead` ✅  
  Files: `backend/app/schemas/auth.py`, `backend/app/schemas/user.py`  
  Commit: `feat: add auth and user schemas`

- [x] **T3** (20') — CRUD layer: `get_by_id`, `get_by_email`, `authenticate`, `create_user` ✅  
  File: `backend/app/crud/user.py`  
  Commit: `feat: add user crud operations`

- [x] **T4** (15') — Security utils: `hash_password`, `verify_password`, `create/decode_access_token` ✅  
  File: `backend/app/core/security.py`  
  Commit: `feat: add JWT + bcrypt security utils`

- [x] **T5** (20') — Dependency injection: `current_subject`, `current_user` ✅  
  File: `backend/app/deps.py`  
  Commit: `feat: add auth dependency injection`

- [x] **T6** (25') — Routes: `POST /auth/register`, `POST /auth/login`, `GET /users/me` ✅  
  Files: `backend/app/api/v1/auth.py`, `backend/app/api/v1/users.py`  
  Commit: `feat: add auth and users API endpoints`

- [x] **T7** (30') — Tests: register, login, wrong password, get me, unauthorized ✅  
  File: `backend/tests/test_auth.py`  
  Commit: `test: add auth endpoint tests (9 passing)`

## Frontend

- [x] **T8** (20') — API layer: `login()`, `register()`, `getMe()`, `logout()` ✅  
  File: `frontend/src/features/auth/auth.api.ts`  
  Commit: `feat: add auth API functions`

- [x] **T9** (15') — Axios interceptors: attach Bearer + 401 redirect ✅  
  File: `frontend/src/lib/axios.ts`  
  Commit: `feat: add axios auth interceptors`

- [x] **T10** (20') — TanStack Query hooks: `useLogin`, `useLogout`, `useCurrentUser`, `useRegister` ✅  
  File: `frontend/src/features/auth/useAuth.ts`  
  Commit: `feat: add auth React Query hooks`

- [x] **T11** (15') — `ProtectedRoute` component + wiring vào `App.tsx` ✅  
  Files: `frontend/src/features/auth/ProtectedRoute.tsx`, `frontend/src/App.tsx`  
  Commit: `feat: add protected route guard`

- [x] **T12** (20') — Login page UI với error handling ✅  
  File: `frontend/src/pages/Login.tsx`  
  Commit: `feat: add login page`

- [x] **T13** (15') — Home page hiển thị user info + logout button ✅  
  File: `frontend/src/pages/Home.tsx`  
  Commit: `feat: show user info on home page`

## DevOps

- [x] **T14** (10') — `JWT_SECRET`, `DATABASE_URL`, `VITE_API_URL` vào `.env.example` ✅  
  Files: `backend/.env.example`, `frontend/.env.example`  
  Commit: `chore: add env example files`

---

## Tổng kết

| | Dự kiến | Thực tế |
|--|---------|---------|
| Tasks | 14 | 14 ✅ |
| Tests | 5 | 9 ✅ |
| Thời gian | ~4h | ~4h |
