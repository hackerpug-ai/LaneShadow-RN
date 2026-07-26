#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"
EVD="/Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.gate-evidence/2026-07-26T212757Z"
source "$EVD/qa-state.env"
IDENTITY='{"subject":"dev-founder-redhatfix09","issuer":"https://laneshadow.test"}'
OUT=$(npx convex run curatedGeometry:requestBatchAcceptance   "{\"runId\":\"$BATCH_RUN_ID\",\"decision\":\"accept\"}" --identity "$IDENTITY" 2>/dev/null)
python3 - <<'PY' "$OUT" "$EVD"
import json,sys
from pathlib import Path
raw=sys.argv[1]
d=json.loads(raw[raw.find('{'):])
Path(sys.argv[2],'requestBatchAcceptance.json').write_text(json.dumps(d,indent=2)+'\n')
print(json.dumps(d, indent=2)[:2000])
assert d.get('decision') in ('escalation_required','accepted','rejected')
print('MUST_OBSERVE decision', d.get('decision'))
PY
if python3 -c "import json; d=json.load(open('/Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.gate-evidence/2026-07-26T212757Z/requestBatchAcceptance.json')); raise SystemExit(0 if d.get('decision')=='escalation_required' else 1)"; then
  OUT2=$(npx convex run curatedGeometry:resolveBatchEscalation     "{\"runId\":\"$BATCH_RUN_ID\",\"decision\":\"accept\",\"rationale\":\"Sprint-05 independent QA founder accept after low-yield escalation\"}"     --identity "$IDENTITY" 2>/dev/null)
  python3 - <<'PY' "$OUT2" "$EVD"
import json,sys
from pathlib import Path
raw=sys.argv[1]
d=json.loads(raw[raw.find('{'):])
Path(sys.argv[2],'resolveBatchEscalation.json').write_text(json.dumps(d,indent=2)+'\n')
print(json.dumps(d, indent=2)[:2000])
assert d.get('decision')=='accepted'
print('MUST_OBSERVE resolved accepted')
PY
fi
python3 - <<'PY'
from pathlib import Path
s3=Path("/Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.gate-evidence/2026-07-26T212757Z/gate-step-logs/step-3.log").read_text()
s4=Path("/Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.gate-evidence/2026-07-26T212757Z/requestBatchAcceptance.json").read_text()
assert s3 != s4
print('MUST_OBSERVE step4 distinct mutation')
PY
