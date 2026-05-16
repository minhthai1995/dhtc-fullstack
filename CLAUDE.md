# CLAUDE.md — fullstack-template

Fullstack monorepo template cho **Spec-Driven Development**. Auth wired end-to-end: login → JWT → sessionStorage → protected routes.

## Stack (KHÔNG thay đổi không hỏi)

- Frontend: React 19 + Vite 6 + TypeScript strict + Tailwind v4
- Backend: FastAPI 0.115 + Python 3.12 + SQLAlchemy 2.0 async + Pydantic v2
- Database: PostgreSQL 16 + Alembic (KHÔNG dùng create_all() trong production)
- Auth: JWT (python-jose) + bcrypt 4.x — **KHÔNG dùng passlib** (broken)
- Container: Docker multi-stage + nginx

Chi tiết stack + rationale: `docs/adr/0001-tech-stack.md`

---

## Quy trình mỗi phiên làm việc

### ĐẦU PHIÊN — bắt buộc làm trước khi code

1. Đọc `handoff.md` (TL;DR ở đầu file)
2. Mở spec của feature đang làm: `docs/specs/<NN>-<feature>/tasks.md`
3. Xác nhận task tiếp theo cần làm (task chưa tick)
4. Bật **Plan Mode** (Shift+Tab) nếu task đụng > 1 file — đợi approve plan xong mới execute

### TRONG PHIÊN — discipline không thương lượng

- **Luôn tham chiếu spec**, không tham chiếu lịch sử chat
- **Tick task ngay** sau khi xong: `- [x] T3 ✅` trong `tasks.md`
- **Commit ngay** sau mỗi task hoàn thành — 1 task = 1 commit
- **Mọi prompt > 1 dòng** phải có **Verification Gate** ở cuối (xem bên dưới)

### CUỐI PHIÊN — không được skip

1. Tick xong tất cả task đã làm trong `tasks.md`
2. Cập nhật `checklist.md` nếu feature xong hoàn toàn
3. Cập nhật `handoff.md` TL;DR: đang làm gì, blocker nào, file nào dở dang
4. Commit: `docs: update handoff + tick tasks [NN-feature]`

---

## Verification Gate (4 dòng cuối mọi prompt > 1 dòng)

```
**Verification:**
1. [file/output cụ thể] tồn tại + có nội dung đúng
2. [test command] pass
3. [grep/check] confirm không có regression
4. Báo cáo kết quả — KHÔNG tự báo "xong" khi chưa verify
```

> **Mantra:** Không có Verification = Claude tự định nghĩa "xong" = mất kiểm soát chất lượng.

---

## Quy tắc làm việc

1. **Spec-first.** Feature mới → tạo `docs/specs/<NN>-<feature>/` với 4 file. Dùng `/spec <name>`. Đợi duyệt xong mới code.
2. **Plan Mode.** Mọi thay đổi > 1 file → Shift+Tab trước. Đợi approve.
3. **Luôn lưu plan.** Plan Mode output → save vào `docs/specs/<feature>/design.md` nếu có quyết định kiến trúc mới.
4. **Test bắt buộc.** Mọi endpoint BE có pytest. Coverage ≥ 70%.
5. **Conventional Commits.** `feat:|fix:|docs:|refactor:|chore:|test:` — subject ≤ 72 ký tự.
6. **KHÔNG commit secrets.** Dùng `.env` + `.env.example`.
7. **ADR trước quyết định lớn.** Thay stack/pattern → tạo `docs/adr/NNNN-<title>.md` trước.

---

## Cấu trúc thư mục

@docs/structure.md

## Quy tắc viết code

- Backend: @backend/CLAUDE.md
- Frontend: @frontend/CLAUDE.md

---

## Build & test nhanh

```bash
cd backend && uv run pytest -q                    # BE tests (SQLite, không cần Postgres)
cd frontend && npm test                           # FE tests
cd backend && uv run ruff check .                 # lint
cd frontend && npm run typecheck                  # tsc --noEmit
docker compose up --build                        # full stack
```

## Verify trước khi báo "xong"

- [ ] Spec tasks.md đã tick đủ
- [ ] `uv run pytest -q` pass
- [ ] `npm run typecheck && npm run build` pass
- [ ] `uv run ruff check .` pass
- [ ] Committed với Conventional Commits
- [ ] `handoff.md` TL;DR đã cập nhật
