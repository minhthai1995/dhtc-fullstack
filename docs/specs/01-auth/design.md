# Design — Feature: Auth

**Version:** 1.0  
**Status:** ✅ Implemented  
**Last updated:** 2026-05-16

---

## API Endpoints

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/api/v1/auth/register` | ❌ | `RegisterRequest` | `UserRead` 201 |
| POST | `/api/v1/auth/login` | ❌ | `form-urlencoded` (OAuth2) | `TokenResponse` 200 |
| GET | `/api/v1/users/me` | ✅ Bearer | — | `UserRead` 200 |

---

## Schema DB

```sql
-- Table: users
id            SERIAL PRIMARY KEY
email         VARCHAR(255) UNIQUE NOT NULL
hashed_password VARCHAR(255) NOT NULL
is_active     BOOLEAN DEFAULT TRUE
created_at    TIMESTAMP DEFAULT NOW()
updated_at    TIMESTAMP DEFAULT NOW()
```

Migration: `backend/alembic/versions/` — autogenerate từ `app/models/user.py`

---

## Pydantic Schemas

```python
# schemas/auth.py
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# schemas/user.py
class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    is_active: bool
```

---

## Flow kỹ thuật

### Register flow
```
POST /auth/register
  → check email unique (crud.get_by_email)
  → 409 nếu đã tồn tại
  → hash password (bcrypt.hashpw)
  → insert user (crud.create_user)
  → return UserRead (201)
```

### Login flow
```
POST /auth/login (form-urlencoded — OAuth2PasswordRequestForm)
  → crud.authenticate(email, password)
    → crud.get_by_email → bcrypt.checkpw
  → 401 nếu sai credentials hoặc is_active=False
  → create_access_token(str(user.id), exp=24h)
  → return TokenResponse (200)
```

### Protected route flow
```
GET /users/me
  → OAuth2PasswordBearer extract token
  → decode_access_token → get sub (user_id)
  → crud.get_by_id(user_id)
  → 401 nếu user không tồn tại hoặc inactive
  → return UserRead (200)
```

---

## Cấu trúc file (3-layer)

```
backend/app/
├── api/v1/auth.py          → routes: /register, /login
├── api/v1/users.py         → routes: /me
├── crud/user.py            → get_by_id, get_by_email, authenticate, create_user
├── models/user.py          → User SQLAlchemy model
├── schemas/auth.py         → RegisterRequest, TokenResponse
├── schemas/user.py         → UserRead, UserUpdate
├── services/auth.py        → skeleton (logic đơn, nằm ở crud)
├── core/security.py        → hash_password, verify_password, create/decode_access_token
└── deps.py                 → current_subject, current_user (DI)

frontend/src/features/auth/
├── auth.api.ts             → register(), login(), getMe(), logout()
├── useAuth.ts              → useCurrentUser, useLogin, useLogout, useRegister
└── ProtectedRoute.tsx      → redirect nếu chưa xác thực
```

---

## Token strategy

- **Algorithm:** HS256
- **Storage:** `sessionStorage` (cleared khi đóng tab — intentional)
- **Expiry:** 24h (configurable qua `JWT_EXPIRE_MINUTES` env)
- **Attach:** Axios request interceptor tự động gắn `Authorization: Bearer <token>`
- **401 handler:** Axios response interceptor xóa token + `window.location.href = '/login'`

---

## Quyết định thiết kế

| Quyết định | Lý do |
|-----------|-------|
| sessionStorage thay localStorage | localStorage persist qua tab = XSS attack surface lớn hơn |
| bcrypt trực tiếp, không passlib | passlib broken với bcrypt 4.x trên Python 3.13+ |
| OAuth2PasswordRequestForm cho login | Standard FastAPI auth — tương thích với `/api/docs` Swagger UI |
| subject = user.id (không phải email) | Stable sau khi user đổi email; không leak PII trong JWT |
