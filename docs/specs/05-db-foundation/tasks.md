# Tasks — Feature: P4A · DB Foundation

**Tổng thời gian ước tính:** ~5-6 giờ
**Status:** ✅ Implemented (13/13)

> **Cách dùng file này:**
> - Tick task khi xong: `- [x] T1 ✅`
> - Mỗi task = 1 commit
> - Task ≤ 30 phút — nếu lớn hơn thì chia nhỏ
> - Conventional Commits, subject ≤ 72 chars

---

## Phase 1 — SQLite portability fix + regression test

- [x] **T1** ✅ (15') — Fix `notification.py:42` `server_default="now()"` → `func.now()`; import `from sqlalchemy.sql import func`. Repro: chạy `pytest tests/test_orders.py::test_cancel_order_restores_stock` → expect PASS sau fix.
  - Commit: `fix(backend): notification.created_at server_default portability` (3dfa0b6)

- [x] **T2** ✅ (25') — Tạo `tests/test_db_portability.py`: tạo tất cả tables trên SQLite `:memory:` engine, insert 1 row vào mỗi table có server_default datetime (notification, page_view, fb_profile, chat_message, order_event, return_request, …) bằng raw SQL không set giá trị → SELECT → assert `isinstance(row.created_at, datetime)` (không phải string `'now()'`).
  - Commit: `test(backend): SQLite portability for all server_default datetime cols` (2ad708a)

- [x] **T3** ✅ (10') — Verify full backend suite: `cd backend && uv run pytest -q` → 75/75 pass (1 trước đó fail giờ pass nhờ T1). Update handoff: drop "pre-existing fail" note.
  - Commit: `chore(backend): note suite 75/75 after p4a t1-t2` (c6535d7)

## Phase 2 — Extend ChatMessage cho P5C reserve

- [x] **T4** ✅ (20') — Edit `app/models/chat_message.py`: thêm 7 cột nullable (`intent_cluster`, `captured_phone`, `captured_email`, `captured_address`, `linked_user_id` FK, `referenced_product_id` FK, `referenced_order_id` FK). FK `ondelete="SET NULL"`. Indices trên 3 FK columns.
  - Commit: `feat(backend): extend ChatMessage with P5C capture fields` (bd704e8)

- [x] **T5** ✅ (20') — Alembic migration: `uv run alembic revision --autogenerate -m "extend chat_messages p5c"`. Review autogen SQL — FK constraint naming match `NAMING_CONVENTION`, indices đúng. Round-trip test: `upgrade head` → `downgrade -1` → `upgrade head` clean.
  - Commit: `chore(backend): migration extend_chat_messages_p5c` (c64c765)

- [x] **T6** ✅ (25') — Tests `tests/test_chat_messages_p5c.py`: (a) insert ChatMessage với tất cả 7 fields, commit, reload, assert; (b) FK SET NULL behavior — insert msg với `linked_user_id=X`, delete user X, reload msg, assert `linked_user_id IS NULL`, msg vẫn tồn tại; (c) index existence — `await engine.dialect.has_index(...)` hoặc grep migration.
  - Commit: `test(backend): chat_messages p5c fields + FK SET NULL` (4e53a1c)

## Phase 3 — Customer clusters cho P5D reserve

- [x] **T7** ✅ (20') — Tạo `app/models/customer_cluster.py`: `CustomerCluster` (slug UNIQUE, criteria_json JSON, is_system/is_active Boolean + portable `server_default="true"/"false"`) + `CustomerClusterMember` (user_id+cluster_id FK CASCADE, UNIQUE composite, score Float, signals_json JSON, assigned_at func.now()).
  - Commit: `feat(backend): add CustomerCluster + CustomerClusterMember models` (1a50b89)

- [x] **T8** ✅ (10') — Import vào `app/models/__init__.py` để Alembic autogen pick up.
  - Commit: `chore(backend): register customer_cluster models` (abfc168)

- [x] **T9** ✅ (30') — Alembic migration `create_customer_clusters`: autogenerate → review → thêm `op.bulk_insert` 7 system clusters trong `upgrade()`; `op.execute("DELETE FROM customer_clusters WHERE is_system = true")` trong `downgrade()`. Round-trip verify.
  - Commit: `chore(backend): migration create_customer_clusters + seed` (6a06c8b)

- [x] **T10** ✅ (20') — CRUD `app/crud/customer_cluster.py`: `get_by_slug(slug) -> CustomerCluster | None`, `list_active() -> list[CustomerCluster]`, `assign_user(user_id, cluster_id, score, signals) -> CustomerClusterMember` idempotent (try insert, on UNIQUE conflict update score/signals/assigned_at), `list_for_user(user_id) -> list[CustomerCluster]`. PG `ON CONFLICT DO UPDATE`, SQLite SELECT→UPDATE/INSERT fallback.
  - Commit: `feat(backend): customer_cluster CRUD helpers` (aee76f6)

- [x] **T11** ✅ (25') — Tests `tests/test_customer_clusters.py`: (a) seed assertion — `SELECT COUNT(*) WHERE is_system = true` = 7, slugs khớp 7 tên đã design; (b) UNIQUE conflict — `assign_user` 2 lần cùng (user, cluster) → 1 row, score/signals refreshed; (c) CASCADE — delete user → cluster_member rows gone; (d) `list_for_user` trả đúng cluster đã assign. Autouse fixture `PRAGMA foreign_keys=ON` cho SQLite; CASCADE test dùng raw SQL để bypass ORM cascade.
  - Commit: `test(backend): customer_clusters seed + CRUD + CASCADE` (b888db3)

## Phase 4 — Ruff cleanup + handoff

- [x] **T12** ✅ (20') — `cd backend && uv run ruff check . --fix` autofix sweep. Sau đó manual wrap 29 dòng E501 còn lại (Alembic FK/Enum/create_index multi-line, 1 tuple wrap trong test_admin.py). Quyết định KHÔNG dùng `ruff format` (16-file blast radius). Verify 0 errors + 15 migration importlib roundtrip + pytest 77/77 không regression.
  - Commit: `chore(backend): ruff cleanup 29 pre-existing errors → 0` (3311bae)

- [x] **T13** ✅ (15') — Update `handoff.md` TL;DR: P4A done, schema P5C-ready (ChatMessage 7 cột), P5D-ready (2 tables + 7 system slug seed + CRUD); drop carry-over "pre-existing test_orders fail" và "ruff 29 errors". Tick `tasks.md` 100% với commit SHA. Update spec status (requirements + design + tasks) → ✅ Implemented.
  - Commit: `docs: update handoff after p4a + tick tasks.md 100%` (this commit)

---

## Tổng kết (sẽ điền sau khi xong)

| | Dự kiến | Thực tế |
|--|---------|---------|
| Tasks | 13 | **13** ✅ |
| Tests | 4 new test files / ~10 test cases | **3 new files / 11 test cases** (test_db_portability.py · test_chat_messages_p5c.py · test_customer_clusters.py — full suite 77/77 PASS) |
| Files mới | 5 (2 model + 1 CRUD + 2 migration + 3 tests) | **7** (customer_cluster.py model · customer_cluster.py CRUD · 2 migrations `extend_chat_messages_p5c` + `create_customer_clusters` · 3 test files) |
| Files edit | 3 (notification.py, chat_message.py, models/__init__.py) | **8** (notification.py · chat_message.py · models/__init__.py · 4 older Alembic migrations wrapped E501 · test_admin.py tuple wrap) |
| Migrations | 2 | **2** (`c64c765` extend_chat_messages_p5c + `6a06c8b` create_customer_clusters with 7-slug seed) |
| Thời gian | ~5-6h | **~5h thực tế** (2026-05-21 → 2026-05-25, spread across 2 phiên) |
