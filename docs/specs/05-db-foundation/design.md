# Design — Feature: P4A · DB Foundation

**Version:** 0.1 (draft)
**Status:** 🔴 Draft — chờ duyệt
**Last updated:** 2026-05-20

---

## Root cause: SQLite portability bug

### Repro

```bash
cd backend && uv run pytest tests/test_orders.py::test_cancel_order_restores_stock -q
# → sqlalchemy.exc.PendingRollbackError: Invalid isoformat string: 'now()'
```

### Diagnosis

`app/models/notification.py:42`:
```python
created_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), server_default="now()"   # ❌ string literal
)
```

SQLAlchemy passes `"now()"` as **literal string** (because it's not a `ClauseElement`). On SQLite, this gets stored as the 5-character text `now()`. When ORM reads back, `aiosqlite` tries to parse it as ISO-8601 datetime → fails.

On Postgres the same literal gets cast: `DEFAULT 'now()'::text::timestamptz` which Postgres helpfully evaluates lazily at INSERT time → looks like it works. That's why this never showed up in prod.

### Fix pattern

```python
from sqlalchemy.sql import func
# ...
created_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), server_default=func.now()   # ✅ SQL expression
)
```

`func.now()` is a `ClauseElement` → SQLAlchemy emits `CURRENT_TIMESTAMP` on SQLite, `now()` on Postgres. Portable.

### Audit results (manual grep `app/models/`)

| File | Line | Current | Verdict |
|------|------|---------|---------|
| `base.py:22,26` | TimestampMixin | `func.now()` | ✅ OK |
| `notification.py:39` | `is_read` | `"false"` (Boolean literal) | ✅ OK — portable |
| `notification.py:42` | `created_at` | `"now()"` literal | ❌ **FIX** |
| `page_view.py:33` | `viewed_at` | `func.now()` | ✅ OK |
| `fb_profile.py:32` | `linked_at` | `func.now()` | ✅ OK |
| `return_request.py:35` | `created_at` | `func.now()` | ✅ OK |

Single file fix. But adding portability test prevents recurrence.

---

## Schema DB — P5C extension

### `chat_messages` ALTER

```sql
ALTER TABLE chat_messages
  ADD COLUMN intent_cluster VARCHAR(64),
  ADD COLUMN captured_phone VARCHAR(20),
  ADD COLUMN captured_email VARCHAR(255),
  ADD COLUMN captured_address VARCHAR(500),
  ADD COLUMN linked_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN referenced_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  ADD COLUMN referenced_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL;

CREATE INDEX chat_messages_linked_user_id_idx ON chat_messages(linked_user_id);
CREATE INDEX chat_messages_referenced_product_id_idx ON chat_messages(referenced_product_id);
CREATE INDEX chat_messages_referenced_order_id_idx ON chat_messages(referenced_order_id);
```

All cột nullable, no default — existing rows giữ nguyên (NULL).

### Model code

```python
class ChatMessage(Base, TimestampMixin):
    # ... existing fields ...

    # P5C reserve — capture-everything fields, all nullable
    intent_cluster: Mapped[str | None] = mapped_column(String(64), nullable=True)
    captured_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    captured_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    captured_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    linked_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    referenced_product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True
    )
    referenced_order_id: Mapped[int | None] = mapped_column(
        ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True
    )
```

Why `SET NULL` (not `CASCADE`): conversation history should survive deletion of referenced product/order — preserve audit trail. User deletion sets `linked_user_id` to NULL but keeps the inbound message.

---

## Schema DB — P5D clusters

### `customer_clusters`

```sql
CREATE TABLE customer_clusters (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(64) NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  criteria_json JSON,
  is_system     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `customer_cluster_members`

```sql
CREATE TABLE customer_cluster_members (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cluster_id   INTEGER NOT NULL REFERENCES customer_clusters(id) ON DELETE CASCADE,
  score        REAL,
  signals_json JSON,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, cluster_id)
);

CREATE INDEX customer_cluster_members_user_id_idx ON customer_cluster_members(user_id);
CREATE INDEX customer_cluster_members_cluster_id_idx ON customer_cluster_members(cluster_id);
```

### Seed (7 system clusters)

| slug | name (VN) | description | criteria_json |
|------|-----------|-------------|---------------|
| `messenger_engaged` | Đã chat Messenger | User có ≥ 1 ChatMessage inbound | `{"has_chat": true}` |
| `web_only_visitor` | Khách web (chưa chat) | User có order nhưng chưa chat | `{"has_order": true, "has_chat": false}` |
| `lead_no_purchase` | Lead chưa mua | User có chat nhưng chưa có order | `{"has_chat": true, "order_count": 0}` |
| `first_buyer` | Mua lần đầu | Đúng 1 order completed | `{"completed_orders": 1}` |
| `repeat_buyer` | Khách trung thành | ≥ 2 orders completed | `{"completed_orders_gte": 2}` |
| `lapsed_60d` | Khách ngủ quên | Order gần nhất > 60 ngày | `{"days_since_last_order_gt": 60}` |
| `high_value_vn` | Khách VIP VN | Tổng spent ≥ 5M VND, ship VN | `{"total_spent_vnd_gte": 5000000, "country": "VN"}` |

`criteria_json` là declarative spec — P5D job sẽ compile thành SQL filter. Trong P4A chỉ lưu schema, không evaluate.

### Model code

```python
# app/models/customer_cluster.py
class CustomerCluster(Base, TimestampMixin):
    __tablename__ = "customer_clusters"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    criteria_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

