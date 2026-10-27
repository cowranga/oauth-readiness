#!/usr/bin/env bash
# Fails if any tracked (or staged) file looks like it holds a secret.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

files=$(git ls-files --cached --others --exclude-standard)
status=0

env_files=$(printf '%s\n' "$files" | grep -E '(^|/)\.env' | grep -vE '(^|/)\.env\.example$' || true)
if [ -n "$env_files" ]; then
  echo "check-secrets: env files would be committed:"; echo "$env_files"; status=1
fi

pattern='sk-ant-[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY|xox[bpa]-[A-Za-z0-9-]{8,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|client_secret["'"'"' ]*[:=][ "'"'"']*[A-Za-z0-9_\-]{12,}'
hits=$(printf '%s\n' "$files" | grep -vE '^scripts/check-secrets\.sh$' | while read -r f; do
  [ -f "$f" ] && grep -IEn "$pattern" "$f" 2>/dev/null | sed "s|^|$f:|" | cut -c1-120 || true
done)
if [ -n "$hits" ]; then
  echo "check-secrets: secret-looking strings found:"; echo "$hits"; status=1
fi

[ $status -eq 0 ] && echo "check-secrets: ok"
exit $status
