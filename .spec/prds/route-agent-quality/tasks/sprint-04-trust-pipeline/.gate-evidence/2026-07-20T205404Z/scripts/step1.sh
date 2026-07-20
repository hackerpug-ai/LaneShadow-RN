#!/usr/bin/env bash
# REDHAT-FIX-01 corrected step1: the production `runSampleWaterfall` entry NO
# LONGER accepts the deterministic `lever2FixedGeometry` seam (removed by
# FIX-01). This step now exercises REAL Google Geocoding/Routes + the real
# geometry/orchestrator LLM tiers on REAL catalog routes.
#
# Prerequisite: REAL catalog routes must be loaded into the deployment (the dev
# deployment currently has only fixtures + 1 real seeded route). Pass real
# routeIds via ROUTE_IDS (space-separated). The gate is BLOCKED until a real
# ~25-route catalog exists — see GATE-RESULTS.md.
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
ID='{"subject":"s4-human-gate","issuer":"https://laneshadow.test"}'
# Default to the one real route currently seeded, so the step is runnable and
# produces honest real-provider evidence. Override ROUTE_IDS for a full sample.
ROUTE_IDS="${ROUTE_IDS:-motorcycleroads:twist-of-tepusquet-loop}"
# Build the JSON routeIds array from the space-separated list.
ROUTE_JSON=$(printf '%s\n' "$ROUTE_IDS" | python3 -c "import sys,json;print(json.dumps(sys.stdin.read().split()))")
npx convex run waterfallOrchestrator:runSampleWaterfall "{\"routeIds\":$ROUTE_JSON,\"maxCost\":3}" --identity "$ID" > /tmp/s4-step1-raw.json 2>/dev/null
python3 - <<'PY'
import json
raw = open('/tmp/s4-step1-raw.json').read()
lines = [l for l in raw.splitlines() if not l.startswith('[CONVEX')]
d = json.loads('\n'.join(lines))
assert 'routes' in d and len(d['routes']) >= 1
print(json.dumps({'ok': True, 'processed': d.get('processed'),
                  'routes': len(d['routes']),
                  'totalCostUsd': d.get('totalCostUsd'),
                  'states': sorted({r.get('terminalState') for r in d['routes']})}))
PY
