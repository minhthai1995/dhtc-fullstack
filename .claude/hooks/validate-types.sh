#!/usr/bin/env bash
# PostToolUse hook — reminds to run type checks after editing Python or TypeScript files.
# Prints a reminder (exit 0 = non-blocking).

INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file_path',''))" 2>/dev/null || echo "")

if echo "$FILE" | grep -qE 'backend/.*\.py$'; then
  echo "Reminder: run 'cd backend && uv run mypy app' to check types." >&2
fi

if echo "$FILE" | grep -qE 'frontend/.*\.(ts|tsx)$'; then
  echo "Reminder: run 'cd frontend && npm run typecheck' to check types." >&2
fi

exit 0
