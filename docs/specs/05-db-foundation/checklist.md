# Checklist — Feature: P4A · DB Foundation

**Tiêu chí "xong" — Claude tự verify trước khi báo hoàn thành**

---

## Phase 1 — SQLite portability

- [ ] `notification.py:42` dùng `func.now()` (không còn string `"now()"`)
- [ ] `from sqlalchemy.sql import func` đã import
- [ ] `pytest tests/test_orders.py::test_cancel_order_restores_stock -q` → PASS
- [ ] `tests/test_db_portability.py` tồn tại + chạy được trên SQLite `:memory:`
- [ ] Test portability INSERT default → SELECT → `isinstance(row.created_at, datetime)` PASS cho tất cả tables có `server_default datetime`

## Phase 2 — ChatMessage P5C extension

- [ ] `app/models/chat_message.py` có 7 cột mới: `intent_cluster`, `captured_phone`, `captured_email`, `captured_address`, `linked_user_id`, `referenced_product_id`, `referenced_order_id`
- [ ] 3 FK `ondelete="SET NULL"` đúng target table (`users`, `products`, `orders`)
- [ ] 3 indices trên FK columns
- [ ] Migration `extend_chat_messages_p5c` tồn tại
- [ ] `alembic upgrade head` → `downgrade -1` → `upgrade head` clean (round-trip)
- [ ] Existing chat_messages rows vẫn đọc được sau upgrade (NULL cho 7 cột mới)
- [ ] Test: insert ChatMessage với cả 7 fields → commit → reload → assert đúng
- [ ] Test: FK SET NULL — delete referenced user/product/order → ChatMessage row vẫn tồn tại, FK cột → NULL

## Phase 3 — Customer clusters P5D

- [ ] `app/models/customer_cluster.py` chứa `CustomerCluster` + `CustomerClusterMember`
- [ ] Models đã register trong `app/models/__init__.py`
- [ ] `customer_clusters` table có `slug` UNIQUE, `is_system`/`is_active` Bool với portable `server_default="true"/"false"`
- [ ] `customer_cluster_members` có UNIQUE composite `(user_id, cluster_id)` + FK CASCADE 2 chiều
- [ ] Migration `create_customer_clusters` tồn tại + `op.bulk_insert` 7 system clusters trong `upgrade()`
- [ ] `downgrade()` có `op.execute("DELETE FROM customer_clusters WHERE is_system = true")`
- [ ] Migration round-trip upgrade/downgrade/upgrade clean
- [ ] `SELECT COUNT(*) FROM customer_clusters WHERE is_system = true` → 7
- [ ] 7 slugs đúng: `messenger_engaged`, `web_only_visitor`, `lead_no_purchase`, `first_buyer`, `repeat_buyer`, `lapsed_60d`, `high_value_vn`
- [ ] CRUD `app/crud/customer_cluster.py` có 4 functions: `get_by_slug`, `list_active`, `assign_user` (idempotent), `list_for_user`
- [ ] `assign_user` 2 lần cùng `(user_id, cluster_id)` → vẫn 1 row, score/signals refreshed
- [ ] CASCADE: delete user → `customer_cluster_members` rows liên quan biến mất
- [ ] `list_for_user(user_id)` trả đúng các cluster đã assign

## Phase 4 — Quality

- [ ] `cd backend && uv run pytest -q` → 75/75 PASS (0 fail, 0 error)
- [ ] `cd backend && uv run ruff check .` → 0 errors (29 pre-existing → 0)
- [ ] `cd backend && uv run mypy app` → 0 errors cho file mới (warning OK)
- [ ] Frontend không đụng — `npm run typecheck` vẫn pass (sanity)

## Documentation

- [ ] `requirements.md` — status → ✅ Implemented
- [ ] `design.md` — status → ✅ Implemented
- [ ] `tasks.md` — tất cả 13 tasks tick ✅ với commit SHA
- [ ] `handoff.md` TL;DR drop "pre-existing test_orders fail" + "29 ruff errors"
- [ ] `handoff.md` TL;DR mention P4A done + schema ready cho P5C/P5D
- [ ] Tổng kết table trong `tasks.md` filled "Thực tế" column

---

## Verification command

```bash
# Phase 1 — fix verify
cd backend && uv run pytest tests/test_orders.py::test_cancel_order_restores_stock -q
# Expected: 1 passed

# Phase 2 — round-trip migrations
cd backend && uv run alembic upgrade head && uv run alembic downgrade -2 && uv run alembic upgrade head
# Expected: 3 commands all succeed, no errors

# Phase 3 — seed verify (cần Postgres dev DB running)
cd backend && uv run python -c "
import asyncio
from app.db.session import async_session_factory
from sqlalchemy import text
async def check():
    async with async_session_factory() as s:
        r = await s.execute(text(\"SELECT COUNT(*) FROM customer_clusters WHERE is_system = true\"))
        print('System clusters:', r.scalar())
asyncio.run(check())
"
# Expected: System clusters: 7

# Phase 4 — full quality gate
cd backend && uv run pytest -q && uv run ruff check . && uv run mypy app
# Expected: 75 passed, 0 ruff errors, 0 mypy errors trên file mới
```
