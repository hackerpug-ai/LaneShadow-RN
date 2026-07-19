#!/usr/bin/env bash
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
ID='{"subject":"s4-human-gate","issuer":"https://laneshadow.test"}'
npx convex run waterfallOrchestrator:seedWaterfallFixtures '{}' --identity "$ID"
npx convex run waterfallOrchestrator:runSampleWaterfall '{"routeIds":["test:lever1-pass","test:lever2-pass","test:review-candidate"],"maxCost":5,"lever2FixedGeometry":{"routedMiles":41,"pointCount":80,"anchorCount":2,"claimedMiles":41}}' --identity "$ID" | tee /tmp/s4-step1-waterfall.json
python3 - <<'PY'
import json
d=json.load(open('/tmp/s4-step1-waterfall.json'))
assert 'routes' in d and len(d['routes'])>=1
print(json.dumps({'ok':True,'processed':d.get('processed'),'routes':len(d['routes']),'states':sorted({r.get('terminalState') for r in d['routes']})}))
PY
