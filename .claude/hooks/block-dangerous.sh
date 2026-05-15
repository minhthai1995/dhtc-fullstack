#!/usr/bin/env bash
# PreToolUse hook — blocks known destructive Bash commands before execution.
# Exit 2 = block with message. Exit 0 = allow.

INPUT=$(cat)
CMD=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('command',''))" 2>/dev/null || echo "")

block() {
  echo "$1" >&2
  exit 2
}

# Block force push to main/master
echo "$CMD" | grep -qE 'git push.*(--force|-f).*(main|master)' && \
  block "BLOCKED: force push to main/master is forbidden. Use a PR instead."

# Block --no-verify
echo "$CMD" | grep -qE 'git commit.*--no-verify' && \
  block "BLOCKED: --no-verify skips pre-commit hooks. Fix the hook failure instead."

# Block hard reset on pushed branch
echo "$CMD" | grep -qE 'git reset --hard HEAD~[0-9]+' && \
  block "BLOCKED: git reset --hard on published history. Use git revert if already pushed."

# Block rm -rf on important directories
echo "$CMD" | grep -qE 'rm -rf.*(backend|frontend|\.git)/' && \
  block "BLOCKED: rm -rf on critical directory. Confirm with user first."

# Allow everything else
exit 0