class CustomerClusterMember(Base):
    __tablename__ = "customer_cluster_members"
    __table_args__ = (UniqueConstraint("user_id", "cluster_id", name="customer_cluster_members_user_cluster_key"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    cluster_id: Mapped[int] = mapped_column(ForeignKey("customer_clusters.id", ondelete="CASCADE"), index=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    signals_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
```

---

## Flow kỹ thuật

```
1. Fix notification.py (1 line) + repro test
2. Audit script: pytest test mới — tạo tất cả tables on SQLite + INSERT default → SELECT → assert datetime parseable
3. Extend chat_messages model (7 cột) → autogenerate migration → review SQL → commit
4. Create customer_cluster models → autogenerate migration → review → manually add bulk_insert seed → commit
5. CRUD helpers (chỉ ones cần cho test):
   - `get_cluster_by_slug(slug)` → CustomerCluster | None
   - `assign_user_to_cluster(user_id, cluster_id, score, signals)` → idempotent via ON CONFLICT
   - `list_user_clusters(user_id)` → list[CustomerCluster]
6. Tests:
   - test_notification_created_at_portable (regression cho bug)
   - test_chat_messages_p5c_fields (insert + FK SET NULL + index used)
   - test_customer_clusters_seed (7 system rows tồn tại)
   - test_customer_cluster_member_unique (UNIQUE conflict raises)
   - test_customer_cluster_member_cascade (delete user → member row gone)
7. Re-run full suite → expect 75/75
8. Ruff cleanup — autofix sweep + manual
```

---

## Cấu trúc file

```
backend/app/
├── models/
│   ├── notification.py          (edit: server_default fix)
│   ├── chat_message.py          (edit: add 7 cột P5C)
│   ├── customer_cluster.py      (new: CustomerCluster + CustomerClusterMember)
│   └── __init__.py              (edit: export 2 new models)
├── crud/
│   └── customer_cluster.py      (new: 3 helpers)
├── alembic/versions/
│   ├── 2026_05_20_extend_chat_messages_p5c.py        (new)
│   └── 2026_05_20_create_customer_clusters.py        (new — includes seed)

backend/tests/
├── test_db_portability.py       (new: SQLite smoke test)
├── test_chat_messages_p5c.py    (new)
├── test_customer_clusters.py    (new)
└── test_orders.py               (no changes — should now pass)
```

---

## Quyết định thiết kế

| Quyết định | Lý do |
|-----------|-------|
| ChatMessage extend (không tạo bảng `chat_message_captures` riêng) | 1:1 relationship, không cần versioning → cột inline đơn giản hơn JOIN. Cost: 7 NULL cột trên row cũ — chấp nhận được. |
| FK `SET NULL` cho referenced_product/order/user (không CASCADE) | Conversation history là audit data — phải giữ lại nếu product/order bị xóa. Chỉ unlink reference. |
| `linked_user_id` (không bind vào user_id qua join `fb_profiles`) | ChatMessage có thể đến từ user chưa link FB (vd chat web anonymous). Direct FK rõ ràng hơn — populate sau khi capture extract. |
| `criteria_json` declarative (JSON spec) thay vì cluster mỗi cái 1 function | Admin có thể tự define cluster qua UI sau này (P5D+) — JSON spec dễ versioning. P4A chỉ store, P5D compile. |
| `customer_cluster_members.score` (float) thay vì binary `is_member` | Cluster có thể là fuzzy (vd "lapsed 60d" — score giảm dần theo days_since_last_order). MVP để NULL = binary; later có gradient. |
| Seed rows trong migration (không qua management command) | Migration là single source of truth cho schema + system data. Downgrade phải `DELETE WHERE is_system = true`. |
| `JSON` (không `JSONB`) | SQLite parity. Postgres JSON đủ cho read-mostly use case (criteria spec ít update). |
| Audit test (`test_db_portability`) tạo all tables + INSERT default | Catch tương lai khi ai đó copy-paste sai pattern. Test chạy mỗi CI run. |
| Migration `2026_05_20_*` timestamp (không sequential) | Match convention current (vd `2026_05_20_1441_create_fb_profiles.py`). |
