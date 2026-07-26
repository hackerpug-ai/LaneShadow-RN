#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"
IDENTITY='{"subject":"dev-founder-redhatfix09","issuer":"https://laneshadow.test"}'
EVD="/Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.gate-evidence/2026-07-26T212757Z"
# Independent QA: seed + cost-bearing runFullBatch
SEED=$(npx convex run curatedGeometry:seedRedhatFix07CoveragePool   '{"prefix":"bestbikingroads:s5qa2-cost-","startIndex":0,"count":3,"geometryStatus":"unresolved","geometryProvenance":"name_routed"}'   --identity "$IDENTITY" 2>/dev/null)
python3 - <<'PY' "$SEED" "$EVD"
import json,sys
from pathlib import Path
raw=sys.argv[1]
d=json.loads(raw[raw.find('{'):])
Path(sys.argv[2],'seed-step1.json').write_text(json.dumps(d,indent=2)+'\n')
print('seeded', d['routeIds'])
open(Path(sys.argv[2])/'route-ids.json','w').write(json.dumps(d['routeIds']))
PY
ROUTE_IDS=$(cat "$EVD/route-ids.json")
BATCH_RUN_ID="s5-qa-live-$(date -u +%Y%m%dT%H%M%SZ)"
ARGS=$(python3 -c "import json; print(json.dumps({'routeIds': json.loads(open('$EVD/route-ids.json').read()), 'maxCost': 2.0, 'runId': '$BATCH_RUN_ID'}))")
OUT=$(npx convex run waterfallOrchestrator:runFullBatch "$ARGS" --identity "$IDENTITY" 2>/dev/null)
python3 - <<'PY' "$OUT" "$EVD" "$BATCH_RUN_ID"
import json,sys
from pathlib import Path
raw=sys.argv[1]
d=json.loads(raw[raw.find('{'):])
Path(sys.argv[2],'batch-result.json').write_text(json.dumps(d,indent=2)+'\n')
Path(sys.argv[2],'qa-state.env').write_text(f"BATCH_RUN_ID={sys.argv[3]}\n")
print(json.dumps({k:d.get(k) for k in ['runId','processed','totalCostUSD','isDone','batchStopReason']}, indent=2))
assert int(d.get('processed') or 0) >= 1
assert float(d.get('totalCostUSD') or 0) > 0
print('MUST_OBSERVE processed>=1 totalCostUSD>0')
PY
