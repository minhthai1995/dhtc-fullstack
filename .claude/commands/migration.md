---
description: Create an Alembic migration for schema changes. Usage — /migration <short description>
argument-hint: <description>  (e.g. "add orders table", "add email index to users")
allowed-tools: Bash, Read
---

Migration description: $ARGUMENTS

Current migration history:
!`cd backend && uv run alembic history --verbose 2>/dev/null | head -20`

Current models registered:
!`grep -r "class.*Base" backend/app/models/ 2>/dev/null | grep -v __pycache__`

---

Create an Alembic migration for: "$ARGUMENTS"

## Steps

1. Verify models are imported in `backend/app/models/__init__.py` (must import ALL models to register them with metadata):
```bash
cat backend/app/models/__init__.py
```

2. Generate migration:
```bash
cd backend && uv run alembic revision --autogenerate -m "$ARGUMENTS"
```

3. Read the generated migration file and display it:
```bash
ls -t backend/alembic/versions/*.py | head -1 | xargs cat
```

4. Audit the generated migration against this checklist:
- `upgrade()` creates the right table/column/index
- `downgrade()` is the exact reverse (drop/remove)
- No changes to tables you didn't modify (autogenerate sometimes picks up unrelated drift)
- Column types and nullable match the SQLAlchemy model
- Indexes on FK columns and commonly-queried fields are present
- Enum values match exactly (autogen often misses enum changes)

5. Print:
```
✅ Migration created: alembic/versions/<timestamp>_<slug>.py

Review checklist:
  □ upgrade() creates correct schema
  □ downgrade() is exact reverse
  □ No unrelated table changes included
  □ Enum values are complete (autogen misses these)
  □ FK indexes present

Apply when Postgres is running:
  cd backend && uv run alembic upgrade head

Rollback:
  cd backend && uv run alembic downgrade -1
```

**IMPORTANT:** Never auto-apply the migration. The user must review + run `alembic upgrade head` manually.
