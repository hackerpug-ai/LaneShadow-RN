#!/usr/bin/env bash
# Step 1: cost-bearing runFullBatch after ensuring couch gate + unresolved routes
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../../../.." && pwd)"
# fix path: scripts are under .spec/.../.gate-evidence/RUN/scripts
ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ]; then ROOT="/Users/inference1/Projects/LaneShadow-RN"; fi
cd "$ROOT"
STATE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
IDENTITY='{"subject":"dev-founder-redhatfix09","issuer":"https://laneshadow.test"}'
BATCH_RUN_ID="s5-qa-$(date -u +%Y%m%dT%H%M%SZ)"
echo "BATCH_RUN_ID=$BATCH_RUN_ID" > "$STATE_DIR/qa-state.env"
# seed 3 unresolved production-like routes for cost-bearing work
npx convex run curatedGeometry:seedRedhatFix07CoveragePool "{\"prefix\":\"bestbikingroads:s5qa-cost-\",\"scraped\":0,\"ai\":0,\"nameRouted\":0,\"generatedScraped\":0,\"unresolvedName\":3}" --identity "$IDENTITY" 2>&1 || \
npx convex run curatedGeometry:seedS5T1CoverageFixture "{\"routeIdPrefix\":\"bestbikingroads:s5qa-\"}" --identity "$IDENTITY" 2>&1 || true
# try seed helper from FIX-09 if available
npx convex run curatedGeometry:seedRedhatFix09CostBearingPool '{"count":3}' --identity "$IDENTITY" 2>&1 || true
# list membership: pick unresolved bestbikingroads:s5qa*
# Run membership batch
ARGS=$(python3 - <<PY
import json, time
print(json.dumps({
  "runId": "$BATCH_RUN_ID",
  "maxCostUSD": 2,
  "routeIdPrefix": "bestbikingroads:s5qa",
  "mode": "all",
}))
PY
)
# Fallback: use motorcycleroads unresolved prefix from earlier fix pattern
OUT=$(npx convex run waterfallOrchestrator:runFullBatch "$ARGS" --identity "$IDENTITY" 2>&1) || true
echo "$OUT"
# If processed=0, try explicit routeIds from seed cost pool
if echo "$OUT" | python3 -c "import sys,json; d=json.load(sys.stdin); raise SystemExit(0 if (d.get('processed') or 0)>0 else 1)" 2>/dev/null; then
  echo "$OUT" | tee "$STATE_DIR/batch-result.json"
  echo "BATCH_RUN_ID=$BATCH_RUN_ID" >> "$STATE_DIR/qa-state.env"
  exit 0
fi
# Alternative: re-process known cost routes from FIX-09 prefix
ARGS2=$(python3 - <<PY
import json
print(json.dumps({
  "runId": "$BATCH_RUN_ID",
  "maxCostUSD": 2,
  "routeIdPrefix": "bestbikingroads:redhatfix09-cost-",
  "mode": "all",
}))
PY
)
OUT2=$(npx convex run waterfallOrchestrator:runFullBatch "$ARGS2" --identity "$IDENTITY" 2>&1)
echo "$OUT2" | tee "$STATE_DIR/batch-result.json"
# require cost-bearing
python3 - <<'PY'
import json,sys
from pathlib import Path
p=Path(sys.argv[1])
d=json.loads(p.read_text())
proc=int(d.get('processed') or 0)
cost=float(d.get('totalCostUSD') or d.get('cumulativeCostUSD') or 0)
print(f"processed={proc} totalCostUSD={cost}")
if proc < 1 or cost <= 0:
  # also accept pageTotals cost
  pages=d.get('pageTotals') or []
  pc=sum(float(x.get('totalCostUsd') or 0) for x in pages)
  print(f"pageCost={pc}")
  if proc < 1 or pc <= 0:
    sys.exit(1)
PY
"$STATE_DIR/batch-result.json"
echo "BATCH_RUN_ID=$BATCH_RUN_ID" > "$STATE_DIR/qa-state.env"
