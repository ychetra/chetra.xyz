#!/usr/bin/env bash
# verify-site.sh — hard gate for site-loop iterations: build must pass, raw JS total < 200KB.
# Visual checks (playwright 375/1440) are the builder's job for visual diffs; this covers what's scriptable.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== build =="
npm run build

echo "== js budget =="
BUDGET=$((200 * 1024))
TOTAL=$(find dist -name '*.js' -type f -print0 | xargs -0 stat -f%z 2>/dev/null | awk '{s+=$1} END {print s+0}')
PAGES=$(find dist -name 'index.html' | wc -l | tr -d ' ')
echo "raw JS total: ${TOTAL} bytes (budget ${BUDGET}) across ${PAGES} pages"
if [ "$TOTAL" -ge "$BUDGET" ]; then
    echo "FAIL: JS budget exceeded"
    exit 1
fi

echo "VERIFY OK — build passed, JS ${TOTAL}/${BUDGET} bytes, ${PAGES} pages"
