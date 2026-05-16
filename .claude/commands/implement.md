---
description: Implement the next unticked task from a feature's spec. Reads tasks.md, implements exactly one task, verifies, prompts to commit. Usage — /implement <feature-name>
argument-hint: <feature-name>  (e.g. "orders", "products", "payments")
allowed-tools: Read, Write, Edit, Bash, Glob
---

Feature name: $ARGUMENTS

## Step 1 — Find the spec folder

Run:
!`ls docs/specs/ 2>/dev/null | grep -i "$ARGUMENTS" | head -5`

If NO spec folder found, stop and print:
```
❌ Không tìm thấy spec cho '$ARGUMENTS'.
Chạy /spec $ARGUMENTS trước để tạo spec.
```

## Step 2 — Read the full spec (all 4 files)

Read these files in order:
1. `docs/specs/<NN>-$ARGUMENTS/tasks.md` — xem task nào chưa tick
2. `docs/specs/<NN>-$ARGUMENTS/design.md` — hiểu API, schema, flow
3. `docs/specs/<NN>-$ARGUMENTS/requirements.md` — hiểu scope + out-of-scope
4. `docs/specs/<NN>-$ARGUMENTS/checklist.md` — biết tiêu chí "xong"

## Step 3 — Show current task status

Print a summary like this:
```
📋 Spec: docs/specs/<NN>-$ARGUMENTS/

Task status:
  ✅ T1 (15') — [description] — DONE
  ✅ T2 (20') — [description] — DONE
  ⬜ T3 (20') — [description] — NEXT ← sẽ implement task này
  ⬜ T4 (25') — [description]
  ⬜ T5 (15') — [description]

Implementing: T3 — [full description]
Files to touch: [list from tasks.md]
```

If ALL tasks are ticked, print:
```
✅ Tất cả tasks đã hoàn thành!
Chạy /implement $ARGUMENTS --checklist để verify toàn bộ checklist.
```
Then stop.

## Step 4 — Implement EXACTLY the next unticked task

Rules:
- Implement **ONE task only** — không làm sang task kế tiếp dù đơn giản
- Follow `design.md` exactly: endpoint paths, field names, HTTP status codes, schema structure
- Follow stack rules: `backend/CLAUDE.md` for Python, `frontend/CLAUDE.md` for TypeScript
- Do NOT add fields, endpoints, or logic not in the spec
- Do NOT refactor unrelated code

After writing code, immediately run verification:

### For backend tasks:
```bash
cd backend && uv run pytest -q 2>&1 | tail -5
cd backend && uv run ruff check . 2>&1 | head -10
cd backend && uv run mypy app 2>&1 | tail -5
```

### For frontend tasks:
```bash
cd frontend && npm run typecheck 2>&1 | tail -5
cd frontend && npm run build 2>&1 | tail -5
```

### For both:
Run whichever applies to the task just implemented.

## Step 5 — Verification Gate

After running tests, print the verification result:

```
**Verification — T[N]: [task name]**
1. Files created/modified: [list with line counts]
2. Tests: [X passed, 0 failed] — ✅ / ❌
3. Type check: ✅ / ❌ [error if any]
4. Ruff: ✅ / ❌ [error if any]
```

If any check fails:
- Fix the issue immediately
- Re-run the failing check
- Do NOT proceed to Step 6 until all green

## Step 6 — Prompt to commit

Print exactly:
```
✅ T[N] xong. Verify passed.

Để commit và tick task, chạy:
  git add [specific files]
  git commit -m "[suggested commit message from tasks.md]"

Sau đó tick trong tasks.md:
  - [x] T[N] ✅ — [description]

Gọi /implement $ARGUMENTS để tiếp tục task kế tiếp.
```

Do NOT commit automatically — let the user confirm.

---

## Special flag: --checklist

If user runs `/implement $ARGUMENTS --checklist`:

Read `docs/specs/<NN>-$ARGUMENTS/checklist.md` and run every verification command listed.
Print pass/fail for each item.
Print summary: "X/Y checklist items passed."
If all pass: "Feature '$ARGUMENTS' có thể đánh dấu ✅ Implemented."
