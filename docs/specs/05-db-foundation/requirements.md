# Requirements — Feature: P4A · DB Foundation

**Version:** 1.0
**Status:** ✅ Implemented
**Last updated:** 2026-05-25

---

## Mô tả

Chuẩn bị schema database làm nền cho P5C (Messenger capture-everything) và P5D (multi-signal customer clustering). Đồng thời fix các bug pre-existing về SQLite portability + audit `server_default` toàn bộ models để test suite chạy clean trên SQLite (CI) lẫn Postgres (prod). Sprint nền — không user-facing feature mới, nhưng nếu skip thì P5C/P5D không có chỗ để ghi data.

---

## Người dùng mục tiêu

- **User chính:** không có — internal infrastructure
- **User gián tiếp:** admin xem CRM (P5D clusters), bot Messenger (P5C captured fields)
- **Quy mô MVP:** ~7 system clusters seed; ChatMessage thêm 7 cột nullable (không break existing rows)

---

## Yêu cầu nghiệp vụ

### Phải có (Must have)

- [ ] Fix `notification.py` `server_default="now()"` (literal string) → `func.now()` để SQLite không lưu `'now()'` thành text — repro qua test `test_cancel_order_restores_stock` đang fail
- [ ] Re-enable test `test_cancel_order_restores_stock` → pass trên SQLite
- [ ] Audit toàn bộ models: bất kỳ `server_default="..."` literal string nào KHÔNG portable (vd `"now()"`, `"gen_random_uuid()"`) phải đổi sang SQL expression `func.*` hoặc giá trị portable (`"true"`/`"false"`/số/string-thường thì OK)
- [ ] Thêm portability smoke test: tạo tất cả tables trên SQLite trong-memory + INSERT 1 row mỗi table với server-defaults → SELECT lại đọc được giá trị hợp lệ
- [ ] **P5C reserve — extend `chat_messages` table** thêm cột nullable:
  - `intent_cluster: str(64) | None` — cached output từ keyword classifier (`product_search` / `price_inquiry` / `order_lookup` / `shipping_inquiry` / `complaint`)
  - `captured_phone: str(20) | None` — regex extract VN phone từ content
  - `captured_email: str(255) | None` — regex extract email từ content
  - `captured_address: str(500) | None` — regex/heuristic VN address từ content (free-form, không strict)
  - `linked_user_id: int | None` FK `users.id` ON DELETE SET NULL, indexed — sau khi capture phone/email và match users → backfill
  - `referenced_product_id: int | None` FK `products.id` ON DELETE SET NULL, indexed — khi content mention product code/name
  - `referenced_order_id: int | None` FK `orders.id` ON DELETE SET NULL, indexed — khi content mention mã đơn
- [ ] **P5D reserve — tạo 2 tables mới:**
  - `customer_clusters`: id, slug UNIQUE, name (VN), description, criteria_json (JSON), is_system (bool, system-defined vs admin-created), is_active (bool default true), timestamps
  - `customer_cluster_members`: id, user_id FK ON DELETE CASCADE, cluster_id FK ON DELETE CASCADE, score (float 0-1), signals_json (JSON), assigned_at; UNIQUE(user_id, cluster_id)
  - Seed 7 system clusters: `messenger_engaged`, `web_only_visitor`, `lead_no_purchase`, `first_buyer`, `repeat_buyer`, `lapsed_60d`, `high_value_vn`
- [ ] Alembic migrations:
  - 1 migration: alter `chat_messages` (add 7 columns + 3 FK constraints + 3 indices)
  - 1 migration: create `customer_clusters` + `customer_cluster_members` + insert seed rows
  - Round-trip `upgrade` → `downgrade` → `upgrade` không có lỗi
- [ ] Backend ruff clean: 29 lỗi pre-existing → 0 (autofix + manual cho non-autofixable)
- [ ] Backend test suite **75/75 pass** (bỏ 1 pre-existing fail sau khi fix notification)
- [ ] P5C-prep test: insert ChatMessage với new fields set; verify FK CASCADE behavior
- [ ] P5D-prep test: seed assertion (7 clusters tồn tại), CRUD cluster_member với UNIQUE conflict handling

### Không làm trong MVP (Out of scope)

- ❌ Implementation logic P5C webhook (capture extraction regex, FK backfill) — chỉ tạo schema
- ❌ Implementation logic P5D clustering job (cron, compute scores) — chỉ tạo schema + seed
- ❌ Admin UI cho cluster management — defer P5D feature work
- ❌ Migrate sang JSONB column cho `product.images` — out of scope
- ❌ Add database-level CHECK constraints cho captured fields format — application validate đủ
- ❌ Postgres-specific optimizations (partial indices, generated columns) — giữ SQLite/Postgres parity
- ❌ Frontend changes — purely backend/DB

---

## Ràng buộc

- **Backward compat:** Existing chat_messages rows (~đã có data từ webhook flow trước) phải còn đọc được sau migration. Tất cả 7 cột mới nullable, không default value (NULL OK).
- **Test parity:** Mọi test phải pass trên SQLite (CI default) — không assume Postgres-only features. JSON cột dùng `JSON` (không `JSONB`).
- **Migration safety:** Migration phải round-trip upgrade/downgrade cleanly. Seed rows dùng `op.bulk_insert` để downgrade sạch được (`op.execute("DELETE FROM customer_clusters WHERE is_system = true")`).
- **No-feature-creep:** Chỉ tạo schema + seed. Không viết classifier, không viết clustering compute logic — đó là P5C/P5D work.
- **Naming:** Theo convention `app/models/base.py` (`NAMING_CONVENTION` for `ix`/`uq`/`fk`/`pk`/`ck`).

---

## Tiêu chí chấp nhận (Acceptance criteria)

```
GIVEN test suite chạy `uv run pytest -q`
WHEN tất cả 75 test execute
THEN exit code = 0, không có fail nào (kể cả test_cancel_order_restores_stock)

GIVEN một test tạo ChatMessage với captured_phone="0901234567"
WHEN commit + reload
THEN row có phone đúng + các cột chưa set = NULL

GIVEN seed migration đã chạy
WHEN SELECT COUNT(*) FROM customer_clusters WHERE is_system = true
THEN count = 7

GIVEN user_id = X có cluster_member assignment
WHEN DELETE user X
THEN cluster_member row cũng bị xóa (CASCADE)

GIVEN backend lint `uv run ruff check .`
WHEN command runs
THEN exit 0, 0 errors
```
