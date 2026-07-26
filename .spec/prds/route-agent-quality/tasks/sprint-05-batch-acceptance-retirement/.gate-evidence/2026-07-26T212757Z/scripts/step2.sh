#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"
EVD="/Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.gate-evidence/2026-07-26T212757Z"
source "$EVD/qa-state.env"
IDENTITY='{"subject":"dev-founder-redhatfix09","issuer":"https://laneshadow.test"}'
OUT=$(npx convex run curatedGeometry:coverageReport "{\"runId\":\"$BATCH_RUN_ID\"}" --identity "$IDENTITY" 2>/dev/null)
python3 - <<'PY' "$OUT" "$EVD"
import json,sys
from pathlib import Path
raw=sys.argv[1]
d=json.loads(raw[raw.find('{'):])
Path(sys.argv[2],'coverage-report.json').write_text(json.dumps(d,indent=2)+'\n')
print(json.dumps({k:d.get(k) for k in ['runId','source','totalCostUSD','riderReadyCount','isDone','levers'] if k!='levers'}, indent=2))
levers=d.get('levers') or []
print('levers', [(x.get('lever'), x.get('candidateCount'), x.get('passRate')) for x in levers])
assert float(d.get('totalCostUSD') or d.get('pageCostUSD') or 0) > 0
print('MUST_OBSERVE coverageReport levers cost telemetry')
PY
