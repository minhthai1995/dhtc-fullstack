---
description: Scaffold a new full-stack feature (backend router + crud + schema + frontend feature folder). Usage — /feature <name>
argument-hint: <feature-name>  (e.g. "orders", "products", "payments")
allowed-tools: Read, Write, Bash, Glob
---

Feature name: $ARGUMENTS

Existing backend routes:
!`ls backend/app/api/v1/*.py 2>/dev/null | xargs -I{} basename {}`

Existing frontend features:
!`ls frontend/src/features/ 2>/dev/null`

---

Scaffold the feature "$ARGUMENTS" across both backend and frontend. Follow these steps exactly:

## 1. Backend — create 5 files

### `backend/app/models/<name>.py`
SQLAlchemy model (adjust fields as needed):
```python
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin

class <PascalName>(Base, TimestampMixin):
    __tablename__ = "<name>s"
    id: Mapped[int] = mapped_column(primary_key=True)
    # TODO: add domain fields here
```

### `backend/app/schemas/<name>.py`
Pydantic DTOs:
```python
from pydantic import BaseModel, ConfigDict

class <PascalName>Create(BaseModel):
    pass  # TODO: add fields

class <PascalName>Read(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    # TODO: add fields
```

### `backend/app/crud/<name>.py`
Pure DB operations (no business logic):
```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.<name> import <PascalName>

async def get_all(db: AsyncSession) -> list[<PascalName>]:
    result = await db.execute(select(<PascalName>))
    return list(result.scalars().all())

async def get_by_id(db: AsyncSession, id: int) -> <PascalName> | None:
    result = await db.execute(select(<PascalName>).where(<PascalName>.id == id))
    return result.scalars().first()
```

### `backend/app/services/<name>.py`
Business logic layer (empty skeleton):
```python
# Business logic for <name> domain.
# Orchestrate crud calls, apply rules, raise domain exceptions here.
```

### `backend/app/api/v1/<name>.py`
FastAPI router:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.crud import <name> as <name>_crud
from app.deps import current_user
from app.models.user import User
from app.schemas.<name> import <PascalName>Read

router = APIRouter(prefix="/<name>s", tags=["<name>s"])

@router.get("/", response_model=list[<PascalName>Read])
async def list_<name>s(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(current_user),
) -> list[<PascalName>Read]:
    return await <name>_crud.get_all(db)

@router.get("/{id}", response_model=<PascalName>Read)
async def get_<name>(
    id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(current_user),
) -> <PascalName>Read:
    item = await <name>_crud.get_by_id(db, id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return item
```

## 2. Wire router

Add to `backend/app/api/v1/__init__.py`:
```python
from app.api.v1 import <name>
api_router.include_router(<name>.router)
```

Also add to `backend/app/models/__init__.py`:
```python
from app.models.<name> import <PascalName>  # noqa: F401
```

## 3. Frontend — create feature folder

### `frontend/src/features/<name>/<name>.api.ts`
```typescript
import { api } from '@/lib/axios'

export interface <PascalName>Read {
  id: number
  // TODO: add fields
}

export const <name>Api = {
  list: () => api.get<<PascalName>Read[]>('/<name>s').then(r => r.data),
  get: (id: number) => api.get<<PascalName>Read>(`/<name>s/${id}`).then(r => r.data),
}
```

### `frontend/src/features/<name>/use<PascalName>.ts`
```typescript
import { useQuery } from '@tanstack/react-query'
import { <name>Api } from './<name>.api'

export const <name>Keys = {
  all: ['<name>s'] as const,
  detail: (id: number) => ['<name>s', id] as const,
}

export function use<PascalName>List() {
  return useQuery({ queryKey: <name>Keys.all, queryFn: <name>Api.list })
}
```

## 4. After scaffolding — print checklist

```
✅ Scaffolded: <name>

Backend:
  backend/app/models/<name>.py
  backend/app/schemas/<name>.py
  backend/app/crud/<name>.py
  backend/app/services/<name>.py
  backend/app/api/v1/<name>.py
  ↳ wired in api/v1/__init__.py + models/__init__.py

Frontend:
  frontend/src/features/<name>/<name>.api.ts
  frontend/src/features/<name>/use<PascalName>.ts

Next steps:
1. Fill in TODO fields in model + schema
2. Run: cd backend && uv run alembic revision --autogenerate -m "add <name>s table"
3. Review generated migration file before applying
4. Add page: frontend/src/pages/<PascalName>Page.tsx
5. Wire route in frontend/src/App.tsx
```
