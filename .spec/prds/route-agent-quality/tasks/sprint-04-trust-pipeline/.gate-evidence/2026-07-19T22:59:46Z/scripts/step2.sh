#!/usr/bin/env bash
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
ID='{"subject":"s4-human-gate","issuer":"https://laneshadow.test"}'
npx convex run waterfallOrchestrator:runSampleWaterfall '{"routeIds":["test:lever1-pass","test:lever2-pass","test:review-candidate"],"maxCost":5,"lever2FixedGeometry":{"routedMiles":41,"pointCount":80,"anchorCount":2,"claimedMiles":41}}' --identity "$ID" | tee /tmp/s4-step2-waterfall.json
python3 - <<'PY'
import json
d=json.load(open('/tmp/s4-step2-waterfall.json'))
rs=d.get('routes') or []
assert rs, 'no routes'
bad=[r for r in rs if not r.get('terminalState')]
assert not bad, bad
# exactly one terminal state per route
for r in rs:
    assert isinstance(r['terminalState'], str) and r['terminalState']
print(json.dumps({'ok':True,'count':len(rs),'states':sorted({r['terminalState'] for r in rs})}))
PY
