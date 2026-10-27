#!/usr/bin/env bash
# Runs the remaining live checks once API credits are available (about 8 runs, roughly $1 to $2 in total).
# Usage: bash scripts/live-tests.sh
# Writes logs to .data/live-tests/, v2 eval guides to verification/raw/<slug>.v2.json, then runs npm run eval.
set -u
cd "$(dirname "$0")/.."
out=.data/live-tests
mkdir -p "$out"

run() { # name query [raw-slug]
  local name="$1" query="$2" raw="${3:-}"
  rm -rf "$out/$name" && mkdir -p "$out/$name"
  npm run generate -- "$query" --out "$out/$name" > "$out/$name.log" 2>&1
  local file
  file=$(ls "$out/$name"/*.json 2>/dev/null | head -1)
  if [ -n "$raw" ] && [ -n "$file" ]; then cp "$file" "verification/raw/$raw.v2.json"; fi
  printf '%-22s %s\n' "$name" "$(grep -E '^summary|^error' "$out/$name.log" | tr '\n' ' ')"
}

echo "== Live tests for docs/LIVE_TESTS.md"
run no-seed-saas "Linear"
run url-input "https://www.figma.com"
run ambiguous "Google"
run no-oauth "OpenAI API"
run nonsense "Blorpify Zzz"
run no-public-api "BeReal"

echo "== Prompt v2 re-runs for docs/EVAL.md"
run v2-microsoft "Microsoft Outlook" microsoft-outlook
run v2-linkedin "LinkedIn" linkedin

echo "v2 guides written: $(ls verification/raw/*.v2.json 2>/dev/null | wc -l | tr -d " ") (expect 2)"
npm run eval > /dev/null && echo "docs/EVAL.md updated"
